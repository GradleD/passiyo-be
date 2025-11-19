// src/config/swagger.config.js
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Management API',
      version: '1.0.0',
      description: 'API for managing events and attendees',
    },
    servers: [
      {
        url: 'https://passiyo-be.onrender.com',
        description: 'Development server',
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
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string' },
          },
        },  
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            start_date: { type: 'string' },
            end_date: { type: 'string' },
            location: { type: 'string' },
          },
        Attendee: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
              event_id: { type: 'string' },
            },
          },    
        } ,
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            attendee_id: { type: 'string' },
            amount: { type: 'number' },
            payment_date: { type: 'string' },
            payment_method: { type: 'string' },
          },
        },
        Scan: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            attendee_id: { type: 'string' },
            event_id: { type: 'string' },
            scan_date: { type: 'string' },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            attendee_id: { type: 'string' },
            event_id: { type: 'string' },
            ticket_type: { type: 'string' },
            price: { type: 'number' },
            quantity: { type: 'number' },
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
  apis: ['./src/routes/*.js'], // Path to the API routes
};

export default swaggerOptions;