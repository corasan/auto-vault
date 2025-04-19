# Auto Vault

Auto Vault is an app that automatically moves weapons and armor in the Destiny 2 postmaster to the vault (as long as the vault has space) when the postmaster is full.

This is a monorepo containing both the Cloudflare Worker backend API and the React Native mobile app.

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