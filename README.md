# Auto Vault

Auto Vault is an app that automatically moves weapons and armor in the Destiny 2 postmaster to the vault (as long as the vault has space) when the postmaster is full.

This is a monorepo containing both the Cloudflare Worker backend API and the React Native mobile app.

## Bungie API Integration

This app uses the Bungie API to authenticate users and manage Destiny 2 inventory. To run the app, you'll need:

1. A Bungie.net API key and OAuth client ID
2. To configure the app with your credentials

### Getting Bungie API Credentials

1. Go to [Bungie.net Developer Portal](https://www.bungie.net/en/Application)
2. Create a new application with:
   - OAuth Client Type: `Confidential`
   - Redirect URL: `autovault://auth`
   - Origin Header: Leave empty for mobile apps
   - Scope: Select `Read your Destiny 2 information` and `Move or equip Destiny gear` at minimum
3. Save the API Key and OAuth client_id provided

### Configuring the App with Bungie Credentials

1. Create a `.env` file in the `mobile/` directory using the provided `.env.example` as a template:
   ```bash
   cp mobile/.env.example mobile/.env
   ```
   
   Then edit the `.env` file with your own values:
   ```
   EXPO_PUBLIC_BUNGIE_CLIENT_ID=YOUR_CLIENT_ID
   EXPO_PUBLIC_REDIRECT_URI=autovault://auth
   EXPO_PUBLIC_WORKER_URL=https://your-worker-url.workers.dev
   ```
   
2. For the Cloudflare Worker, create a `.dev.vars` file in the `functions/` directory:
   ```bash
   cp functions/.env.example functions/.dev.vars
   ```
   
   Then edit the `.dev.vars` file with your own values:
   ```
   BUNGIE_API_KEY=YOUR_API_KEY
   BUNGIE_CLIENT_ID=YOUR_CLIENT_ID
   BUNGIE_CLIENT_SECRET=YOUR_CLIENT_SECRET  # Only needed for token exchange
   ```
   
3. For production deployment of the Cloudflare Worker, set the environment variables using Wrangler:
   ```bash
   npx wrangler secret put BUNGIE_API_KEY
   npx wrangler secret put BUNGIE_CLIENT_ID
   npx wrangler secret put BUNGIE_CLIENT_SECRET
   ```

## Project Structure

- `functions/` - Cloudflare Worker API for interacting with Bungie API
- `mobile/` - React Native mobile app built with Expo

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or bun
- For mobile development: Expo CLI, iOS Simulator/Android Emulator

### Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm install -w mobile
npm install -w functions
```

### Development

#### Mobile App

```bash
# Start the Expo development server
npm run mobile

# Run on iOS
npm run -w mobile ios

# Run on Android
npm run -w mobile android

# Run on Web
npm run -w mobile web
```

#### API Functions (Cloudflare Worker)

```bash
# Start local development server
npm run -w functions dev

# Build for production
npm run -w functions build

# Deploy to Cloudflare
npm run -w functions deploy
```

### Code Style

This project uses Biome for formatting and linting:

```bash
# Format all code
npm run format

# Lint all code
npm run lint
```

## License

[MIT](LICENSE)