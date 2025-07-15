#!/bin/bash

# Load environment variables from .env file
set -a
source .env
set +a

# Run the migration script
npx tsx scripts/run-migrations.ts
