using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloodAid.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTimestampsToHelpRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add Id column to HelpRequests table if it doesn't exist
            migrationBuilder.AddColumn<int>(
                name: "Id",
                table: "HelpRequests",
                type: "integer",
                nullable: false,
                defaultValue: 0)
                .Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            // Add CreatedAt column
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "HelpRequests",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            // Add UpdatedAt column
            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "HelpRequests",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            // Add IsActive column to Admins table
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Admins",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            // Set HelpRequests Id as primary key
            migrationBuilder.AddPrimaryKey(
                name: "PK_HelpRequests",
                table: "HelpRequests",
                column: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_HelpRequests",
                table: "HelpRequests");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "HelpRequests");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "HelpRequests");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "HelpRequests");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Admins");
        }
    }
}
