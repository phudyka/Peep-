#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."

# Wait for PostgreSQL to be ready
until pg_isready -h postgres -p 5432 -U peep 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - running migrations"

# Push schema to database and generate client
npx prisma generate
npx prisma db push

echo "Running seed..."
npx ts-node prisma/seed.ts || echo "Seed failed or already seeded"

echo "Starting application..."
npm start
