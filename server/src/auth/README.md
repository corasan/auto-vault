# Bungie Authentication Service

This service handles OAuth authentication with Bungie's API for the Auto Vault application.

## Overview

The authentication service provides a complete OAuth 2.0 flow for authenticating users with their Bungie.net accounts and accessing their Destiny 2 data.

## Features

- OAuth 2.0 authorization code flow
- Automatic token refresh
- Token validation
- Session management
- Character data retrieval
- CORS support for mobile applications

## API Endpoints

### GET /auth/init
Generates the Bungie OAuth authorization URL.

**Query Parameters:**
- `state` (optional): OAuth state parameter for CSRF protection

**Response:**
```json
{
  "authUrl": "https://www.bungie.net/en/OAuth/Authorize?..."
}
```

### GET /auth/callback
Handles the OAuth callback from Bungie (typically used for web flows).

**Query Parameters:**
- `code`: Authorization code from Bungie
- `state` (optional): OAuth state parameter

**Response:**
```json
{
  "success": true,
  "userId": "user_id",
  "displayName": "Guardian Name",
  "accessToken": "access_token",
  "expiresIn": 3600
}
```

### POST /auth/exchange
Exchanges an authorization code for access tokens (for mobile apps).

**Request Body:**
```json
{
  "code": "authorization_code_from_bungie"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "displayName": "Guardian Name",
    "membershipType": 3,
    "membershipId": "membership_id"
  },
  "tokens": {
    "accessToken": "access_token",
    "refreshToken": "refresh_token",
    "expiresIn": 3600,
    "expiresAt": 1234567890
  },
  "characters": [
    {
      "characterId": "character_id",
      "classType": 0,
      "light": 1600,
      "emblemPath": "/path/to/emblem.jpg",
      "dateLastPlayed": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### POST /auth/refresh
Refreshes an expired access token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token",
  "userId": "user_id"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token",
  "expiresIn": 3600,
  "expiresAt": 1234567890
}
```

### GET /auth/validate
Validates an access token.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "valid": true
}
```

### POST /auth/logout
Logs out a user and invalidates their session.

**Request Body:**
```json
{
  "userId": "user_id"
}
```

**Response:**
```json
{
  "success": true
}
```

## Mobile App Integration

### React Native Example

```typescript
// Initialize authentication
const initAuth = async () => {
  const response = await fetch('http://your-server.com/auth/init')
  const { authUrl } = await response.json()
  
  // Open auth URL in browser or WebView
  // After user authorizes, you'll receive a callback with the code
}

// Exchange code for tokens
const exchangeCode = async (code: string) => {
  const response = await fetch('http://your-server.com/auth/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  })
  
  const data = await response.json()
  
  if (data.success) {
    // Store tokens securely
    await storeTokens(data.tokens)
    return data
  }
}

// Refresh expired token
const refreshToken = async (refreshToken: string) => {
  const response = await fetch('http://your-server.com/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })
  
  return response.json()
}
```

## Environment Variables

Required environment variables:

- `BUNGIE_API_KEY`: Your Bungie API key
- `BUNGIE_CLIENT_ID`: OAuth client ID from Bungie
- `BUNGIE_CLIENT_SECRET`: OAuth client secret from Bungie
- `BUNGIE_REDIRECT_URI`: OAuth redirect URI (default: http://localhost:3000/auth/callback)

## Security Notes

- Store refresh tokens securely on the client side
- Use HTTPS in production
- Implement proper CSRF protection with state parameters
- Tokens are automatically refreshed when expired
- Sessions are stored in memory (consider persistent storage for production)

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

- `400`: Bad Request (missing parameters, invalid data)
- `401`: Unauthorized (invalid or expired tokens)
- `405`: Method Not Allowed
- `500`: Internal Server Error

Error responses include a descriptive error message:

```json
{
  "error": "Description of what went wrong"
}
```