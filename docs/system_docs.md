# Flood Aid - System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Backend API](#backend-api)
5. [Frontend Application](#frontend-application)
6. [External Services](#external-services)
7. [Deployment](#deployment)
8. [Configuration](#configuration)
9. [Development Setup](#development-setup)

---

## System Overview

Flood Aid is a full-stack web application designed to facilitate disaster relief donations. The system allows users to:
- Make cash donations via Stripe payment gateway (PKR currency)
- Donate supplies (in-kind donations)
- Receive email confirmations for contributions
- View donation statistics and impact

**Live URLs:**
- Frontend: https://flood-aid-94zg.vercel.app
- Backend API: https://floodaid-api.onrender.com

---

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Web Browser   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────┐     ┌──────────────────┐
│  React Frontend     │────▶│  Stripe Checkout │
│  (Vercel)           │     │  Payment Gateway │
└────────┬────────────┘     └──────────────────┘
         │ REST API
         │ (HTTPS)
         ▼
┌─────────────────────┐     ┌──────────────────┐
│  ASP.NET Core API   │────▶│  Brevo Email API │
│  (Render)           │     │  (REST)          │
└─────────────────────┘     └──────────────────┘
```

### Component Interaction Flow

**Cash Donation Flow:**
1. User fills donation form → Frontend validates
2. Frontend POST `/api/donation/create-session` → Backend
3. Backend creates Stripe Checkout Session
4. Backend triggers email send (fire-and-forget via Brevo API)
5. Backend returns session URL → Frontend redirects to Stripe
6. User completes payment on Stripe
7. Stripe redirects to `/success?session_id={ID}`
8. Success page fetches session details from `/api/donation/session/{id}`
9. Frontend displays confirmation with actual amount paid

**Supplies Donation Flow:**
1. User fills supplies form → Frontend validates
2. Frontend POST `/api/donation/create-supplies` → Backend
3. Backend generates receipt ID
4. Backend triggers email confirmation (fire-and-forget)
5. Backend returns receipt ID → Frontend shows success message

---

## Technology Stack

### Frontend
- **Framework:** React 18 with Vite
- **Routing:** React Router DOM v6
- **Styling:** CSS modules, component-scoped styles
- **HTTP Client:** Fetch API
- **Payment:** Stripe.js (client-side redirect)
- **Deployment:** Vercel (auto-deploy from GitHub main branch)

### Backend
- **Framework:** ASP.NET Core 9.0 (Web API)
- **Language:** C# 12
- **Payment Processing:** Stripe.NET SDK v46+
- **Email:** Brevo REST API (via HttpClient)
- **Logging:** Microsoft.Extensions.Logging
- **CORS:** Allow all origins (production restricted)
- **API Documentation:** Swagger/OpenAPI
- **Deployment:** Render (Docker container)

### External Services
- **Stripe:** Payment gateway (test mode: `pk_test_...`, `sk_test_...`)
- **Brevo:** Transactional email service (REST API, port 443)
- **Vercel:** Static frontend hosting with CDN
- **Render:** Backend hosting with auto-scaling

---

## Backend API

### Base URL
- Production: `https://floodaid-api.onrender.com`
- Local: `http://localhost:5273`

### Endpoints

#### 1. Create Cash Donation Session
**POST** `/api/donation/create-session`

Creates a Stripe Checkout Session for cash donations.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "amount": 1000.00
}
```

**Response (200 OK):**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Notes:**
- Amount is in PKR, converted to paisa (×100) for Stripe
- Email confirmation sent asynchronously (non-blocking)
- Success URL: `https://flood-aid-94zg.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`
- Cancel URL: `https://flood-aid-94zg.vercel.app/cancel`

---

#### 2. Create Supplies Donation
**POST** `/api/donation/create-supplies`

Records a supplies (in-kind) donation.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "description": "10 blankets, 5 kg rice"
}
```

**Response (200 OK):**
```json
{
  "id": "a1b2c3d4-...",
  "receiptId": "a1b2c3d4-..."
}
```

**Notes:**
- Receipt ID is auto-generated (GUID)
- Email confirmation sent asynchronously

---

#### 3. Get Session Details
**GET** `/api/donation/session/{id}`

Retrieves Stripe Checkout Session details (used by Success page).

**Parameters:**
- `id` (path): Stripe session ID (e.g., `cs_test_...`)

**Response (200 OK):**
```json
{
  "id": "cs_test_...",
  "amount": 1000.00,
  "currency": "pkr",
  "paymentStatus": "paid",
  "email": "john@example.com"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Session not found"
}
```

---

#### 4. Health Check
**GET** `/health`

Returns service health status (used by Render monitoring and keep-alive pinger).

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2025-12-21T10:30:00Z"
}
```

---

#### 5. Email Diagnostics
**GET** `/api/email/diagnose`

Tests email service configuration (DNS, TCP connectivity).

**Response (200 OK):**
```json
{
  "host": "smtp-relay.brevo.com",
  "port": 587,
  "fromEmail": "noreply@floodaid.com",
  "smtpUserSet": true,
  "enableSsl": true,
  "dnsResolvable": true,
  "connectMs": 45,
  "error": null
}
```

---

### Error Handling
All endpoints return consistent error responses:

**500 Internal Server Error:**
```json
{
  "error": "Failed to create payment session"
}
```

Errors are logged with correlation IDs for debugging.

---

## Frontend Application

### Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Navigation bar
│   │   ├── Footer.jsx          # Footer with links
│   │   ├── Hero.jsx            # Landing page hero
│   │   ├── StatsSection.jsx    # Donation statistics
│   │   ├── donations.jsx       # Donation form (cash/supplies)
│   │   ├── contact.jsx         # Contact form
│   │   └── FloodAidChatbot.jsx # AI chatbot
│   ├── Pages/
│   │   ├── HomePage.jsx        # Landing page
│   │   ├── DonationPage.jsx    # Donation flow page
│   │   ├── ContactPage.jsx     # Contact page
│   │   ├── SuccessPage.jsx     # Payment success
│   │   └── CancelPage.jsx      # Payment cancelled
│   ├── services/
│   │   ├── keepAliveService.js # Backend pinger
│   │   └── ai/
│   │       ├── aiService.js    # AI orchestration
│   │       └── mistralService.js # Mistral AI integration
│   ├── styles/               # Component styles
│   ├── App.jsx               # Router config
│   └── main.jsx              # Entry point
├── public/                   # Static assets
├── .env                      # Environment variables (gitignored)
├── .env.example              # Template
├── package.json
└── vite.config.js
```

### Routing

| Route       | Component        | Description                     |
|-------------|------------------|---------------------------------|
| `/`         | HomePage         | Landing page with hero/stats    |
| `/donate`   | DonationPage     | Cash/supplies donation form     |
| `/contact`  | ContactPage      | Contact form                    |
| `/success`  | SuccessPage      | Payment confirmation            |
| `/cancel`   | CancelPage       | Payment cancelled message       |

**SPA Routing Fix:**
- All routes rewrite to `/index.html` via `vercel.json`
- Prevents 404 on direct URL access or refresh

### Key Components

#### donations.jsx
Handles both cash and supplies donations:
- Form validation
- Conditional fields based on donation type
- Stripe session creation for cash donations
- Direct submission for supplies

**API Integration:**
```javascript
const apiUrl = `${import.meta.env.VITE_API_BASE}/api/donation/create-session`;
const response = await fetch(apiUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, amount })
});
const { url } = await response.json();
window.location.assign(url); // Redirect to Stripe
```

#### SuccessPage.jsx
Displays payment confirmation:
- Fetches session details from backend using `session_id` query param
- Shows actual amount paid (not hardcoded)
- Displays receipt ID and date

#### keepAliveService.js
Pings backend `/health` every 10 minutes to prevent Render cold starts.
- Runs in all environments (dev + production)
- Started automatically in `App.jsx` on mount

---

## External Services

### Stripe Integration

**Purpose:** Process credit/debit card payments in PKR.

**Configuration:**
- **Test Mode Keys:**
  - Publishable: `pk_test_51SgKaO0HsGoNt3VV...` (frontend)
  - Secret: `sk_test_51SgKaO0HsGoNt3VV...` (backend)
- **Currency:** PKR (Pakistani Rupee)
- **Payment Methods:** Card only
- **Mode:** payment (one-time, not subscription)

**Checkout Session URLs:**
- Success: `https://flood-aid-94zg.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`
- Cancel: `https://flood-aid-94zg.vercel.app/cancel`

**Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
CVC: Any 3 digits
Expiry: Any future date
```

---

### Brevo Email Service

**Purpose:** Send donation confirmation emails.

**Why REST API instead of SMTP?**
- Render's free tier blocks outbound SMTP (port 587)
- Brevo REST API uses HTTPS (port 443), which works everywhere

**Configuration:**
- **API Key:** `xkeysib-...` (from Brevo dashboard → SMTP & API → API Keys)
- **Endpoint:** `https://api.brevo.com/v3/smtp/email`
- **Sender Verification:** `epicgames09090808@gmail.com` must be verified in Brevo

**Email Template:**
```html
<h2>Thank you for your generous donation!</h2>
<p>Dear {donorName},</p>
<p>We have received your donation of <strong>PKR {amount}</strong>.</p>
<p>Receipt ID: <strong>{receiptId}</strong></p>
```

**Error Handling:**
- Emails sent asynchronously (fire-and-forget)
- Failures logged but don't block donation flow
- Common issues: unverified sender, invalid API key, rate limits

---

## Deployment

### Frontend (Vercel)

**Hosting:** Static site on Vercel CDN  
**Auto-Deploy:** Pushes to `main` branch trigger builds  
**Build Command:** `npm run build`  
**Output Directory:** `dist`

**Environment Variables (Vercel Dashboard):**
```
VITE_API_BASE=https://floodaid-api.onrender.com
VITE_STRIPE_PUBLIC_KEY=pk_test_51SgKaO0HsGoNt3VV...
```

**Routing Configuration (vercel.json):**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Deployment Steps:**
1. Push to `main` → Vercel auto-detects changes
2. Build triggers (typically 30-60s)
3. Deploy to production URL
4. CDN cache purged automatically

---

### Backend (Render)

**Hosting:** Docker container on Render  
**Auto-Deploy:** Pushes to `main` branch trigger builds  
**Build:** Dockerfile (multi-stage build)

**Dockerfile Overview:**
```dockerfile
# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
COPY backend/FloodAid.Api/ /src/
RUN dotnet publish -c Release -o /app

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0
COPY --from=build /app /app
EXPOSE 8080
CMD ["dotnet", "/app/FloodAid.Api.dll"]
```

**Environment Variables (Render Dashboard):**
```
ASPNETCORE_ENVIRONMENT=Production
Email__BrevoApiKey=xkeysib-...
Email__FromEmail=epicgames09090808@gmail.com
Email__FromName=Flood Aid
Stripe__ApiKey=sk_test_51SgKaO0HsGoNt3VV...
```

**Render Configuration (render.yaml):**
```yaml
services:
  - type: web
    name: floodaid-api
    env: docker
    dockerfilePath: ./Dockerfile
    envVars:
      - key: ASPNETCORE_URLS
        value: http://0.0.0.0:8080
```

**Health Checks:**
- Endpoint: `GET /health`
- Interval: 60 seconds
- Timeout: 10 seconds
- Unhealthy threshold: 3 failures

**Cold Start Mitigation:**
- Frontend pings `/health` every 10 minutes
- Keeps instance warm on free tier

---

## Configuration

### Backend Environment Variables

| Variable                  | Description                          | Example                          |
|---------------------------|--------------------------------------|----------------------------------|
| `ASPNETCORE_ENVIRONMENT`  | Runtime environment                  | `Development` or `Production`    |
| `Stripe__ApiKey`          | Stripe secret key                    | `sk_test_...`                    |
| `Email__BrevoApiKey`      | Brevo API key (not SMTP key)        | `xkeysib-...`                    |
| `Email__FromEmail`        | Verified sender email                | `epicgames09090808@gmail.com`    |
| `Email__FromName`         | Sender display name                  | `Flood Aid`                      |

**Notes:**
- Use double underscore `__` for nested config in env vars
- Maps to JSON: `Email__FromEmail` → `Email:FromEmail`
- Render auto-injects `PORT` (use `ASPNETCORE_URLS` instead)

---

### Frontend Environment Variables

| Variable                   | Description                     | Example                               |
|----------------------------|---------------------------------|---------------------------------------|
| `VITE_API_BASE`            | Backend API URL                 | `https://floodaid-api.onrender.com`   |
| `VITE_STRIPE_PUBLIC_KEY`   | Stripe publishable key          | `pk_test_...`                         |

**Notes:**
- Must prefix with `VITE_` to expose to client bundle
- Set in Vercel dashboard (not `.env` in repo)
- `.env.example` shows required vars for local dev

---

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- .NET SDK 9.0
- Git
- Stripe account (test mode)
- Brevo account (free tier)

### Backend Setup

1. **Clone and navigate:**
```bash
git clone https://github.com/FarhanShakeel25/Flood_Aid.git
cd Flood_Aid/backend/FloodAid.Api
```

2. **Configure `appsettings.Development.json`:**
```json
{
  "Stripe": {
    "ApiKey": "sk_test_YOUR_KEY"
  },
  "Email": {
    "BrevoApiKey": "xkeysib-YOUR_KEY",
    "FromEmail": "your-verified@email.com",
    "FromName": "Flood Aid"
  }
}
```

3. **Restore and run:**
```bash
dotnet restore
dotnet run
```

Backend runs on `http://localhost:5273` (or port from `launchSettings.json`).

4. **Test endpoints:**
```bash
curl http://localhost:5273/health
curl http://localhost:5273/api/email/diagnose
```

---

### Frontend Setup

1. **Navigate to frontend:**
```bash
cd frontend
```

2. **Create `.env` from template:**
```bash
cp .env.example .env
```

3. **Edit `.env`:**
```
VITE_API_BASE=http://localhost:5273
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
```

4. **Install and run:**
```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

---

### Testing Locally

**Test Cash Donation:**
1. Open `http://localhost:5173/donate`
2. Select "Cash", fill form, click "Proceed to payment"
3. Should redirect to Stripe (test mode)
4. Use test card `4242 4242 4242 4242`
5. Complete payment → redirects to `/success`
6. Check backend console for email logs

**Test Supplies Donation:**
1. Select "Other Supplies", fill form
2. Submit → should show success message
3. Check backend console for email logs

---

### Common Issues

**Email not sending locally:**
- Ensure `Email:BrevoApiKey` is set in `appsettings.Development.json`
- Verify sender email in Brevo dashboard
- Check backend logs for API errors

**CORS errors:**
- Backend allows all origins in dev (check `Program.cs`)
- Ensure frontend uses correct `VITE_API_BASE`

**Stripe redirect fails:**
- Verify `Stripe:ApiKey` is test key (`sk_test_...`)
- Check network tab for 500 errors
- Review backend logs for Stripe exceptions

---

## Troubleshooting

### Backend Logs (Render)
- Go to Render dashboard → Service → Logs
- Filter by severity (Info, Error)
- Look for `EmailService called`, `Email sent successfully`, or SMTP errors

### Frontend Console (Browser DevTools)
- Check Network tab for failed API calls
- Verify `VITE_API_BASE` in Sources → main.js
- Look for CORS or 404 errors

### Deployment Issues

**Render build fails:**
- Check Dockerfile paths match repo structure
- Verify `backend/FloodAid.Api/FloodAid.Api.csproj` exists
- Review build logs for missing dependencies

**Vercel build fails:**
- Check `package.json` scripts (`npm run build`)
- Verify `vite.config.js` output directory
- Ensure no missing dependencies in `package.json`

**Cold starts on Render:**
- Keep-alive service should ping every 10 min
- Check frontend console for ping logs
- Manually hit `/health` to wake instance

---

## Security Considerations

### Secrets Management
- ❌ Never commit API keys to git
- ✅ Use environment variables (Render/Vercel dashboards)
- ✅ `.env` is gitignored
- ✅ Stripe keys: use test mode in dev, production mode in prod

### CORS Policy
- Production: restrict to frontend domain only
- Development: allow all (for local testing)

### Payment Security
- Stripe handles all card data (PCI compliant)
- Backend never sees card numbers
- Frontend redirects to Stripe-hosted checkout

---

## Future Enhancements

- [ ] Admin dashboard for viewing donations
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Webhook handling for Stripe payment events
- [ ] PDF receipt generation
- [ ] Multi-currency support
- [ ] Recurring donations (subscriptions)
- [ ] SMS notifications via Twilio
- [ ] Analytics dashboard (donation trends)

---

## Support & Maintenance

**Repository:** https://github.com/FarhanShakeel25/Flood_Aid  
**Issues:** Use GitHub Issues for bug reports  
**Pull Requests:** All changes via feature branches + PR review

**Monitoring:**
- Render: Built-in metrics (CPU, memory, response time)
- Vercel: Analytics dashboard (page views, performance)
- Stripe: Dashboard for payment tracking

---

*Last Updated: December 21, 2025*