# fd_service

## Setup

1. Copy `.env.example` to `.env` and fill in all required environment variables.
2. Run `npm install` to install dependencies.
3. Start MongoDB and Redis locally or update your `.env` with remote URIs.
4. Run `npm start` to start the service.

## Environment Variables
- `JWT_SECRET` (required)
- `MONGO_URI` (required)
- `REDIS_URL` (optional, default: redis://localhost:6379)
- `SERVICE_PORT` (optional, default: 3500)

## Features
- Secure registration and login with password hashing using Node.js crypto
- JWT-based authentication
- Account lockout after repeated failed login attempts
- Kafka integration for user events
- Redis integration for caching/session
- Fastify with Swagger docs

## Development
- Code is auto-formatted with Prettier before commit
- Linting is set up with ESLint v9+

## Security
- Sensitive config is loaded from environment variables
- Accounts are locked after 5 failed login attempts
- JWT secret must be set in environment

## TODO
- Add tests
- Add rate limiting
- Improve error messages
- Add more validation

## Database Setup

To create the PostgreSQL database and tables, run:

```
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE fd_service;"
./init_db.sh
```

## Add fd table to PostgreSQL
To add the `fd` table for the example API, run:

```
psql -U postgres -h localhost -p 5432 -d fd_service -c "CREATE TABLE IF NOT EXISTS fd (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE');"
```
