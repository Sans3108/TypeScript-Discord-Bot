declare global {
  namespace NodeJS {
    // Only add env variables here if they're checked for in app/index.ts
    interface ProcessEnv {
      DISCORD_CLIENT_TOKEN: string;
      DEV_DISCORD_GUILD_ID: string;
      DEV_MODE: string;
    }
  }

  // Custom, global utility types
  // type NonEmptyArray<T> = [T, ...T[]];

  type DeepRequired<T extends object> = Required<{
    [P in keyof T]: T[P] extends object | undefined ? DeepRequired<Required<T[P]>> : T[P];
  }>;
}

export {};
