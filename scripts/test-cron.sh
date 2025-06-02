#!/bin/bash

# Set your test environment variables
export CRON_SECRET="test-secret-123"
export UPSTASH_REDIS_REST_URL="http://localhost:8080"  # Update with your local Redis URL if different
export UPSTASH_REDIS_REST_TOKEN="dummy-token"
export TURSO_DATABASE_URL="file:./test.db"
export TURSO_AUTH_TOKEN="dummy-auth-token"

# Start the Next.js development server in the background
echo "Starting development server..."
npm run dev &
DEV_SERVER_PID=$!

# Wait for the server to start
echo "Waiting for the server to start..."
sleep 5

# Test the cron endpoint
echo -e "\nTesting daily prize distribution..."
curl -v \
  -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:3000/api/cron/prize-distribution?periodType=daily"

# Kill the development server
echo -e "\nShutting down the development server..."
kill $DEV_SERVER_PID

echo "Test complete."
