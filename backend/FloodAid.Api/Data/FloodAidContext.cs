using Microsoft.EntityFrameworkCore;
using FloodAid.Api.Models;

namespace FloodAid.Api.Data
{
    public class FloodAidContext : DbContext
    {
        public FloodAidContext(DbContextOptions<FloodAidContext> options) : base(options)
        {
        }

        public DbSet<AdminUser> Admins { get; set; } = null!;
        public DbSet<Donation> Donations { get; set; } = null!;
        public DbSet<HelpRequest> HelpRequests { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure AdminUser
            modelBuilder.Entity<AdminUser>()
                .HasKey(a => a.Id);

            modelBuilder.Entity<AdminUser>()
                .HasIndex(a => a.Email)
                .IsUnique();

            modelBuilder.Entity<AdminUser>()
                .HasIndex(a => a.Username)
                .IsUnique();

            modelBuilder.Entity<AdminUser>()
                .Property(a => a.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            modelBuilder.Entity<AdminUser>()
                .Property(a => a.IsActive)
                .HasDefaultValue(true);
        }
    }
}
