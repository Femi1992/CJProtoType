using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using RDotNet;
using ReactDemo.Models;

namespace ReactDemo.Controllers
{
	public class HomeController : Controller
	{
		private static List<Pairing> allPairings = new List<Pairing>();
		private static List<Judge> judges = new List<Judge>();
		private static List<int> ids = new List<int>();
		private static List<string> scriptsChosen = new List<string>();
		private static int maxJudges = 5;
		
		[ResponseCache(Location = ResponseCacheLocation.None, NoStore = true)]
		public ActionResult Index()
		{
			//GenerateID();
			return View();
		}

		/// <summary>
		/// This method retrieves all pdf files from a given directory path.
		/// The method returns that list and is then used via a javascript method on details.cshtml
		/// For the javascript to work smoothly this method must return a list of strings
		/// </summary>
		/// <returns></returns>
		public List<string> GetFiles()
		{
			try
			{
				List<string> pdfNames = new List<string>();
				string currentFile;
				string[] dirs = Directory.GetFiles("wwwroot\\pdfjs-2.0.943-dist\\web", "*.pdf");
				string[] imgs = Directory.GetFiles("wwwroot\\images", "*.jpg");
				foreach (string dir in dirs)
				{
					currentFile = Path.GetFileName(dir).ToLower();
					pdfNames.Add(currentFile);
				}

				foreach (string dir in imgs)
				{
					String relativeTo = "wwwroot";
					String relPath = Path.GetRelativePath(relativeTo, dir);
					string ImagePath = "/" + relPath.Replace("\\", "/");
					pdfNames.Add(ImagePath);
				}
				return pdfNames;
			}
			catch (Exception e)
			{
				List<string> error = new List<string>();
				error.Add(e.ToString());
				return error;
			}
		}

		//[Route("names")]
		[ResponseCache(Location = ResponseCacheLocation.None, NoStore = true)]
		public ActionResult names()
		{
			return Json(GetFiles());
		}

		//This method is called in the index() which gets called when the page is loaded.
		//need to change the foor loop, 10 is just for testing.
		[Route("id")]
		public int GenerateID()
		{
			//not yet working smoothly, needs more testing and work.
			Random rnd = new Random();
			int id;
			do
			{
				id = rnd.Next(1, maxJudges);
			}
			while (ids.Contains(id));
			maxJudges++; //Max judges is a low number to keep generated IDs low, it scales up if we want more browser windows to test.
			ids.Add(id);
			Judge j = new Judge(id);
			judges.Add(j);
			return id;
		}

		//public NumericMatrix GetPairings(int noScripts, int noPairings)
		public List<Tuple<int, int>> GetPairings(int noScripts, int noPairings)
		{
			REngineClass.GetREngine().Evaluate(@"source('wwwroot/RScripts/ComparativeJudgmentPairingsTest.R')");
			NumericMatrix matrix = REngineClass.GetREngine().Evaluate(string.Format("matrix <- generatePairings(noOfScripts = {0}, noOfPairings = {1})", noScripts, noPairings)).AsNumericMatrix();

			//create an empty list of tuples
			List<Tuple<int, int>> pairings = new List<Tuple<int, int>>();

			for (int i = 0; i < matrix.RowCount; i++)
			{
				//add new tuple to list
				pairings.Add(new Tuple<int, int>((int)matrix[i, 0], (int)matrix[i, 1]));
			}
			return pairings;
		}

		public List<Tuple<string, string>> CreatePairings()
		{
			//taken from line 90 above in get file method
			List<Tuple<int, int>> result = GetPairings(GetFiles().Count - 1, 20); //change seoond number back to 30 once done testing counter
			List<string> original = GetFiles();
			List<Tuple<string, string>> finalResult = new List<Tuple<string, string>>();
			foreach (Tuple<int, int> x in result)
			{
				finalResult.Add(new Tuple<string, string>(original[x.Item1], original[x.Item2]));
			}
			return finalResult;
		}

		[Route("files")]
		public ActionResult GetPairedFiles()
		{
			return Json(CreatePairings());
		}

		[Produces("application/json")]
		[Route("winners")]
		public string GetWinners([FromBody] Pairing data)
		{
			string winner = data.winner;
			Tuple<string, string> pairOfScripts = data.pairOfScripts;
			string timeJudgement = data.timeJudgement;
			string elapsedTime = data.elapsedTime;
			int judgeID = data.judgeID;

			Pairing p = new Pairing(winner, pairOfScripts, timeJudgement, elapsedTime, judgeID);
			allPairings.Add(p);
			scriptsChosen.Add(winner);
			return winner;
		}

		[Route("leader")]
		public string GetLeadingScript()
		{
			Dictionary<string, int> counts = new Dictionary<string, int>();
			int compare = 0;
	        string mostFrequent = "";
			for (var i = 0; i < scriptsChosen.Count; i++)
			{
				// this needs changing, otherwise one gets added to each key during each iterations
				var word = scriptsChosen[i];

				if (counts.ContainsKey(word))
				{
					counts[word] = counts[word] + 1;
				}
				else
				{
					counts.Add(word, 1);
				}
				if (counts[word] > compare)
				{
					compare = counts[word];
					mostFrequent = scriptsChosen[i];
				}
				else if (counts[word] == compare)
				{
					mostFrequent = "tie";
				}
			}
			return mostFrequent;
		}

		public class Pairing
		{
			public string winner { get; set; }
			public Tuple<string, string> pairOfScripts { get; set; }
			public string timeJudgement { get; set; }
			public string elapsedTime { get; set; }
			public int judgeID;

			public Pairing(string winner, Tuple<string, string> pairOfScripts, string timeJudgement, string elapsedTime, int id)
			{
				this.winner = winner;
				this.pairOfScripts = pairOfScripts;
				this.timeJudgement = timeJudgement;
				this.elapsedTime = elapsedTime;
				this.judgeID = id;
			}
		}

		public class Judge
		{
			public int judgeID { get; set; }
			public Judge(int judgeID)
			{
				this.judgeID = judgeID;
			}
		}

		public string GenerateCSVString()
		{
			StringBuilder sb = new StringBuilder();
			sb.Append("Winner,");
			sb.Append("Script One,");
			sb.Append("Script Two,");
			sb.Append("Date,");
			sb.Append("TimeJudged,");
			sb.Append("ElapsedTime,");
			sb.Append("Judge");
			sb.AppendLine();
			for (int i = 0; i < allPairings.Count; i++)
			{
				//Just cleaning the strings up a little bit for easier reading/analysis
				sb.Append(allPairings[i].winner.Replace("/images/","") + ",");
				sb.Append(allPairings[i].pairOfScripts.ToString().Replace("/images/", "").Replace("(","").Replace(")", "") + ",");
				sb.Append(allPairings[i].timeJudgement + ",");
				sb.Append(allPairings[i].elapsedTime + ",");
				sb.Append(allPairings[i].judgeID + ",");
				sb.AppendLine();
			}
			return sb.ToString();
		}

		[HttpGet]
		public FileContentResult ReportBuilder()
		{
			var csv = GenerateCSVString();
			var fileName = "report.csv";

			return File(new System.Text.UTF8Encoding().GetBytes(csv), "text/csv", fileName);
		}
	}
}
