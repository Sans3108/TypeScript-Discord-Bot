declare global {
  namespace NodeJS {
    // Only add env variables here if they're checked for in app/index.ts
    interface ProcessEnv {
      DISCORD_CLIENT_TOKEN: string;
      DEV_DISCORD_GUILD_ID: string;
      DEV_MODE: string;
    }
  }
}

export {};
