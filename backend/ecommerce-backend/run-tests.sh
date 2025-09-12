#!/bin/bash

# run-tests.sh

# Start Docker containers
docker-compose up -d

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready... (no checks for whether it is running)"
sleep 60  # Adjust this value if needed

# Run tests
npm test

# Capture the exit code of the tests
TEST_EXIT_CODE=$?

# Stop Docker containers
docker-compose down

# Exit with the test exit code
exit $TEST_EXIT_CODE