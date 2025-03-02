# Unflare

A Node.js API service that bypasses Cloudflare protection using [puppeteer-real-browser](https://github.com/ZFC-Digital/puppeteer-real-browser) to automate challenge solving and return usable cookies and headers.

# Key Features

- Supports both GET and POST requests (POST uses form data format)
- Proxy configuration
- Logging

# System Requirements

- Node.js 14+
- If using Linux: Xvfb package for headless browser support
- Docker image already includes all dependencies

# API Endpoints

## POST /scrape

Initiates a scraping session that bypasses Cloudflare protection.

### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | The URL to scrape |
| timeout | number | Yes | Maximum time (ms) to wait for completion |
| method | string | No | HTTP method to use (`GET` or `POST`, default: `GET`) |
| data | object | No | Data to send with POST requests |
| proxy | object | No | Proxy configuration |

#### Proxy Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| host | string | Yes | Proxy host address |
| port | number | Yes | Proxy port |
| username | string | Yes | Authentication username |
| password | string | Yes | Authentication password |

### Example Request

```json
{
  "url": "https://example.com",
  "timeout": 60000,
  "method": "GET",
  "proxy": {
    "host": "proxy.example.com",
    "port": 8080,
    "username": "user",
    "password": "pass"
  }
}
```

### Successful Response

Returns cookies and headers that can be used for future requests to the target site:

```json
{
  "cookies": [
    {
      "name": "cf_clearance",
      "value": "abc123...",
      "domain": ".example.com",
      "path": "/",
      "expires": 1676142392.307484,
      "httpOnly": true,
      "secure": true
    },
    // additional cookies
  ],
  "headers": {
    "user-agent": "Mozilla/5.0...",
    // additional headers
  }
}
```

### Error Response

```json
{
  "code": "error",
  "message": "Error message details"
}
```

# Usage Examples

## Basic Scraping with curl

```bash
# Basic GET request
curl -X POST http://your-api-url/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "timeout": 60000, "method": "GET"}'
```

```bash
# POST request with form data
curl -X POST http://your-api-url/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/login", 
    "timeout": 60000, 
    "method": "POST",
    "data": {
      "username": "testuser",
      "password": "testpass"
    }
  }'
```

```bash
# Using proxy
curl -X POST http://your-api-url/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com", 
    "timeout": 60000,
    "proxy": {
      "host": "proxy.example.com",
      "port": 8080,
      "username": "user",
      "password": "pass"
    }
  }'
```

## Using in JavaScript

```javascript
const response = await fetch('http://your-api-url/scrape', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    timeout: 60000
  })
});

const data = await response.json();
// Use data.cookies and data.headers for future requests
```

# Deployment

## Docker Deployment

### Using Docker CLI

``` bash
docker build -t unflare .

docker run -p 5002:5002 unflare
```

### Using Docker Compose

``` yaml
services:
  unflare:
    image: ghcr.io/iamyegor/unflare
    ports:
      - "5002:5002"
```

``` bash
docker compose up
```

# Screenshots

Screenshots are automatically captured in the following situations:
- When Cloudflare blocks the request
- When an error occurs during the scraping process

Screenshots are saved to:
- Development: `./screenshots/` directory
- Production: `/screenshots/` directory