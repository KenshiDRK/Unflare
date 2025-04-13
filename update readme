## **Unflare**
A Node.js API service that bypasses Cloudflare protection. It uses `puppeteer-real-browser` to automatically solve challenges and returns the necessary cookies and headers for you to make subsequent requests directly to the target website.

### **Key Features**
- Handles **GET** and **POST (form data)** requests
- Supports **proxy configuration** (Host/Port/Auth)
- Includes **logging**
- Takes **automatic screenshots** on errors or Cloudflare blocks
	- The screenshots are saved at `/screenshots` inside the container
    
### **Requirements**
- **Node.js 14+**
- **Linux** requires `Xvfb` package (if not using Docker)
- **Docker image** includes all dependencies

### **API Usage**
Send a `POST` request to `/scrape` with a JSON body:

| Field     | Type   | Required | Description                                |
| --------- | ------ | -------- | ------------------------------------------ |
| `url`     | string | yes      | Target URL                                 |
| `timeout` | number | yes      | Max time in milliseconds                   |
| `method`  | string | no       | HTTP method: `"GET"` (default) or `"POST"` |
| `data`    | object | no       | Form data for POST requests                |
| `proxy`   | object | no       | `{ host, port, username, password }`<br>   |

### **Example Request**
```json
{
  "url": "https://example.com",
  "timeout": 60000,
  "method": "GET"
}
```

### **Successful Response**
```json
{
  "cookies": [ ... ],
  "headers": { ... }
}
```

Returns valid session cookies (e.g. `cf_clearance`) and browser headers.

### **Error Response**
```json
{
  "code": "error",
  "message": "..."
}
```

### **Usage Examples**

#### **Curl (GET)**

```bash
curl -X POST http://localhost:5002/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "timeout": 60000}'
```

#### **JavaScript (Fetch)**

```javascript
const res = await fetch('http://localhost:5002/scrape', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    timeout: 60000
  })
});

const { cookies, headers } = await res.json();
// Use cookies/headers for next requests
```

### **Deployment (Docker)**
- **Build & Run:**
```bash
docker build -t unflare .
docker run -p 5002:5002 unflare
```

- **Or if you prefer Docker Compose:**
``` yaml
services:
  unflare:
    image: ghcr.io/iamyegor/unflare
    ports:
      - "5002:5002"
```
