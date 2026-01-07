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
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Province> Provinces { get; set; } = null!;
        public DbSet<City> Cities { get; set; } = null!;
        public DbSet<Invitation> Invitations { get; set; } = null!;

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

            modelBuilder.Entity<AdminUser>()
                .HasOne(a => a.Province)
                .WithMany()
                .HasForeignKey(a => a.ProvinceId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure Province
            modelBuilder.Entity<Province>()
                .HasKey(p => p.Id);
            
            modelBuilder.Entity<Province>()
                .HasIndex(p => p.Name)
                .IsUnique();

            // Configure City
            modelBuilder.Entity<City>()
                .HasKey(c => c.Id);
            
            modelBuilder.Entity<City>()
                .HasOne(c => c.Province)
                .WithMany(p => p.Cities)
                .HasForeignKey(c => c.ProvinceId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure User relationships
            modelBuilder.Entity<User>()
                .HasOne(u => u.Province)
                .WithMany(p => p.Users)
                .HasForeignKey(u => u.ProvinceId)
                .OnDelete(DeleteBehavior.Restrict);
            
            modelBuilder.Entity<User>()
                .HasOne(u => u.City)
                .WithMany(c => c.Users)
                .HasForeignKey(u => u.CityId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure Invitation
            modelBuilder.Entity<Invitation>()
                .HasKey(i => i.Id);
            
            modelBuilder.Entity<Invitation>()
                .HasIndex(i => i.Token)
                .IsUnique();
            
            modelBuilder.Entity<Invitation>()
                .HasOne(i => i.Province)
                .WithMany()
                .HasForeignKey(i => i.ProvinceId)
                .OnDelete(DeleteBehavior.Restrict);
            
            modelBuilder.Entity<Invitation>()
                .HasOne(i => i.City)
                .WithMany()
                .HasForeignKey(i => i.CityId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure HelpRequest relationships
            modelBuilder.Entity<HelpRequest>()
                .HasOne(h => h.Province)
                .WithMany()
                .HasForeignKey(h => h.ProvinceId)
                .OnDelete(DeleteBehavior.Restrict);
            
            modelBuilder.Entity<HelpRequest>()
                .HasOne(h => h.City)
                .WithMany()
                .HasForeignKey(h => h.CityId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
