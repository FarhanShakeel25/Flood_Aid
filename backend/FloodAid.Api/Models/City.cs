using System.ComponentModel.DataAnnotations;

namespace FloodAid.Api.Models
{
    public class City
    {
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public int ProvinceId { get; set; }
        public Province Province { get; set; } = null!;
        
        /// <summary>
        /// City center latitude for distance-based matching
        /// </summary>
        public double? Latitude { get; set; }
        
        /// <summary>
        /// City center longitude for distance-based matching
        /// </summary>
        public double? Longitude { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
