using FloodAid.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
            var provinces = await _context.Provinces
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
