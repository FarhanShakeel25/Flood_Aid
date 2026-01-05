using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloodAid.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAdminUserWithScope : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProvinceId",
                table: "Admins",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Admins_ProvinceId",
                table: "Admins",
                column: "ProvinceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Admins_Provinces_ProvinceId",
                table: "Admins",
                column: "ProvinceId",
                principalTable: "Provinces",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Admins_Provinces_ProvinceId",
                table: "Admins");

            migrationBuilder.DropIndex(
                name: "IX_Admins_ProvinceId",
                table: "Admins");

            migrationBuilder.DropColumn(
                name: "ProvinceId",
                table: "Admins");
        }
    }
}
