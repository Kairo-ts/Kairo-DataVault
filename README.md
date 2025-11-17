# Kairo-DataVault

This behavior pack serves as the persistent data vault for the Kairo. It is a dedicated storage module, designed to be immutable and stable across all future versions of Minecraft. Other addons interact with it exclusively via script events to store and retrieve shared data.

## Supported Minecraft Script API

Kairo is built using the stable Script API:

- `@minecraft/server` - v2.1.0
- `@minecraft/server-ui` - v2.0.0

## Requirements

- Node.js (for development and TypeScript build)

## Setup && Build

1. Install dependencies:
    ```bash
    npm install
    ```
2. Deploy
    ```bash
    npm run build
    ```
3. Auto-deploy on file change:
    ```bash
    npm run dev
    ```
