import swaggerJsdoc from 'swagger-jsdoc';
import { AppConfig } from './app';

const config = AppConfig.getInstance();
const serverUrl = process.env.SERVER_URL || `http://localhost:${config.port}`;
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Coinclap Application API',
      version: '1.0.0',
      description: 'Official API documentation for the Coinclap application',
      contact: {
        name: 'Soumyaraj Bag',
        email: 'soumyarajbag@gmail.com',
      },
    },
    servers: [
      {
        url: `${serverUrl}/api/v1`,
        description: config.isDevelopment() ? 'Development server' : 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            fullName: {
              type: 'string',
              description: "User's full name",
            },
            phoneNumber: {
              type: 'string',
              description: "User's phone number",
            },
            countryCode: {
              type: 'string',
              description: 'Country code',
              default: '+91',
            },
            email: {
              type: 'string',
              format: 'email',
              description: "User's email address",
            },
            dob: {
              type: 'string',
              format: 'date',
              description: 'Date of birth',
            },
            gender: {
              type: 'string',
              enum: ['MALE', 'FEMALE', 'OTHER'],
              description: "User's gender",
            },
            bio: {
              type: 'string',
              maxLength: 160,
              description: "User's bio",
            },
            country: {
              type: 'string',
              description: "User's country",
            },
            city: {
              type: 'string',
              description: "User's city",
            },
            state: {
              type: 'string',
              description: "User's state",
            },
            pincode: {
              type: 'string',
              description: "User's pincode",
            },
            accountType: {
              type: 'string',
              enum: ['PERSONAL', 'BUSINESS'],
              description: 'Account type',
            },
            website: {
              type: 'string',
              format: 'uri',
              description: "User's website",
            },
            username: {
              type: 'string',
              description: 'Unique username',
            },
            areaOfInterests: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: "User's areas of interest",
            },
            profileImageUrl: {
              type: 'string',
              format: 'uri',
              description: 'Profile image URL',
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'moderator', 'guest'],
              description: 'User role',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether user is active',
            },
            step: {
              type: 'string',
              enum: ['EMAIL_VERIFICATION', 'MOBILE_VERIFICATION', 'USER_DETAILS', 'COMPLETED'],
              description: 'Current onboarding step',
            },
            isEmailVerified: {
              type: 'boolean',
              description: 'Whether email is verified',
            },
            isPhoneVerified: {
              type: 'boolean',
              description: 'Whether phone is verified',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the request was successful',
            },
            message: {
              type: 'string',
              description: 'Response message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            error: {
              type: 'string',
              description: 'Error message if any',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Response timestamp',
            },
            requestId: {
              type: 'string',
              description: 'Unique request ID',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            error: {
              type: 'string',
              description: 'Detailed error description',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            requestId: {
              type: 'string',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
