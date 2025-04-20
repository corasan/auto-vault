# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**NOTE: Ignore the ios and android folders**

## auto-vault

Auto Vault is an app that automatically moves weapons and armor in the Destiny 2 postmaster to the vault (as long as the vault has space) when the postmaster is full. This solves the issue of when
the player is on a mission and the mission/activity gives too much loot and the inventory and postmaster gets full.

This repo has a `functions` directory, which calls the Bungie API and implements the API the react-native app will consume.

DO NOT USE MOCK DATA. All data needed is available in Bungie's API.

## Build & Test Commands
- Start development server: `npm start` or `bun start`
- Run on iOS: `npm run ios` or `bun run ios`
- Run on Android: `npm run android` or `bun run android`
- Run on Web: `npm run web` or `bun run web`
- Run all tests: `npm test` or `bun test`
- Run single test: `npm test -- -t "test name"` or `bun test -- -t "test name"`
- Lint code: `npm run lint` or `bun run lint`
- Reset project: `npm run reset-project` or `bun run reset-project`

## Code Style Guidelines
- Use TypeScript with strict mode enabled
- Format with Biome: tabs (2 space width), 90 line width
- Use single quotes for strings, double quotes for JSX attributes
- Semicolons are optional (omit when possible)
- Arrow function parentheses as needed
- Import order should be organized (Biome handles this)
- Use functional components with hooks for React components
- Follow React Native and Expo best practices
- Use descriptive, camelCase names for variables and functions
- Use PascalCase for component names and types
- Type props using interfaces or type aliases (e.g., ComponentProps)
- Prefer for...of
