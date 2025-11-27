# NPS Survey API

Backend API for the NPS Survey Agent Platform built with NestJS and PostgreSQL.

## Features

- **Authentication**: JWT-based authentication with refresh tokens
- **User Management**: User registration, login, profile management
- **Organization Management**: Multi-tenant support with team management
- **Survey Management**: Create, edit, publish, and manage NPS surveys
- **Response Collection**: Collect and analyze survey responses
- **Customer Management**: Import, segment, and track customers
- **Analytics**: Dashboard metrics, NPS trends, segment analysis
- **Distribution**: Email campaigns, shareable links, QR codes, website widgets

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL with TypeORM
- **Authentication**: Passport.js with JWT
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your database credentials

5. Create the database:
   ```sql
   CREATE DATABASE nps_survey_db;
   ```

6. Start the development server:
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3001`

## API Documentation

Once the server is running, access Swagger documentation at:
`http://localhost:3001/api/docs`

## Available Scripts

```bash
# Development
npm run start:dev

# Production build
npm run build

# Start production server
npm run start:prod

# Run migrations
npm run migration:run

# Generate migration
npm run migration:generate -- src/database/migrations/MigrationName

# Revert last migration
npm run migration:revert
```

## Project Structure

```
src/
├── auth/           # Authentication (JWT, strategies, guards)
├── users/          # User management
├── organizations/  # Organization & team management
├── surveys/        # Survey CRUD operations
├── responses/      # Survey response handling
├── customers/      # Customer management
├── analytics/      # Analytics & reporting
├── distribution/   # Survey distribution campaigns
├── settings/       # User & organization settings
├── common/         # Shared utilities, entities, decorators
├── database/       # Database configuration & migrations
├── app.module.ts   # Root application module
└── main.ts         # Application entry point
```

## Database Schema

### Core Entities

- **User**: Application users
- **Organization**: Multi-tenant organizations
- **TeamMember**: User-organization relationships with roles
- **Survey**: NPS surveys
- **Question**: Survey questions
- **SurveyResponse**: Customer responses
- **Answer**: Individual question answers
- **Customer**: Organization customers
- **DistributionCampaign**: Survey distribution tracking
- **NotificationPreference**: User notification settings
- **AuditLog**: Activity logging

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/change-password` - Change password

### Users
- `GET /api/users/me` - Get current user
- `PATCH /api/users/me` - Update current user

### Organizations
- `GET /api/organizations/me` - Get organization
- `PATCH /api/organizations/me` - Update organization
- `GET /api/organizations/me/team` - Get team members
- `POST /api/organizations/me/team/invite` - Invite team member

### Surveys
- `GET /api/surveys` - List surveys
- `POST /api/surveys` - Create survey
- `GET /api/surveys/:id` - Get survey
- `PATCH /api/surveys/:id` - Update survey
- `POST /api/surveys/:id/publish` - Publish survey
- `POST /api/surveys/:id/close` - Close survey
- `DELETE /api/surveys/:id` - Delete survey

### Responses
- `GET /api/responses` - List responses
- `GET /api/responses/:id` - Get response
- `POST /api/s/:shareCode/respond` - Submit public response

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `POST /api/customers/import` - Import customers
- `GET /api/customers/export` - Export customers

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/nps-trend` - NPS trend data
- `GET /api/analytics/segment-distribution` - Segment breakdown

### Distribution
- `POST /api/distributions/email` - Create email campaign
- `POST /api/distributions/link` - Create shareable link
- `POST /api/distributions/qr` - Create QR code
- `POST /api/distributions/widget` - Create website widget

## Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy:
   ```bash
   vercel --prod
   ```

### Environment Variables for Production

```
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
JWT_SECRET=<strong-random-string>
JWT_REFRESH_SECRET=<another-strong-random-string>
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

## License

MIT
