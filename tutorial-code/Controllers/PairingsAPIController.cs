using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace tutorial_code.Controllers
{
    [Produces("application/json")]
    [Route("api/PairingsAPI")]
    public class PairingsAPIController : Controller
    {
		public HttpResponseMessage Post([FromBody] Winners data)
		{
			var d = data.Wins;
			return new HttpResponseMessage();
		}

    }

	public class Winners
	{
		public string[] Wins { get; set; }
	}
}
