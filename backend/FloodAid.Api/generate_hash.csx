#!/usr/bin/env dotnet-script
#r "nuget: BCrypt.Net-Next, 4.0.3"

using BCrypt.Net;

var password = Args.Count > 0 ? Args[0] : "admin123";
var hash = BCrypt.HashPassword(password, workFactor: 11);
Console.WriteLine($"Password: {password}");
Console.WriteLine($"Hash: {hash}");
