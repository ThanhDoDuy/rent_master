# RentMaster Backend

NestJS backend for RentMaster SaaS - Property Management System for Vietnam.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Start MongoDB and Redis with Docker Compose:**
```bash
docker-compose up -d
```

This will start:
- MongoDB on `localhost:27017`
- Redis on `localhost:6379`

3. **Create `.env` file:**
```bash
cp .env.example .env
```

4. **Start the development server:**
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

## 📋 Available Scripts

- `npm run build` - Build the project
- `npm run start` - Start production server
- `npm run start:dev` - Start development server with hot reload
- `npm run start:debug` - Start with debug mode
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## 🗄️ Database

### MongoDB Connection

Default connection string:
```
mongodb://admin:admin123@localhost:27017/rentmaster?authSource=admin
```

### Docker Commands

**Start services:**
```bash
docker-compose up -d
```

**Stop services:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f mongodb
docker-compose logs -f redis
```

**Remove volumes (clean data):**
```bash
docker-compose down -v
```

## 🔐 Authentication

### Current Flow (Email/Password)

**Register** (`POST /auth/register`):
- Email (required, unique)
- Password (min 6 characters)
- Phone (optional)
- Returns: sessionToken + user info

**Login** (`POST /auth/login`):
- Email + Password
- Returns: sessionToken + user info (7 days session)

**Get Me** (`GET /auth/me`):
- Get current user info
- Requires JWT token

**Change Password** (`PUT /auth/change-password`):
- Old password + New password
- Requires JWT token

### JWT Authentication

All endpoints except `/auth/register` and `/auth/login` require JWT authentication.

Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

Token contains: userId, accountId, role, nonce (validated against database session)

## 📚 API Endpoints

### Auth
- `POST /auth/register` - Register new landlord
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user info

### Buildings
- `POST /buildings` - Create building
- `GET /buildings` - List buildings
- `PATCH /buildings/:id` - Update building
- `DELETE /buildings/:id` - Delete building

### Rooms
- `POST /rooms` - Create room
- `GET /rooms` - List rooms
- `GET /rooms/:id` - Get room details
- `PATCH /rooms/:id` - Update room

### Tenant Profiles
- `POST /tenant-profiles` - Create tenant profile
- `GET /tenant-profiles` - List tenant profiles
- `GET /tenant-profiles/:id` - Get tenant profile
- `PATCH /tenant-profiles/:id` - Update tenant profile

### Contracts
- `POST /contracts` - Check-in (create contract)
- `GET /contracts` - List contracts
- `PATCH /contracts/:id/end` - Check-out (end contract)

### Meter Readings
- `POST /meter-readings/bulk` - Bulk upsert meter readings
- `GET /meter-readings` - List meter readings

### Billing
- `POST /billing/run` - Generate invoices for billing period

### Invoices
- `GET /invoices` - List invoices
- `GET /invoices/:id` - Get invoice details
- `PATCH /invoices/:id` - Update invoice

### Payments
- `POST /payments` - Create payment
- `GET /payments` - List payments

### Reports
- `GET /reports/monthly-revenue?billingPeriod=2025-12` - Monthly revenue
- `GET /reports/debts` - Debt report
- `GET /reports/occupancy` - Occupancy report

## 🏗️ Project Structure

```
src/
├── auth/              # Authentication module
├── buildings/         # Buildings management
├── rooms/            # Rooms management
├── tenant-profiles/   # Tenant profiles
├── contracts/        # Contracts (check-in/check-out)
├── meter-readings/    # Meter readings
├── billing/           # Billing service
├── invoices/          # Invoices
├── payments/          # Payments
├── reports/           # Reports
├── common/            # Shared utilities, guards, decorators
└── app.module.ts      # Root module
```

## 🔧 Environment Variables

See `.env.example` for all available environment variables.

## 📝 License

Private - RentMaster
