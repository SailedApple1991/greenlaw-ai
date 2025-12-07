#!/bin/bash
# Quick start script for FastAPI backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp env.example .env
    echo "Please edit .env file with your RAGFlow configuration!"
    exit 1
fi

# Start server
echo "Starting FastAPI server on http://localhost:8000"
uvicorn main:app --reload --port 8000








