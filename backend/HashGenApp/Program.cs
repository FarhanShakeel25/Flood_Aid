using System;
using BCrypt.Net;

class Program
{
	static void Main(string[] args)
	{
		if (args.Length == 0 || string.IsNullOrWhiteSpace(args[0]))
		{
			Console.Error.WriteLine("Usage: dotnet run -- <password>");
			Environment.Exit(1);
		}

		var password = args[0];
		var hash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 11);
		Console.WriteLine(hash);
	}
}
