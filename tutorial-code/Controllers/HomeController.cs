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
		
		[ResponseCache(Location = ResponseCacheLocation.None, NoStore = true)]
		public ActionResult Index()
		{
			generateID();
			return View();
		}

		/// <summary>
		/// This method retrieves all pdf files from a given directory path.
		/// The method returns that list and is then used via a javascript method on details.cshtml
		/// For the javascript to work smoothly this method must return a list of strings
		/// </summary>
		/// <returns></returns>
		public List<string> getFiles()
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
			return Json(getFiles());
		}

		//This method is called in the index() which gets called when the page is loaded.
		//need to change the foor loop, 10 is just for testing.
		[Route("id")]
		public int generateID()
		{
			//not yet working smoothly, needs more testing and work.
			Random rnd = new Random();
			int id;
			do
			{
				id = rnd.Next(1, 5);
			}
			while (ids.Contains(id));
			ids.Add(id);
			Judge j = new Judge(id);
			judges.Add(j);
			return id;
		}

		//public NumericMatrix getPairings(int noScripts, int noPairings)
		public List<Tuple<int, int>> getPairings(int noScripts, int noPairings)
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

		public List<Tuple<string, string>> createPairings()
		{
			//taken from line 90 above in get file method
			List<Tuple<int, int>> result = getPairings(getFiles().Count - 1, 5); //change seoond number back to 30 once done testing counter
			List<string> original = getFiles();
			List<Tuple<string, string>> finalResult = new List<Tuple<string, string>>();
			foreach (Tuple<int, int> x in result)
			{
				finalResult.Add(new Tuple<string, string>(original[x.Item1], original[x.Item2]));
			}
			return finalResult;
		}

		[Route("files")]
		public ActionResult getPairedFiles()
		{
			return Json(createPairings());
		}

		[Produces("application/json")]
		[Route("winners")]
		public string getWinners([FromBody] Pairing data)
		{
			string Winner = data.Winner;
			Tuple<string, string> pairOfScripts = data.pairOfScripts;
			string timeJudgement = data.timeJudgement;
			string elapsedTime = data.elapsedTime;
			int judgeID = data.JudgeID;

			Pairing p = new Pairing(Winner, pairOfScripts, timeJudgement, elapsedTime, judgeID);
			allPairings.Add(p);
			return Winner;
		}

		public class Pairing
		{
			public string Winner { get; set; }
			public Tuple<string, string> pairOfScripts { get; set; }
			public string timeJudgement { get; set; }
			public string elapsedTime { get; set; }
			public int JudgeID;

			public Pairing(string Winner, Tuple<string, string> pairOfScripts, string timeJudgement, string elapsedTime, int id)
			{
				this.Winner = Winner;
				this.pairOfScripts = pairOfScripts;
				this.timeJudgement = timeJudgement;
				this.elapsedTime = elapsedTime;
				this.JudgeID = id;
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
				sb.Append(allPairings[i].Winner + ",");
				sb.Append(allPairings[i].pairOfScripts.ToString() + ",");
				sb.Append(allPairings[i].timeJudgement + ",");
				sb.Append(allPairings[i].elapsedTime + ",");
				sb.Append(allPairings[i].JudgeID + ",");
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
