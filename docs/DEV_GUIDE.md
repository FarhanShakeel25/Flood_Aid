# Flood Aid - Development Guide

## Overview

This guide provides detailed instructions for setting up, running, and developing the Flood Aid application locally.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Testing](#testing)
8. [Debugging](#debugging)
9. [Common Issues](#common-issues)
10. [Development Workflow](#development-workflow)

---

## Prerequisites

### Required Software

| Software | Version | Purpose | Download |
| --- | --- | --- | --- |
| .NET SDK | 10.0+ | Backend development | https://dotnet.microsoft.com/download |
| Node.js | 18.0+ | Frontend development | https://nodejs.org |
| PostgreSQL | 12+ | Database | https://www.postgresql.org/download |
| Git | Latest | Version control | https://git-scm.com |
| VS Code | Latest | Code editor (recommended) | https://code.visualstudio.com |
| Docker | Latest | Optional containerization | https://www.docker.com |

### Optional Tools

- **Postman**: API testing - https://www.postman.com/downloads/
- **pgAdmin**: PostgreSQL GUI - https://www.pgadmin.org/
- **DBeaver**: Database tool - https://dbeaver.io/

### Verify Installation

```bash
# Check .NET SDK
dotnet --version

# Check Node.js
node --version
npm --version

# Check PostgreSQL
psql --version

# Check Git
git --version
```

---

## Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/Flood_Aid.git
cd Flood_Aid
```

### 2. Create Environment Files

#### Backend (`.env` or `appsettings.Development.json`)

```bash
cd backend/FloodAid.Api
cp appsettings.json appsettings.Development.json
```

Update `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=floodaid_dev;Username=postgres;Password=your_password"
  },
  "Stripe": {
    "ApiKey": "sk_test_YOUR_STRIPE_SECRET_KEY"
  },
  "Brevo": {
    "ApiKey": "YOUR_BREVO_API_KEY",
    "ApiUrl": "https://api.brevo.com/v3"
  },
  "Frontend": {
    "Url": "http://localhost:5173"
  },
  "JwtSettings": {
    "SecretKey": "YOUR_32_CHARACTER_SECRET_KEY_HERE",
    "Issuer": "FloodAid.Api",
    "Audience": "FloodAid.Frontend",
    "ExpiryMinutes": "1440"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Debug"
    }
  }
}
```

#### Frontend (`.env.local`)

```bash
cd frontend
touch .env.local
```

Add to `.env.local`:

```bash
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_STRIPE_PUBLIC_KEY
VITE_API_URL=http://localhost:5273
VITE_ENVIRONMENT=development
```

---

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend/FloodAid.Api
```

### 2. Restore NuGet Packages

```bash
dotnet restore
```

### 3. Create Local Database

#### Option A: Using psql Command Line

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE floodaid_dev;

# Create user
CREATE USER floodaid_dev WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE floodaid_dev TO floodaid_dev;

# Exit psql
\q
```

#### Option B: Using pgAdmin

1. Open pgAdmin
2. Right-click "Databases" → "Create" → "Database"
3. Name: `floodaid_dev`
4. Owner: `postgres`
5. Click "Save"

### 4. Apply Database Migrations

```bash
dotnet ef database update
```

This will:
- Create all tables based on models
- Apply seeds from `SeedData.cs`
- Create initial admin user

### 5. Verify Migration

```bash
# Connect to database
psql -U postgres -d floodaid_dev

# List tables
\dt

# View admin users
SELECT * FROM admin_users;

# Exit
\q
```

### 6. Restore NuGet Packages (if needed)

```bash
dotnet restore
```

---

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

```bash
cp .env.example .env.local  # if available
```

Or manually create `.env.local` with:

```bash
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_API_URL=http://localhost:5273
```

### 4. Verify Configuration

```bash
npm run build
# Check for any missing environment variables
```

---

## Database Setup

### PostgreSQL Installation (Windows)

1. Download installer from https://www.postgresql.org/download/windows/
2. Run installer with default settings
3. Remember the password you set for `postgres` user
4. Add PostgreSQL to PATH:
   - Right-click "This PC" → "Properties"
   - "Advanced system settings" → "Environment Variables"
   - Add `C:\Program Files\PostgreSQL\15\bin` to PATH

### PostgreSQL Installation (macOS)

```bash
# Using Homebrew
brew install postgresql@15

# Start service
brew services start postgresql@15
```

### PostgreSQL Installation (Linux)

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
```

### Initial PostgreSQL Setup

```bash
# Connect as default user
psql -U postgres

# Change postgres user password
ALTER USER postgres WITH PASSWORD 'new_password';

# Create development database
CREATE DATABASE floodaid_dev;

# Create user
CREATE USER floodaid_dev WITH PASSWORD 'dev_password';
ALTER ROLE floodaid_dev SET client_encoding TO 'utf8';
ALTER ROLE floodaid_dev SET default_transaction_isolation TO 'read committed';
ALTER ROLE floodaid_dev SET default_transaction_deferrable TO on;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE floodaid_dev TO floodaid_dev;

# Exit
\q
```

### Useful PostgreSQL Commands

```bash
# Connect to database
psql -U floodaid_dev -d floodaid_dev

# Show all databases
\l

# Show all tables
\dt

# Describe table structure
\d table_name

# Show specific table data
SELECT * FROM admin_users;

# Drop database (caution!)
DROP DATABASE floodaid_dev;

# Backup database
pg_dump -U postgres floodaid_dev > backup.sql

# Restore from backup
psql -U postgres floodaid_dev < backup.sql

# Exit psql
\q
```

---

## Running the Application

### Start Backend API

**Terminal 1**:
```bash
cd backend/FloodAid.Api
dotnet run --launch-profile https
```

Expected output:
```
info: Microsoft.Hosting.Lifetime[0]
      Now listening on: https://localhost:5273
info: Microsoft.Hosting.Lifetime[0]
      Press CTRL+C to stop the application
```

Backend available at: `https://localhost:5273`

### Start Frontend Application

**Terminal 2**:
```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Frontend available at: `http://localhost:5173`

### Verify Both Services

1. **Backend Health Check**: Visit `https://localhost:5273/health`
   - Should return: `{"status":"healthy"}`

2. **Frontend Home Page**: Visit `http://localhost:5173`
   - Should load React application

3. **Swagger API Docs**: Visit `https://localhost:5273/scalar/v1`
   - Interactive API documentation

### Stop Services

- Press `Ctrl+C` in each terminal to stop the service

---

## Testing

### Backend Unit Tests

```bash
cd backend/FloodAid.Api.Tests

# Run all tests
dotnet test

# Run with verbose output
dotnet test --verbosity:normal

# Run specific test class
dotnet test --filter ClassName=AuthTests

# Generate code coverage report
dotnet test /p:CollectCoverage=true
```

### Frontend Unit Tests

```bash
cd frontend

# Run all tests
npm test

# Run in watch mode (rerun on file changes)
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

### Integration Testing with Postman

1. **Import API Collection**:
   - Open Postman
   - File → Import → Select `FloodAid.Api.http` file
   - Collections auto-populated

2. **Set Environment Variables**:
   - Create new Postman environment
   - Add variable: `api_url` = `http://localhost:5273`
   - Add variable: `jwt_token` = (obtained from login)

3. **Test Donation Endpoints**:
   ```
   POST {{api_url}}/api/donation/create-session
   Body: {
     "name": "Test User",
     "email": "test@example.com",
     "amount": 5000
   }
   ```

### Manual Testing Checklist

#### Backend
- [ ] Health check responds
- [ ] Swagger docs accessible
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] CORS allows frontend origin

#### Frontend
- [ ] Application loads
- [ ] Navigation works
- [ ] Components render
- [ ] No console errors
- [ ] Environment variables loaded

#### Integration
- [ ] Frontend calls backend API
- [ ] Requests include CORS headers
- [ ] Response data displays correctly
- [ ] Error handling works

---

## Debugging

### Debug Backend with VS Code

1. **Install C# Extension**:
   - Open VS Code
   - Extensions → Search "C# Dev Kit"
   - Install official Microsoft extension

2. **Create Launch Configuration** (`.vscode/launch.json`):
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": ".NET Core Launch (web)",
         "type": "coreclr",
         "request": "launch",
         "preLaunchTask": "build",
         "program": "${workspaceFolder}/backend/FloodAid.Api/bin/Debug/net10.0/FloodAid.Api.dll",
         "args": [],
         "cwd": "${workspaceFolder}/backend/FloodAid.Api",
         "stopAtEntry": false,
         "env": {
           "ASPNETCORE_ENVIRONMENT": "Development"
         }
       }
     ]
   }
   ```

3. **Start Debugging**:
   - Press `F5` or click "Run" → "Start Debugging"
   - Set breakpoints (click line numbers)
   - Step through code (F10, F11)

### Debug Frontend with Browser DevTools

1. **Chrome DevTools**:
   - Press `F12` to open DevTools
   - **Console**: View logs and errors
   - **Sources**: Set breakpoints, step through code
   - **Network**: Inspect API requests/responses
   - **Application**: View cookies, localStorage

2. **React DevTools Extension**:
   - Install from Chrome Web Store
   - Inspect component props and state
   - Track component re-renders

### Common Debug Scenarios

#### Issue: "CORS Error on API Call"
- **Cause**: Backend CORS policy doesn't allow frontend origin
- **Debug**: 
  - Check `Program.cs` CORS configuration
  - Verify `Frontend:Url` setting matches frontend URL
  - Check browser Network tab for CORS headers

#### Issue: "Migration Failed"
- **Cause**: Database connection or schema conflict
- **Debug**:
  ```bash
  # Check connection string
  dotnet user-secrets list
  
  # Check migration history
  dotnet ef migrations list
  
  # View pending migrations
  dotnet ef migrations pending
  ```

#### Issue: "Authentication Token Expired"
- **Cause**: JWT token expired or invalid signature
- **Debug**:
  - Check token expiry time in `JwtSettings`
  - Verify secret key matches between frontend and backend
  - Check browser Console for token storage

#### Issue: "Email Not Sending"
- **Cause**: Brevo API misconfiguration
- **Debug**:
  - Verify API key in `appsettings.json`
  - Check Brevo dashboard for API restrictions
  - Review server logs for email service errors

---

## Common Issues

### Issue: PostgreSQL Connection Refused

**Symptom**: 
```
Npgsql.NpgsqlException: could not connect to server: Connection refused
```

**Solutions**:
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL service
sudo systemctl start postgresql      # Linux
brew services start postgresql@15   # macOS
# Windows: Services app → PostgreSQL → Start

# Verify connection string in appsettings.json
# Default: Host=localhost;Port=5432;Database=floodaid_dev;Username=postgres;Password=...
```

### Issue: Port Already in Use

**Symptom**:
```
Unhandled exception: System.IO.IOException: address already in use
```

**Solutions**:
```bash
# Find process using port 5273 (backend)
lsof -i :5273                    # macOS/Linux
netstat -ano | findstr :5273    # Windows

# Kill process (macOS/Linux)
kill -9 <PID>

# Kill process (Windows)
taskkill /PID <PID> /F

# Or use different port
dotnet run -- --urls "https://localhost:5274"
```

### Issue: npm install Fails

**Symptom**:
```
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Module Not Found (Frontend)

**Symptom**:
```
Module not found: Can't resolve '@/components/...'
```

**Solutions**:
1. Check import path is correct
2. Verify `vite.config.js` has proper path aliases
3. Restart dev server: `npm run dev`

### Issue: Stripe Key Invalid

**Symptom**:
```
401 The API key provided is not a test API key for this request
```

**Solutions**:
- Verify using TEST keys (pk_test_..., sk_test_...)
- Don't use LIVE keys in development
- Check keys are from correct Stripe account
- Regenerate keys if compromised

---

## Development Workflow

### Feature Branch Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-feature-name

# 2. Make changes and commit
git add .
git commit -m "Add new feature description"

# 3. Push to remote
git push origin feature/new-feature-name

# 4. Create Pull Request on GitHub
# - Add description
# - Request reviewers
# - Wait for CI/CD checks

# 5. Once approved, merge to main
# - Squash and merge (clean history)
# - Or rebase and merge

# 6. Delete branch
git branch -d feature/new-feature-name
git push origin --delete feature/new-feature-name
```

### Code Style Guidelines

#### C# Backend
- Follow Microsoft C# Coding Conventions
- Use PascalCase for class/method names
- Use camelCase for variables/parameters
- Add XML documentation comments for public members

```csharp
/// <summary>
/// Processes a donation and updates the database.
/// </summary>
/// <param name="donation">The donation to process</param>
/// <returns>True if successful, false otherwise</returns>
public async Task<bool> ProcessDonationAsync(Donation donation)
{
    // Implementation
}
```

#### JavaScript/React Frontend
- Use camelCase for variables/functions
- Use PascalCase for components
- Add JSDoc comments for functions

```javascript
/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function validateEmail(email) {
  // Implementation
}
```

### Git Commit Message Format

```
[TYPE] Brief description under 50 characters

Detailed explanation of changes if needed.
Wrap at 72 characters for readability.

Fixes #123 (if resolving an issue)
Related to #456
```

**Commit Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting/style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/modifications
- `chore`: Dependency updates, etc.

**Examples**:
```bash
git commit -m "feat: Add support for in-kind donations"
git commit -m "fix: Correct JWT token expiration calculation"
git commit -m "docs: Update API documentation"
git commit -m "refactor: Simplify donation validation logic"
```

### Database Schema Changes

When modifying models:

1. **Create Migration**:
   ```bash
   cd backend/FloodAid.Api
   dotnet ef migrations add DescriptiveChange
   ```

2. **Review Generated Code**:
   - Check `Migrations/[timestamp]_DescriptiveChange.cs`
   - Ensure correct table operations

3. **Apply Migration**:
   ```bash
   dotnet ef database update
   ```

4. **Commit Migration**:
   ```bash
   git add Migrations/
   git commit -m "feat: Add new column to donations table"
   ```

### Environment-Specific Configuration

| Environment | Database | Stripe Keys | Email Service |
| --- | --- | --- | --- |
| Development | floodaid_dev (local) | pk_test_... | Brevo test account |
| Staging | RDS staging | pk_test_... | Brevo staging |
| Production | RDS production | pk_live_... | Brevo production |

---

## Performance Tips

### Backend Optimization

```csharp
// Use AsNoTracking for read-only queries
var donations = await _context.Donations
    .AsNoTracking()
    .Where(d => d.Status == DonationStatus.Pending)
    .ToListAsync();

// Use Select to reduce data
var dtos = await _context.Donations
    .Select(d => new DonationDto 
    { 
        Id = d.Id, 
        Amount = d.DonationAmount 
    })
    .ToListAsync();
```

### Frontend Optimization

```javascript
// Code splitting with React.lazy
const AdminDashboard = React.lazy(() => 
  import('./pages/AdminDashboard')
);

// Memoization to prevent re-renders
const DonationForm = React.memo(({ onSubmit }) => {
  // Component
});

// useCallback for stable function references
const handleDonate = useCallback(async (data) => {
  // Handler
}, []);
```

---

## Additional Resources

- [.NET Documentation](https://learn.microsoft.com/en-us/dotnet/)
- [React Documentation](https://react.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/)
- [Stripe API](https://stripe.com/docs/api)

---

**Last Updated**: December 31, 2025  
**Version**: 1.0
