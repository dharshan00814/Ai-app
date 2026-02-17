#!/bin/bash

echo ""
echo "================================"
echo "AI Resume Screening System"
echo "================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
echo "Starting server..."
echo ""
echo "========================================"
echo "Open your browser to: http://localhost:3000"
echo "========================================"
echo ""

npm start
