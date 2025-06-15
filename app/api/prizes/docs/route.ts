import { NextResponse } from 'next/server';

export async function GET() {
  const docs = {
    openapi: '3.0.0',
    info: {
      title: 'KissMint Prize Distribution API',
      version: '1.0.0',
      description: 'API for managing prize distributions in the KissMint platform',
    },
    servers: [
      { url: 'http://localhost:3000/api', description: 'Development server' },
      { url: 'https://your-production-url.com/api', description: 'Production server' },
    ],
    paths: {
      '/prizes/distributions': {
        get: {
          summary: 'List all prize distributions',
          description: 'Get a paginated list of all prize distributions with optional filtering',
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Page number',
              schema: { type: 'integer', default: 1 },
            },
            {
              name: 'pageSize',
              in: 'query',
              description: 'Number of items per page',
              schema: { type: 'integer', default: 20 },
            },
            {
              name: 'type',
              in: 'query',
              description: 'Filter by pool type',
              schema: { type: 'string', enum: ['daily', 'weekly'] },
            },
            {
              name: 'status',
              in: 'query',
              description: 'Filter by distribution status',
              schema: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
            },
          ],
          responses: {
            '200': {
              description: 'A list of prize distributions',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/PrizeDistributionList',
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error',
            },
          },
        },
        post: {
          summary: 'Trigger a new prize distribution',
          description: 'Start a new prize distribution (admin only)',
          security: [{ apiKey: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['poolType', 'periodIdentifier'],
                  properties: {
                    poolType: {
                      type: 'string',
                      enum: ['daily', 'weekly'],
                      description: 'Type of prize pool',
                    },
                    periodIdentifier: {
                      type: 'string',
                      description: 'Identifier for the period (e.g., YYYY-MM-DD for daily, YYYY-WW for weekly)',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '202': {
              description: 'Distribution started',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      poolType: { type: 'string' },
                      periodIdentifier: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid request',
            },
            '401': {
              description: 'Unauthorized',
            },
            '500': {
              description: 'Internal server error',
            },
          },
        },
      },
      '/prizes/distributions/{id}': {
        get: {
          summary: 'Get distribution details',
          description: 'Get detailed information about a specific prize distribution',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Distribution ID',
              schema: { type: 'string' },
            },
            {
              name: 'includePayouts',
              in: 'query',
              description: 'Include individual payout details',
              schema: { type: 'boolean', default: false },
            },
          ],
          responses: {
            '200': {
              description: 'Distribution details',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/PrizeDistributionWithPayouts',
                  },
                },
              },
            },
            '404': {
              description: 'Distribution not found',
            },
            '500': {
              description: 'Internal server error',
            },
          },
        },
      },
      '/prizes/distributions/{id}/retry': {
        post: {
          summary: 'Retry a failed distribution',
          description: 'Retry a failed prize distribution (admin only)',
          security: [{ apiKey: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Distribution ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '202': {
              description: 'Retry started',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      distributionId: { type: 'string' },
                      poolType: { type: 'string' },
                      periodIdentifier: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid request or distribution not failed',
            },
            '401': {
              description: 'Unauthorized',
            },
            '404': {
              description: 'Distribution not found',
            },
            '500': {
              description: 'Internal server error',
            },
          },
        },
      },
      '/prizes/pools': {
        get: {
          summary: 'Get current prize pool amounts',
          description: 'Get the current amounts in the daily and weekly prize pools',
          responses: {
            '200': {
              description: 'Current prize pool amounts',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/PrizePoolList',
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error',
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for admin operations',
        },
      },
      schemas: {
        PrizeDistribution: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['daily', 'weekly'] },
            periodIdentifier: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
            totalWinners: { type: 'integer' },
            totalDistributed: { type: 'string' },
            currency: { type: 'string' },
            startedAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
            error: { type: 'string', nullable: true },
          },
        },
        PrizePayout: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            userAddress: { type: 'string' },
            rank: { type: 'integer' },
            score: { type: 'number' },
            prizeAmount: { type: 'string' },
            status: { type: 'string', enum: ['success', 'failed', 'skipped'] },
            transactionHash: { type: 'string', nullable: true },
            error: { type: 'string', nullable: true },
          },
        },
        PrizePool: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['daily', 'weekly'] },
            baseAmount: { type: 'number' },
            bonusAmount: { type: 'number' },
            totalAmount: { type: 'number' },
            currency: { type: 'string' },
            lastUpdated: { type: 'string', format: 'date-time' },
          },
        },
        PrizeDistributionList: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/PrizeDistribution' },
            },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                pageSize: { type: 'integer' },
                total: { type: 'integer' },
              },
            },
          },
        },
        PrizeDistributionWithPayouts: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                distribution: { $ref: '#/components/schemas/PrizeDistribution' },
                payouts: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/PrizePayout' },
                  nullable: true,
                },
              },
            },
          },
        },
        PrizePoolList: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/PrizePool' },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object', nullable: true },
              },
            },
          },
        },
      },
    },
  };

  return NextResponse.json(docs);
}
