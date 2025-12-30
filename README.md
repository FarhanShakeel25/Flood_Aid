# Flood Aid - Disaster Relief Donation Platform

![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

**Flood Aid** is a comprehensive full-stack web application designed to streamline disaster relief donations. The platform enables individuals and organizations to contribute financial aid and supplies to flood-affected communities, with secure payment processing, email notifications, and admin oversight.

## 🌟 Key Features

### For Donors
- **Cash Donations**: Secure payments via Stripe (PKR currency)
- **In-Kind Donations**: Submit supplies and material donations
- **Email Confirmations**: Automatic receipt and confirmation emails
- **Donation Tracking**: View donation status and receipt details
- **Responsive Design**: Works seamlessly on desktop and mobile

### For Administrators
- **Admin Dashboard**: Monitor all donations (pending implementation)
- **Donation Management**: Approve/reject submitted donations
- **Analytics**: View donation statistics and impact
- **Email Management**: Track donation confirmations
- **Secure Authentication**: Role-based access control with JWT tokens

## 📋 Documentation

| Document | Purpose |
|----------|---------|
| [System Documentation](docs/system_docs.md) | Architecture, technology stack, deployment |
| [User Guide](docs/user_docs.md) | How to use the platform |
| [API Documentation](docs/API_DOCS.md) | Complete API reference |
| [Database Schema](docs/DATABASE_SCHEMA.md) | Data models and relationships |
| [Development Guide](docs/DEV_GUIDE.md) | Setup and development instructions |
| [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) | Production deployment |

## 🚀 Quick Start

### Prerequisites
- **Backend**: .NET 10.0, PostgreSQL
- **Frontend**: Node.js 18+, npm/yarn
- **External**: Stripe account, Brevo (Sendinblue) account

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/Flood_Aid.git
cd Flood_Aid
```

#### 2. Backend Setup
```bash
cd backend/FloodAid.Api
dotnet restore
dotnet ef database update
dotnet run
```
Backend runs on: `http://localhost:5273`

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173`

## 🏗️ Technology Stack

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Stripe.js** for payment processing
- **CSS** for styling
- **Vercel** for deployment

### Backend
- **ASP.NET Core 9.0** (Web API)
- **C# 12**
- **Entity Framework Core** for data access
- **PostgreSQL** database
- **Stripe.NET SDK** for payment processing
- **JWT** for authentication
- **Render** for deployment

### External Services
- **Stripe**: Payment gateway (secure checkout)
- **Brevo (Sendinblue)**: Transactional email service
- **PostgreSQL**: Primary data store
- **Redis**: Caching and rate limiting

## 📊 Architecture Overview

```
┌─────────────────────┐
│   Web Browser       │
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │   Vercel    │
    │  (Frontend) │
    └──────┬──────┘
           │ REST API
    ┌──────▼──────────┐     ┌──────────────┐
    │   Render        │────▶│ Stripe API   │
    │  (Backend API)  │     │              │
    └──────┬──────────┘     └──────────────┘
           │
    ┌──────▼──────────┐     ┌──────────────┐
    │  PostgreSQL     │     │ Brevo Email  │
    │   Database      │     │   Service    │
    └─────────────────┘     └──────────────┘
```

## 🔄 Key Workflows

### Cash Donation Flow
1. User enters donation details and amount
2. Frontend creates Stripe Checkout Session
3. User completes payment securely
4. Backend records donation and sends confirmation email
5. Success page displays receipt information

### In-Kind Donation Flow
1. User describes supplies/items to donate
2. Backend records donation request
3. Confirmation email sent to donor
4. Admin reviews and approves/rejects
5. Donor receives status update

## 🔐 Security Features

- **JWT Authentication**: Secure token-based admin access
- **Rate Limiting**: Protection against abuse
- **Password Hashing**: BCrypt with configurable work factor
- **HTTPS**: All communication encrypted
- **CORS**: Origin validation for API requests
- **Stripe PCI Compliance**: Card data handled by Stripe only

## 📦 Project Structure

```
Flood_Aid/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client services
│   │   └── config/       # Configuration files
│   └── package.json
├── backend/              # ASP.NET Core backend
│   └── FloodAid.Api/
│       ├── Controllers/  # API endpoints
│       ├── Models/       # Data models
│       ├── Services/     # Business logic
│       ├── Data/         # Database context
│       └── FloodAid.Api.csproj
├── docs/                 # Documentation
│   ├── system_docs.md
│   ├── user_docs.md
│   ├── API_DOCS.md
│   └── DATABASE_SCHEMA.md
└── README.md
```

## 🌐 Live URLs

| Environment | URL |
|---|---|
| Frontend | https://flood-aid-94zg.vercel.app |
| API | https://floodaid-api.onrender.com |

## 💾 Database

**Primary Database**: PostgreSQL
- **Donations** table: Cash and in-kind donations
- **HelpRequests** table: Supply requests from affected areas
- **AdminUsers** table: Admin accounts with role-based access
- Automatic migrations on application startup

## 🔧 Configuration

### Environment Variables

**Backend (`appsettings.json` or `render.env`):**
```
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=your-secret-key
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
BREVO_API_KEY=your-brevo-api-key
FRONTEND_URL=https://flood-aid-94zg.vercel.app
```

**Frontend (`.env` in frontend/):**
```
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_API_URL=https://floodaid-api.onrender.com
```

## 🧪 Testing

### Run Backend Tests
```bash
cd backend/FloodAid.Api.Tests
dotnet test
```

### Run Frontend Tests
```bash
cd frontend
npm test
```

## 📚 API Examples

### Create Cash Donation
```bash
POST /api/donation/create-session
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "amount": 5000
}
```

### Create In-Kind Donation
```bash
POST /api/donation/create-supplies
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "description": "10 blankets, medical supplies"
}
```

See [API_DOCS.md](docs/API_DOCS.md) for complete API reference.

## 🐛 Troubleshooting

### Backend Issues
- Check database connection in `appsettings.json`
- Verify Stripe and Brevo credentials
- Review logs in Render console

### Frontend Issues
- Clear browser cache and rebuild
- Verify Stripe public key in configuration
- Check CORS settings in backend

### Payment Issues
- Use Stripe test cards for testing
- Verify amount format (in PKR)
- Check Stripe dashboard for declined payments

## 📖 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Brevo Email API](https://developers.brevo.com)
- [ASP.NET Core Documentation](https://learn.microsoft.com/en-us/aspnet/core/)
- [React Documentation](https://react.dev)

## 👥 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Support

For issues, questions, or suggestions, please:
- Open an issue on GitHub
- Contact via the website's contact form
- Email: support@floodaid.org

## 🙏 Acknowledgments

- Stripe for payment processing
- Brevo for email services
- The open-source community
- All contributors and donors

---

**Last Updated**: December 31, 2025  
**Maintainers**: Flood Aid Development Team
