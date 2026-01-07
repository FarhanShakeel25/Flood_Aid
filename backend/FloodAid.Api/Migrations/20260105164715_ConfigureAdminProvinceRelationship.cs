using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloodAid.Api.Migrations
{
    /// <inheritdoc />
    public partial class ConfigureAdminProvinceRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Admins_Provinces_ProvinceId",
                table: "Admins");

            migrationBuilder.AddForeignKey(
                name: "FK_Admins_Provinces_ProvinceId",
                table: "Admins",
                column: "ProvinceId",
                principalTable: "Provinces",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Admins_Provinces_ProvinceId",
                table: "Admins");

            migrationBuilder.AddForeignKey(
                name: "FK_Admins_Provinces_ProvinceId",
                table: "Admins",
                column: "ProvinceId",
                principalTable: "Provinces",
                principalColumn: "Id");
        }
    }
}
