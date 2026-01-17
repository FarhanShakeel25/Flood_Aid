#!/usr/bin/env dotnet fsi

#r "nuget: BCrypt.Net-Next, 4.0.3"

open BCrypt.Net

// Test if the existing hash matches "admin123"
let existingHash = "$2a$11$ni/pqbfiq37/K.oEfC2lB..fAP0OeMSJeN7zWE0RrF5zRCe2qxvEm"
let testPassword = "admin123"

printfn "Testing password 'admin123' against stored hash..."
let isValid = BCrypt.Verify(testPassword, existingHash)
printfn "Password matches: %b" isValid

// Generate new hash for "admin123"
printfn "\nGenerating new hash for 'admin123'..."
let newHash = BCrypt.HashPassword(testPassword, workFactor = 11)
printfn "New hash: %s" newHash

// Verify the new hash works
let verifyNew = BCrypt.Verify(testPassword, newHash)
printfn "New hash verification: %b" verifyNew
