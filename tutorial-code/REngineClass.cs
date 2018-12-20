using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using RDotNet;

namespace ReactDemo
{
    public static class REngineClass
	{
		private static REngine engine;
		public static void Initialise()
		{
			 engine = REngine.GetInstance();
		}

		public static REngine GetREngine()
		{
			return engine;
		}

		public static void DestroyEngine()
		{
			engine.Dispose();
		}
	}
}
