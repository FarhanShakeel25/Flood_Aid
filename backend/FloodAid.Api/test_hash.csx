#r "nuget: BCrypt.Net-Next, 4.0.3"
using BCrypt.Net;

string password = "admin123";
string newHash = BCrypt.HashPassword(password, 11);
Console.WriteLine($"New hash for 'admin123': {newHash}");

// Test it
bool works = BCrypt.Verify(password, newHash);
Console.WriteLine($"Verification test: {works}");

// Test the config hash
string configHash = "$2a$11$vPz5OqJ0xhkGD5nC3LTBX.JwL8g4yQxXxO/DkFnrZrXlAEzJ8Ny6G";
bool configWorks = BCrypt.Verify(password, configHash);
Console.WriteLine($"Config hash works: {configWorks}");
