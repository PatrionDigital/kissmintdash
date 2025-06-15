import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Prize distribution API',
    endpoints: [
      { 
        path: '/api/prizes/distributions',
        description: 'List and manage prize distributions',
        methods: ['GET', 'POST']
      },
      {
        path: '/api/prizes/pools',
        description: 'Get current prize pool amounts',
        methods: ['GET']
      }
    ]
  });
}
