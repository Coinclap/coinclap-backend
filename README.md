# Express TypeScript Backend

A professional, scalable Express.js backend built with TypeScript, featuring MongoDB integration, comprehensive middleware, and industry-standard architecture patterns.

## 🚀 Features

- **TypeScript**: Full TypeScript support with strict type checking
- **MongoDB**: Mongoose ODM with advanced schema validation
- **Authentication**: JWT-based authentication with role-based access control
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Logging**: Winston logger with multiple transports
- **Testing**: Jest testing framework with coverage reports
- **Docker**: Multi-stage Docker builds with docker-compose
- **CI/CD**: GitHub Actions workflow for automated testing and deployment
- **Scalability**: Designed for microservices and cloud deployment

## 📁 Project Structure

\`\`\`
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── enums/          # TypeScript enums
├── middleware/     # Express middleware
├── models/         # Mongoose models
├── repositories/   # Data access layer
├── routes/         # Route definitions
├── services/       # Business logic layer
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── validators/     # Input validation schemas
└── __tests__/      # Test files
\`\`\`

## 🛠️ Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd express-typescript-backend
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

4. **Start MongoDB**
   \`\`\`bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   
   # Or using docker-compose
   docker-compose up -d mongo
   \`\`\`

5. **Run the application**
   \`\`\`bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   \`\`\`

## 🐳 Docker Deployment

1. **Using Docker Compose (Recommended)**
   \`\`\`bash
   docker-compose up -d
   \`\`\`

2. **Using Docker directly**
   \`\`\`bash
   docker build -t coinclap .
   docker run -p 8000:8000 coinclap
   \`\`\`

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/v1/users/register` - Register a new user
- `POST /api/v1/users/login` - Login user

### User Management Endpoints

- `GET /api/v1/users/me` - Get current user profile
- `GET /api/v1/users` - Get all users (Admin only)
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user (Admin only)
- `GET /api/v1/users/search?q=term` - Search users

### Health Check

- `GET /api/v1/health` - Server health status

## 🧪 Testing

\`\`\`bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
\`\`\`

## 🔧 Development

\`\`\`bash
# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
\`\`\`

## 🏗️ Architecture Patterns

### Repository Pattern
Data access is abstracted through repository classes, making it easy to switch between different data sources.

### Service Layer
Business logic is encapsulated in service classes, keeping controllers thin and focused on HTTP concerns.

### Dependency Injection
Services and repositories are injected as dependencies, improving testability and maintainability.

### Error Handling
Centralized error handling with custom error classes and middleware.

### Validation
Input validation using Joi schemas with custom error messages.

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Request rate limiting per IP
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive input validation
- **Password Hashing**: Bcrypt password hashing
- **SQL Injection Protection**: Mongoose ODM protection

## 📊 Monitoring & Logging

- **Winston Logger**: Structured logging with multiple levels
- **Request Logging**: HTTP request/response logging
- **Error Tracking**: Comprehensive error logging
- **Health Checks**: Application health monitoring

## 🚀 Deployment

### Environment Variables

Key environment variables to configure:

- `NODE_ENV`: Environment (development/staging/production)
- `PORT`: Server port
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `CORS_ORIGINS`: Allowed CORS origins

### Production Considerations

1. **Database**: Use MongoDB Atlas or managed MongoDB service
2. **Caching**: Implement Redis for session storage and caching
3. **Load Balancing**: Use Nginx or cloud load balancers
4. **Monitoring**: Integrate with Sentry, New Relic, or similar
5. **Secrets Management**: Use AWS Secrets Manager or similar
6. **Container Orchestration**: Deploy with Kubernetes or Docker Swarm

## 🔄 Future Enhancements

- **Microservices**: Split into domain-specific services
- **Event Sourcing**: Implement event-driven architecture
- **GraphQL**: Add GraphQL API alongside REST
- **Real-time**: WebSocket support for real-time features
- **File Upload**: S3 integration for file storage
- **Email Service**: Integration with SendGrid or similar
- **Payment Processing**: Stripe integration
- **Search**: Elasticsearch integration
- **Caching**: Redis caching layer
- **Message Queue**: RabbitMQ or AWS SQS integration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please open an issue in the GitHub repository.
