using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FloodAid.Api.Data
{
    /// <summary>
    /// Design-time factory for creating DbContext instances for EF Core migrations.
    /// This allows `dotnet ef` commands to work without needing the full host to be running.
    /// </summary>
    public class FloodAidContextFactory : IDesignTimeDbContextFactory<FloodAidContext>
    {
        public FloodAidContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<FloodAidContext>();
            
            // Use local PostgreSQL connection for migrations
            var connectionString = "Host=localhost;Port=5432;Database=floodaid;Username=postgres;Password=postgres";
            optionsBuilder.UseNpgsql(connectionString);

            return new FloodAidContext(optionsBuilder.Options);
        }
    }
}
