using FloodAid.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FloodAid.Api.Controllers
{
    [ApiController]
    [Route("api/provinces")]
    [Authorize]
    public class ProvinceController : ControllerBase
    {
        private readonly FloodAidContext _context;

        public ProvinceController(FloodAidContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all provinces
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetProvinces()
        {
            var requesterEmail = User.FindFirstValue(ClaimTypes.Email);

            var admin = !string.IsNullOrWhiteSpace(requesterEmail)
                ? await _context.Admins.FirstOrDefaultAsync(a => a.Email == requesterEmail)
                : null;

            IQueryable<Models.Province> query = _context.Provinces;

            // ProvinceAdmin is scoped to their own province; SuperAdmin sees all
            if (admin != null && admin.Role == "ProvinceAdmin" && admin.ProvinceId.HasValue)
            {
                query = query.Where(p => p.Id == admin.ProvinceId.Value);
            }

            var provinces = await query
                .OrderBy(p => p.Name)
                .Select(p => new
                {
                    p.Id,
                    p.Name
                })
                .ToListAsync();

            return Ok(provinces);
        }

        /// <summary>
        /// Get cities for a specific province
        /// </summary>
        [HttpGet("{provinceId}/cities")]
        public async Task<IActionResult> GetCitiesForProvince(int provinceId)
        {
            var requesterEmail = User.FindFirstValue(ClaimTypes.Email);

            var admin = !string.IsNullOrWhiteSpace(requesterEmail)
                ? await _context.Admins.FirstOrDefaultAsync(a => a.Email == requesterEmail)
                : null;

            // ProvinceAdmin can only access cities within their own province
            if (admin != null && admin.Role == "ProvinceAdmin")
            {
                if (!admin.ProvinceId.HasValue || admin.ProvinceId.Value != provinceId)
                {
                    return Forbid();
                }
            }

            var cities = await _context.Cities
                .Where(c => c.ProvinceId == provinceId)
                .OrderBy(c => c.Name)
                .Select(c => new
                {
                    c.Id,
                    c.Name
                })
                .ToListAsync();

            return Ok(cities);
        }
    }
}
