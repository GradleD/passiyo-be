const { version } = require('../../package.json');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Event Organizer API',
    version: version || '1.0.0',
    description: 'API documentation for the Event Organizer backend',
    contact: {
      name: 'API Support',
      email: 'support@passiyo.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Development server',
    },
    {
      url: 'https://api.passiyo.com/v1',
      description: 'Production server',
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
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          name: {
            type: 'string',
            example: 'John Doe',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john@example.com',
          },
          role: {
            type: 'string',
            enum: ['organizer', 'admin'],
            example: 'organizer',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-01T00:00:00Z',
          },
        },
      },
      Event: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440001',
          },
          title: {
            type: 'string',
            example: 'Tech Conference 2025',
          },
          description: {
            type: 'string',
            example: 'Annual technology conference',
          },
          start_date: {
            type: 'string',
            format: 'date-time',
            example: '2025-04-15T09:00:00Z',
          },
          end_date: {
            type: 'string',
            format: 'date-time',
            example: '2025-04-16T18:00:00Z',
          },
          location: {
            type: 'string',
            example: 'Convention Center, New York',
          },
          capacity: {
            type: 'integer',
            example: 500,
          },
          status: {
            type: 'string',
            enum: ['draft', 'published', 'cancelled', 'completed'],
            example: 'published',
          },
          image_url: {
            type: 'string',
            format: 'uri',
            example: 'https://example.com/images/event.jpg',
          },
          created_by: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-01T00:00:00Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-02T12:00:00Z',
          },
        },
      },
      Attendee: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440002',
          },
          name: {
            type: 'string',
            example: 'Jane Smith',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'jane@example.com',
          },
          phone: {
            type: 'string',
            example: '+1234567890',
          },
          ticket_type: {
            type: 'string',
            example: 'VIP',
          },
          status: {
            type: 'string',
            enum: ['registered', 'checked_in', 'cancelled'],
            example: 'registered',
          },
          event_id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440001',
          },
          check_in_time: {
            type: 'string',
            format: 'date-time',
            example: '2025-04-15T10:30:00Z',
            nullable: true,
          },
          registration_date: {
            type: 'string',
            format: 'date-time',
            example: '2025-03-20T08:00:00Z',
          },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440003',
          },
          order_id: {
            type: 'string',
            example: 'order_NmMyMTAyMjE',
          },
          payment_id: {
            type: 'string',
            example: 'pay_NmMyMTAyMjE',
            nullable: true,
          },
          amount: {
            type: 'number',
            example: 4999,
          },
          currency: {
            type: 'string',
            example: 'INR',
          },
          status: {
            type: 'string',
            enum: ['created', 'attempted', 'captured', 'failed', 'refunded'],
            example: 'captured',
          },
          event_id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440001',
          },
          attendee_id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440002',
          },
          ticket_type_id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440004',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2025-03-20T10:30:00Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2025-03-20T10:31:00Z',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'error',
          },
          message: {
            type: 'string',
            example: 'Error message describing the issue',
          },
          ...(process.env.NODE_ENV === 'development' && {
            stack: {
              type: 'string',
              example: 'Error stack trace (only in development)',
            },
          }),
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              status: 'error',
              message: 'Unauthorized: No token provided',
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              status: 'error',
              message: 'Event not found',
            },
          },
        },
      },
      BadRequest: {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              status: 'error',
              message: 'Validation error',
              errors: [
                {
                  field: 'email',
                  message: 'Invalid email format',
                },
              ],
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              status: 'error',
              message: 'An unexpected error occurred',
            },
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
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js',
  ],
};

module.exports = options;
