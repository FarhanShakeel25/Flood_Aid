using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloodAid.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHelpRequestScoping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CityId",
                table: "HelpRequests",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProvinceId",
                table: "HelpRequests",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_HelpRequests_CityId",
                table: "HelpRequests",
                column: "CityId");

            migrationBuilder.CreateIndex(
                name: "IX_HelpRequests_ProvinceId",
                table: "HelpRequests",
                column: "ProvinceId");

            migrationBuilder.AddForeignKey(
                name: "FK_HelpRequests_Cities_CityId",
                table: "HelpRequests",
                column: "CityId",
                principalTable: "Cities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_HelpRequests_Provinces_ProvinceId",
                table: "HelpRequests",
                column: "ProvinceId",
                principalTable: "Provinces",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HelpRequests_Cities_CityId",
                table: "HelpRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_HelpRequests_Provinces_ProvinceId",
                table: "HelpRequests");

            migrationBuilder.DropIndex(
                name: "IX_HelpRequests_CityId",
                table: "HelpRequests");

            migrationBuilder.DropIndex(
                name: "IX_HelpRequests_ProvinceId",
                table: "HelpRequests");

            migrationBuilder.DropColumn(
                name: "CityId",
                table: "HelpRequests");

            migrationBuilder.DropColumn(
                name: "ProvinceId",
                table: "HelpRequests");
        }
    }
}
