# School Management System

A comprehensive School Management System built with Node.js + Express.js (backend) and React.js + TypeScript (frontend), specifically optimized for Nepal's education system with full NEB compliance, Bikram Sambat calendar support, and offline-first architecture.

## Features

- **NEB Compliance**: Full support for Nepal's National Examination Board grading system
- **Bikram Sambat Calendar**: Native support for Nepal's official calendar system
- **Offline-First**: Critical operations work without internet connectivity
- **Low-Bandwidth Optimized**: Designed for 2G/3G networks
- **Bilingual**: Complete Nepali and English language support
- **Comprehensive Modules**: 17+ modules covering all school operations
- **Role-Based Access**: 13 distinct user roles with granular permissions
- **Payment Integration**: eSewa, Khalti, and IME Pay support

## Technology Stack

### Backend
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Database**: MySQL 8.0+ with InnoDB engine
- **Cache**: Redis 7.x
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.IO
- **Testing**: Jest, fast-check (property-based), Playwright

### Frontend
- **Framework**: React.js 18+
- **Language**: TypeScript 5.x
- **State Management**: Redux Toolkit with RTK Query
- **UI Framework**: Material-UI (MUI) v5
- **Routing**: React Router v6
- **Build Tool**: Vite
- **PWA**: Service Workers with Workbox
- **Testing**: Jest, fast-check, Playwright

### DevOps
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx
- **CI/CD**: GitHub Actions
- **Logging**: Winston with file rotation

## Prerequisites

- Node.js 18+ LTS
- npm 9+
- MySQL 8.0+
- Redis 7.x
- Docker & Docker Compose (optional)

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd school-management-system
```

2. Create environment files:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Update the environment variables in `.env` files

4. Start all services:
```bash
docker-compose up -d
```

5. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api-docs

### Manual Setup

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update database and Redis configuration in `.env`

5. Run database migrations:
```bash
npm run migrate:up
```

6. Start development server:
```bash
npm run dev
```

#### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Start development server:
```bash
npm run dev
```

## Development

### Backend Commands

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests with coverage
npm run test:watch   # Run tests in watch mode
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
npm run typecheck    # Type check without emitting
npm run migrate:up   # Run database migrations
npm run migrate:down # Rollback migrations
npm run seed         # Seed database with sample data
```

### Frontend Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests with coverage
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run E2E tests with Playwright
npm run test:e2e:ui  # Run E2E tests with UI
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
npm run typecheck    # Type check without emitting
```

## Project Structure

```
school-management-system/
├── backend/                 # Backend application
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Express middleware
│   │   ├── modules/        # Feature modules
│   │   ├── models/         # Database models
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript types
│   │   ├── migrations/     # Database migrations
│   │   ├── tests/          # Test files
│   │   ├── app.ts          # Express app setup
│   │   └── server.ts       # Server entry point
│   ├── uploads/            # File uploads
│   ├── logs/               # Application logs
│   └── package.json
├── frontend/               # Frontend application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── features/       # Feature modules
│   │   ├── store/          # Redux store
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utility functions
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   ├── tests/          # Test files
│   │   ├── App.tsx         # Root component
│   │   └── main.tsx        # Entry point
│   ├── e2e/                # E2E tests
│   └── package.json
├── docker-compose.yml      # Docker Compose configuration
└── README.md

```

## Testing

### Unit Tests
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### Property-Based Tests
Property-based tests using fast-check are included to validate universal correctness properties.

### E2E Tests
```bash
cd frontend && npm run test:e2e
```

## Deployment

### Production Build

1. Build backend:
```bash
cd backend && npm run build
```

2. Build frontend:
```bash
cd frontend && npm run build
```

3. Deploy using Docker:
```bash
docker-compose --profile production up -d
```

## Environment Variables

See `.env.example` files in backend and frontend directories for all available configuration options.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please create an issue in the repository.

## Acknowledgments

- Built for Nepal's education system
- Compliant with NEB standards
- Optimized for low-bandwidth environments
