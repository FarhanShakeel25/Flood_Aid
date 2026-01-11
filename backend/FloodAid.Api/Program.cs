using FloodAid.Api.Models;
using FloodAid.Api.Services;
using FloodAid.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using Npgsql;
using System.Data.Common;
using System.Data;

namespace FloodAid.Api
{
    static class Program
    {
        static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add CORS policy before builder.Build()
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", x =>
                    x.AllowAnyOrigin()
                     .AllowAnyHeader()
                     .AllowAnyMethod());
            });

            // Configure JWT Authentication as per SRS Section 3.3.2
            var jwtSettings = builder.Configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];
            
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!)),
                    ClockSkew = TimeSpan.Zero
                };
                // Handle authentication challenge and forbidden responses with JSON
                options.Events = new JwtBearerEvents
                {
                    OnChallenge = context =>
                    {
                        context.HandleResponse();
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.Response.ContentType = "application/json";
                        return context.Response.WriteAsJsonAsync(new { message = "Unauthorized: Missing or invalid token" });
                    },
                    OnForbidden = context =>
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json";
                        return context.Response.WriteAsJsonAsync(new { message = "Forbidden: Insufficient permissions" });
                    }
                };
            });

            builder.Services.AddAuthorization();

            // Register Database Context
            builder.Services.AddDbContext<FloodAidContext>(options =>
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

            // Add controllers
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                });

            // Register HttpClientFactory for EmailService
            builder.Services.AddHttpClient();

            // Register EmailService
            builder.Services.AddScoped<IEmailService, EmailService>();

            // Add services to the container.
            builder.Services.AddOpenApi();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Apply CORS after builder.Build(), before endpoints
            app.UseCors("AllowAll");

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // Disable HTTPS redirect in development
            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            // Add Authentication & Authorization middleware
            app.UseAuthentication();
            app.UseAuthorization();

            // Map controllers
            app.MapControllers();


            List<Donation> Donations = new();
            var donation1 = new Donation(Enums.DonationType.Cash, "PK7666tgww")
            {
                DonationAmount = 2000,
                DonorName = "Ali"
            };
            Donations.Add(donation1);

            app.MapGet("/api/donations",() =>
            {
                return Donations;
            });


            // Dummy endpoint for frontend testing
            app.MapGet("/api/dummy", () =>
            {
                var donors = new[]
                {
                    new { id = 1, name = "Ali", bloodGroup = "A+", city = "Lahore" },
                    new { id = 2, name = "Sara", bloodGroup = "B+", city = "Karachi" },
                    new { id = 3, name = "Omar", bloodGroup = "O-", city = "Islamabad" }
                };

                return donors;
            });


            // Health check endpoint for Render monitoring
            app.MapGet("/health", () => new { status = "ok", timestamp = DateTime.UtcNow })
                .WithName("HealthCheck")
                .WithOpenApi();

            // Initialize database, seed provinces/cities, and admin (safe for existing DB)
            await app.InitializeDatabaseAsync(app.Configuration);

            app.Run();
        }

        static async Task InitializeDatabaseAsync(this WebApplication app, IConfiguration configuration)
        {
            using var scope = app.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<FloodAidContext>();
            var loggerFactory = scope.ServiceProvider.GetRequiredService<ILoggerFactory>();
            var logger = loggerFactory.CreateLogger("DatabaseInit");
            
            // Run migrations, but skip if schema already exists to avoid baseline conflicts
            try
            {
                await context.Database.MigrateAsync();
                logger.LogInformation("Database migrations applied");
            }
            catch (Exception ex)
            {
                var pgEx = ex as PostgresException ?? ex.InnerException as PostgresException;
                if (pgEx != null && pgEx.SqlState == "42P07") // relation already exists
                {
                    logger.LogWarning("Existing schema detected; skipping initial baseline migration.");
                }
                else
                {
                    throw;
                }
            }

            // Ensure Provinces/Cities tables exist for legacy databases where baseline partially existed
            await EnsureGeoTablesAsync(context, logger);
            // Ensure Admins.ProvinceId column exists for legacy Admins table
            await EnsureAdminScopeAsync(context, logger);
            // Ensure HelpRequests has province/city scoping columns
            await EnsureHelpRequestScopeAsync(context, logger);
            // Ensure Users table exists for legacy databases
            await EnsureUsersTableAsync(context, logger);
            // Ensure Users table has all required columns
            await EnsureUsersColumnsAsync(context, logger);
            
            // Seed provinces and cities from CSV
            await SeedData.SeedProvincesAndCitiesAsync(context, loggerFactory.CreateLogger("DatabaseInit"));
            
            // Create or update admin from configuration (no deletion; safe updates only)
            var adminConfig = configuration.GetSection("AdminCredentials");
            if (adminConfig.Exists() &&
                !string.IsNullOrWhiteSpace(adminConfig["Email"]) &&
                !string.IsNullOrWhiteSpace(adminConfig["Username"]) &&
                !string.IsNullOrWhiteSpace(adminConfig["PasswordHash"]) &&
                !string.IsNullOrWhiteSpace(adminConfig["Name"]))
            {
                var email = adminConfig["Email"]!;
                var existingAdmin = await context.Admins.FirstOrDefaultAsync(a => a.Email == email);

                if (existingAdmin == null)
                {
                    var newAdmin = new AdminUser
                    {
                        Email = email,
                        Username = adminConfig["Username"]!,
                        PasswordHash = adminConfig["PasswordHash"]!,
                        Name = adminConfig["Name"]!,
                        Role = "SuperAdmin",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        LastLoginAt = null
                    };
                    context.Admins.Add(newAdmin);
                    logger.LogInformation("Admin user created successfully");
                }
                else
                {
                    // Only update non-password fields on existing admin
                    existingAdmin.Username = adminConfig["Username"]!;
                    existingAdmin.Name = adminConfig["Name"]!;
                    existingAdmin.Role = "SuperAdmin";
                    existingAdmin.IsActive = true;
                    logger.LogInformation("Admin user updated (password preserved)");
                }
                await context.SaveChangesAsync();
            }
            else
            {
                logger.LogWarning("AdminCredentials not fully configured; skipping admin sync.");
            }
        }

        static async Task EnsureGeoTablesAsync(FloodAidContext context, ILogger logger)
        {
            var connection = context.Database.GetDbConnection();
            var openedHere = false;
            if (connection.State != ConnectionState.Open)
            {
                await connection.OpenAsync();
                openedHere = true;
            }

            var provincesExists = await TableExistsAsync(connection, "Provinces");
            var citiesExists = await TableExistsAsync(connection, "Cities");

            if (provincesExists && citiesExists)
            {
                return;
            }

            logger.LogWarning("Geo tables missing (Provinces: {Provinces}, Cities: {Cities}); creating if absent.", provincesExists, citiesExists);

            // Create Provinces
            const string createProvinces = @"CREATE TABLE IF NOT EXISTS ""Provinces"" (
                ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                ""Name"" text NOT NULL,
                ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            );";

            // Create Cities
            const string createCities = @"CREATE TABLE IF NOT EXISTS ""Cities"" (
                ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                ""Name"" text NOT NULL,
                ""ProvinceId"" integer NOT NULL,
                ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                CONSTRAINT ""FK_Cities_Provinces_ProvinceId"" FOREIGN KEY (""ProvinceId"") REFERENCES ""Provinces"" (""Id"") ON DELETE CASCADE
            );";

            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = createProvinces;
                await cmd.ExecuteNonQueryAsync();
            }

            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = createCities;
                await cmd.ExecuteNonQueryAsync();
            }

            logger.LogInformation("Geo tables ensured/created successfully.");

            if (openedHere)
            {
                await connection.CloseAsync();
            }
        }

        static async Task<bool> TableExistsAsync(DbConnection connection, string tableName)
        {
            const string sql = @"SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = @p";
            using var cmd = connection.CreateCommand();
            cmd.CommandText = sql;

            var param = cmd.CreateParameter();
            param.ParameterName = "@p";
            param.Value = tableName;
            cmd.Parameters.Add(param);

            var result = await cmd.ExecuteScalarAsync();
            return result != null;
        }

        static async Task<bool> ColumnExistsAsync(DbConnection connection, string tableName, string columnName)
        {
            const string sql = @"SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = @table AND column_name = @column";
            using var cmd = connection.CreateCommand();
            cmd.CommandText = sql;

            var tableParam = cmd.CreateParameter();
            tableParam.ParameterName = "@table";
            tableParam.Value = tableName;
            cmd.Parameters.Add(tableParam);

            var columnParam = cmd.CreateParameter();
            columnParam.ParameterName = "@column";
            columnParam.Value = columnName;
            cmd.Parameters.Add(columnParam);

            var result = await cmd.ExecuteScalarAsync();
            return result != null;
        }

        static async Task EnsureAdminScopeAsync(FloodAidContext context, ILogger logger)
        {
            var connection = context.Database.GetDbConnection();
            var openedHere = false;
            if (connection.State != ConnectionState.Open)
            {
                await connection.OpenAsync();
                openedHere = true;
            }

            // Check if column exists
            const string columnSql = @"SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = @t AND column_name = @c";
            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = columnSql;
                var pTable = cmd.CreateParameter();
                pTable.ParameterName = "@t";
                pTable.Value = "Admins";
                cmd.Parameters.Add(pTable);

                var pCol = cmd.CreateParameter();
                pCol.ParameterName = "@c";
                pCol.Value = "ProvinceId";
                cmd.Parameters.Add(pCol);

                var exists = await cmd.ExecuteScalarAsync() != null;
                if (!exists)
                {
                    logger.LogWarning("Admins.ProvinceId missing; adding nullable column and FK.");
                    // Add column
                    const string addCol = "ALTER TABLE \"Admins\" ADD COLUMN \"ProvinceId\" integer NULL;";
                    using (var alter = connection.CreateCommand())
                    {
                        alter.CommandText = addCol;
                        await alter.ExecuteNonQueryAsync();
                    }
                }
            }

            // Ensure FK exists
            const string fkCheck = @"SELECT 1 FROM pg_constraint WHERE conname = 'FK_Admins_Provinces_ProvinceId'";
            using (var fkCmd = connection.CreateCommand())
            {
                fkCmd.CommandText = fkCheck;
                var fkExists = await fkCmd.ExecuteScalarAsync() != null;
                if (!fkExists)
                {
                    const string addFk = @"ALTER TABLE ""Admins"" ADD CONSTRAINT ""FK_Admins_Provinces_ProvinceId"" FOREIGN KEY (""ProvinceId"") REFERENCES ""Provinces"" (""Id"") ON DELETE SET NULL;";
                    using (var addFkCmd = connection.CreateCommand())
                    {
                        addFkCmd.CommandText = addFk;
                        await addFkCmd.ExecuteNonQueryAsync();
                    }
                }
            }

            logger.LogInformation("Admins scope ensured.");

            if (openedHere)
            {
                await connection.CloseAsync();
            }
        }

        static async Task EnsureHelpRequestScopeAsync(FloodAidContext context, ILogger logger)
        {
            var connection = context.Database.GetDbConnection();
            var openedHere = false;
            if (connection.State != ConnectionState.Open)
            {
                await connection.OpenAsync();
                openedHere = true;
            }

            // Check if CityId column exists
            var cityIdExists = await ColumnExistsAsync(connection, "HelpRequests", "CityId");
            var provinceIdExists = await ColumnExistsAsync(connection, "HelpRequests", "ProvinceId");

            if (cityIdExists && provinceIdExists)
            {
                if (openedHere) await connection.CloseAsync();
                return;
            }

            logger.LogWarning("HelpRequests missing scope columns; adding...");

            // Add CityId column if missing
            if (!cityIdExists)
            {
                const string addCityId = @"ALTER TABLE ""HelpRequests"" ADD COLUMN ""CityId"" integer NULL;";
                using (var cmd = connection.CreateCommand())
                {
                    cmd.CommandText = addCityId;
                    await cmd.ExecuteNonQueryAsync();
                }
                logger.LogInformation("Added CityId column to HelpRequests");

                // Add foreign key constraint
                const string addCityFk = @"ALTER TABLE ""HelpRequests"" ADD CONSTRAINT ""FK_HelpRequests_Cities_CityId"" 
                    FOREIGN KEY (""CityId"") REFERENCES ""Cities"" (""Id"") ON DELETE RESTRICT;";
                try
                {
                    using (var fkCmd = connection.CreateCommand())
                    {
                        fkCmd.CommandText = addCityFk;
                        await fkCmd.ExecuteNonQueryAsync();
                    }
                }
                catch (PostgresException ex) when (ex.SqlState == "42710") // duplicate object
                {
                    logger.LogWarning("FK_HelpRequests_Cities_CityId already exists; skipping.");
                }

                // Add index
                const string addCityIndex = @"CREATE INDEX IF NOT EXISTS ""IX_HelpRequests_CityId"" ON ""HelpRequests"" (""CityId"");";
                using (var idxCmd = connection.CreateCommand())
                {
                    idxCmd.CommandText = addCityIndex;
                    await idxCmd.ExecuteNonQueryAsync();
                }
            }

            // Add ProvinceId column if missing
            if (!provinceIdExists)
            {
                const string addProvinceId = @"ALTER TABLE ""HelpRequests"" ADD COLUMN ""ProvinceId"" integer NULL;";
                using (var cmd = connection.CreateCommand())
                {
                    cmd.CommandText = addProvinceId;
                    await cmd.ExecuteNonQueryAsync();
                }
                logger.LogInformation("Added ProvinceId column to HelpRequests");

                // Add foreign key constraint
                const string addProvinceFk = @"ALTER TABLE ""HelpRequests"" ADD CONSTRAINT ""FK_HelpRequests_Provinces_ProvinceId"" 
                    FOREIGN KEY (""ProvinceId"") REFERENCES ""Provinces"" (""Id"") ON DELETE RESTRICT;";
                try
                {
                    using (var fkCmd = connection.CreateCommand())
                    {
                        fkCmd.CommandText = addProvinceFk;
                        await fkCmd.ExecuteNonQueryAsync();
                    }
                }
                catch (PostgresException ex) when (ex.SqlState == "42710") // duplicate object
                {
                    logger.LogWarning("FK_HelpRequests_Provinces_ProvinceId already exists; skipping.");
                }

                // Add index
                const string addProvinceIndex = @"CREATE INDEX IF NOT EXISTS ""IX_HelpRequests_ProvinceId"" ON ""HelpRequests"" (""ProvinceId"");";
                using (var idxCmd = connection.CreateCommand())
                {
                    idxCmd.CommandText = addProvinceIndex;
                    await idxCmd.ExecuteNonQueryAsync();
                }
            }

            logger.LogInformation("HelpRequests scope ensured.");

            if (openedHere)
            {
                await connection.CloseAsync();
            }
        }

        static async Task EnsureUsersTableAsync(FloodAidContext context, ILogger logger)
        {
            var connection = context.Database.GetDbConnection();
            var openedHere = false;
            if (connection.State != ConnectionState.Open)
            {
                await connection.OpenAsync();
                openedHere = true;
            }

            var usersExists = await TableExistsAsync(connection, "Users");
            if (usersExists)
            {
                if (openedHere) await connection.CloseAsync();
                return;
            }

            logger.LogWarning("Users table missing; creating...");

            const string createUsers = @"CREATE TABLE IF NOT EXISTS ""Users"" (
                ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                ""Name"" text NOT NULL,
                ""Email"" text NOT NULL,
                ""PhoneNumber"" text NOT NULL,
                ""Role"" integer NOT NULL,
                ""Status"" integer NOT NULL DEFAULT 0,
                ""ProvinceId"" integer NULL,
                ""CityId"" integer NULL,
                ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                ""ApprovedAt"" timestamp with time zone NULL,
                ""ReasonForRejection"" text NULL,
                ""VerificationNotes"" text NULL,
                CONSTRAINT ""FK_Users_Provinces_ProvinceId"" FOREIGN KEY (""ProvinceId"") REFERENCES ""Provinces"" (""Id"") ON DELETE SET NULL,
                CONSTRAINT ""FK_Users_Cities_CityId"" FOREIGN KEY (""CityId"") REFERENCES ""Cities"" (""Id"") ON DELETE SET NULL
            );";

            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = createUsers;
                await cmd.ExecuteNonQueryAsync();
            }

            logger.LogInformation("Users table created successfully.");

            if (openedHere)
            {
                await connection.CloseAsync();
            }
        }

        static async Task EnsureUsersColumnsAsync(FloodAidContext context, ILogger logger)
        {
            var connection = context.Database.GetDbConnection();
            var openedHere = false;
            if (connection.State != ConnectionState.Open)
            {
                await connection.OpenAsync();
                openedHere = true;
            }

            // Check if UpdatedAt column exists
            var updatedAtExists = await ColumnExistsAsync(connection, "Users", "UpdatedAt");
            if (!updatedAtExists)
            {
                logger.LogWarning("Users table missing UpdatedAt column; adding...");
                const string addUpdatedAt = @"ALTER TABLE ""Users"" ADD COLUMN ""UpdatedAt"" timestamp with time zone NULL;";
                using (var cmd = connection.CreateCommand())
                {
                    cmd.CommandText = addUpdatedAt;
                    await cmd.ExecuteNonQueryAsync();
                }
                logger.LogInformation("Added UpdatedAt column to Users");
            }

            if (openedHere)
            {
                await connection.CloseAsync();
            }
        }
    }
}

