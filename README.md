# Peep - Internal Pool Installation Quoting Tool

## Setup

1. Copy `.env.example` to `.env` in the root and in the backend folder.
2. Fill in your `GEMINI_API_KEY` in the `.env` file.
3. Run `docker-compose up --build` to start the application.

## Access

- Frontend: http://localhost (or http://peep.local if DNS configured)
- Backend API: http://localhost:3001

## Initial Data

The system seeds an initial ADMIN user upon first boot:
- Email: admin@peep.local
- Password: password123
