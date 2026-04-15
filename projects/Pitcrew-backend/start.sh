#!/bin/bash
# Deploy script for Render
# Runs migrations before starting the app

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting application..."
node dist/server.js
