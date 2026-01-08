export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Movie Explorer API',
    version: '1.0.0',
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        security: [],
        responses: {
          '200': {
            description: 'Health check',
          },
        },
      },
    },
    '/favorites': {
      get: {
        responses: {
          '200': { description: 'List favorites' },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        responses: {
          '201': { description: 'Created' },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
          '409': { description: 'Already exists' },
        },
      },
    },
    '/favorites/{id}': {
      put: {
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Updated' },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Not found' },
        },
      },
      delete: {
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Deleted' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/recommendations/{movieId}': {
      get: {
        parameters: [
          { name: 'movieId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Recommendations' },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
  },
} as const;
