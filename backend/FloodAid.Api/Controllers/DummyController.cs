using Microsoft.AspNetCore.Mvc;

namespace FloodAid.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DummyController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new { status = "ok", message = "backend reachable" });
        }
    }
}
