# 🍽️ Meet Minds Backend

<p align="center">
  <strong>Dining Experience Platform Backend</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" alt="Swagger" />
</p>

<p align="center">
  A comprehensive NestJS-powered backend API that connects people through shared dining experiences at partner restaurants, featuring integrated map visibility, payment processing, commission management, and review systems.
</p>

---

## 📋 Table of Contents

- [🌟 Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🔧 Installation](#-installation)
- [🚀 Getting Started](#-getting-started)
- [📚 API Documentation](#-api-documentation)
- [🗂️ Project Structure](#️-project-structure)
- [💰 Business Model](#-business-model)
- [🗺️ Map Integration](#️-map-integration)
- [🔐 Authentication & Security](#-authentication--security)
- [🧪 Testing](#-testing)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)

---

## 🌟 Features

### Core Features
- **👥 One-on-One Dining Experiences**: Create and join intimate dining experiences with strangers or friends
- **🏪 Restaurant Management**: Comprehensive restaurant partner system with location-based discovery
- **🗺️ Interactive Map**: Google Maps integration showing restaurants with active dining experiences
- **💳 Payment Processing**: Integrated payment system with automatic commission and discount calculations
- **⭐ Review System**: Dual rating system for both restaurants and dining experiences
- **📱 Real-time Notifications**: Invitation and response notification system

### Business Features
- **💰 Commission System**: 10% total discount split as 5% platform commission + 5% diner discount
- **🤝 Partner Network**: Restaurant partnership management with custom commission rates
- **📊 Analytics Ready**: Comprehensive data tracking for business insights
- **🔍 Advanced Search**: Location-based, cuisine-type, and preference filtering

### Technical Features
- **📖 OpenAPI Documentation**: Complete Swagger/OpenAPI 3.0 documentation
- **🔒 JWT Authentication**: Secure user authentication and authorization
- **📍 Geospatial Queries**: Location-based restaurant and experience discovery
- **🏗️ Modular Architecture**: Clean, maintainable, and scalable code structure
- **✅ Input Validation**: Comprehensive data validation using class-validator
- **🐳 Docker Ready**: Containerization support for easy deployment

---

## 🏗️ Architecture

### Technology Stack
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Documentation**: Swagger/OpenAPI 3.0
- **Validation**: class-validator & class-transformer
- **Authentication**: JWT (JSON Web Tokens)
- **Location Services**: Geolib for distance calculations
- **Testing**: Jest

### Core Modules

#### 🍽️ **Dining Experience Module**
- Create one-on-one dining experiences
- Handle invitation system (direct & open invitations)
- Manage experience lifecycle (pending → confirmed → completed)
- Process payments and calculate commissions
- Handle cancellations and refunds

#### 🏪 **Restaurant Module**
- Restaurant partner management
- Location-based discovery
- Opening hours and availability
- Commission and discount settings
- Review and rating system

#### 👤 **User Profile Module** (Existing)
- User authentication and profiles
- Preference management
- Social connections

#### 📅 **Event Module** (Existing)
- Group dining events
- Event management system
- Multi-user experiences

---

## 🔧 Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud instance)
- **Git**

### Clone the Repository
```bash
git clone <repository-url>
cd meet-minds-backend
```

### Install Dependencies
```bash
npm install
# or
yarn install
```

### Environment Configuration
Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/meet-minds

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# Google Maps (Optional)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Payment Processor (Optional)
PAYMENT_PROCESSOR_SECRET=your-payment-processor-secret

# Email Service (Optional)
EMAIL_SERVICE_API_KEY=your-email-service-key
```

---

## 🚀 Getting Started

### Development Mode
```bash
# Start in watch mode
npm run start:dev

# The server will be available at http://localhost:3000
```

### Production Mode
```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Database Setup
Ensure MongoDB is running and accessible via the connection string in your `.env` file. The application will automatically create the necessary collections and indexes.

---

## 📚 API Documentation

### Swagger Documentation
Once the server is running, access the interactive API documentation at:
```
http://localhost:3000/api/docs
```

### Main API Endpoints

#### 🏪 Restaurant API (`/restaurant`)
- `POST /restaurant` - Create new restaurant
- `GET /restaurant` - Get restaurants with filtering
- `GET /restaurant/nearby` - Find nearby restaurants
- `GET /restaurant/map` - Get restaurants for map display
- `GET /restaurant/:id` - Get restaurant details
- `PATCH /restaurant/:id` - Update restaurant
- `DELETE /restaurant/:id` - Deactivate restaurant
- `POST /restaurant/:id/review` - Add restaurant review

#### 🍽️ Dining Experience API (`/dining-experience`)
- `POST /dining-experience` - Create dining experience
- `GET /dining-experience/available` - Get available experiences
- `GET /dining-experience/user/:userId` - Get user's experiences
- `GET /dining-experience/:id` - Get experience details
- `PATCH /dining-experience/:id/respond` - Respond to invitation
- `PATCH /dining-experience/:id/cancel` - Cancel experience
- `PATCH /dining-experience/complete` - Complete experience
- `POST /dining-experience/review` - Add experience review

### Authentication
Most endpoints require Bearer token authentication:
```bash
Authorization: Bearer <your-jwt-token>
```

---

## 🗂️ Project Structure

```
src/
├── dining-experience/           # Dining experience module
│   ├── dto/                    # Data transfer objects
│   ├── schema/                 # Mongoose schemas
│   ├── dining-experience.controller.ts
│   ├── dining-experience.service.ts
│   └── dining-experience.module.ts
├── restaurant/                 # Restaurant module
│   ├── dto/                    # Data transfer objects
│   ├── schema/                 # Mongoose schemas
│   ├── restaurant.controller.ts
│   ├── restaurant.service.ts
│   └── restaurant.module.ts
├── profile/                    # User profile module (existing)
├── event/                      # Group events module (existing)
├── auth/                       # Authentication module (existing)
├── common/                     # Shared utilities
├── config/                     # Configuration files
└── main.ts                     # Application entry point
```

---

## 💰 Business Model

### Revenue Structure
- **10% Total Discount** on all bookings via the platform
- **Commission Split**:
  - 5% Platform Commission
  - 5% Diner Discount
- **Restaurant Partnership**: Restaurants offer the discount in exchange for customer acquisition

### Payment Flow
1. User books dining experience
2. Total bill calculated at restaurant
3. 10% discount applied automatically
4. 5% goes to platform as commission
5. 5% passed as savings to diners
6. Restaurant receives 90% of original bill

---

## 🗺️ Map Integration

### Features
- **Restaurant Discovery**: Location-based restaurant search
- **Active Experiences**: Shows restaurants with available dining experiences
- **Radius Filtering**: Customizable search radius
- **Real-time Updates**: Dynamic experience availability

### Google Maps Integration
- Compatible coordinate system
- Geospatial indexing for performance
- Distance calculations using Geolib

---

## 🔐 Authentication & Security

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation
- **Rate Limiting Ready**: Prepared for rate limiting implementation
- **CORS Configuration**: Cross-origin request handling
- **Environment Variables**: Secure configuration management

### Protected Endpoints
All write operations (CREATE, UPDATE, DELETE) require authentication:
- Restaurant creation and modification
- Dining experience operations
- Review submissions
- Payment processing

---

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Testing Strategy
- **Unit Tests**: Service layer business logic
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete user workflow testing
- **Mocking**: External service mocking for isolated testing

---

## 🚀 Deployment

### Docker Deployment
```bash
# Build Docker image
docker build -t meet-minds-backend .

# Run container
docker run -p 3000:3000 --env-file .env meet-minds-backend
```

### Environment Setup
1. **Production Database**: Set up MongoDB cluster
2. **Environment Variables**: Configure production secrets
3. **SSL Certificates**: Set up HTTPS
4. **Load Balancing**: Configure for high availability
5. **Monitoring**: Set up application monitoring

### Recommended Deployment Platforms
- **AWS**: ECS, Lambda, or EC2
- **Google Cloud**: Cloud Run or GKE
- **Heroku**: Simple deployment with add-ons
- **DigitalOcean**: App Platform or Droplets

---

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message standards

### Before Submitting
- Run tests: `npm run test`
- Check linting: `npm run lint`
- Update documentation if needed
- Ensure all new endpoints have Swagger documentation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

For support, questions, or contributions:
- **Issues**: Open a GitHub issue
- **Documentation**: Check `/api/docs` for API documentation
- **Contributing**: See contributing guidelines above

---

**Built with ❤️ using NestJS, TypeScript, and MongoDB**
