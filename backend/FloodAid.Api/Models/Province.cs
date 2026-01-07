using System.ComponentModel.DataAnnotations;

namespace FloodAid.Api.Models
{
    public class Province
    {
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation
        public ICollection<City> Cities { get; set; } = new List<City>();
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
