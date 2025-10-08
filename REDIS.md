# Redis Setup for FD Service

This service uses Redis for caching and session management. The Redis client is initialized in `redisClient.js` and connected during app startup in `app.js`.

## Configuration

- Redis connection details are set in `config.js` and can be overridden with environment variables:
  - `REDIS_URL` (default: redis://localhost:6379)
  - `REDIS_HOST` (default: localhost)
  - `REDIS_PORT` (default: 6379)

## Usage

- Use `redisClient` from `redisClient.js` in your services for caching, session storage, etc.
- Example usage:

```js
const { redisClient } = require('./redisClient');
await redisClient.set('key', 'value');
const value = await redisClient.get('key');
```

## Start Redis (Linux)

If Redis is not running locally, you can start it with:

```
sudo systemctl start redis
```

Or run it manually:

```
redis-server
```

## Troubleshooting

- Ensure Redis is running and accessible at the configured host/port.
- Check logs for connection errors.
