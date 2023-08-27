import { PrivateValues } from "../types/index.ts";

export const getPrivateValues = (): PrivateValues => {
  const privateValues: Record<keyof PrivateValues, any> = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    BOT_CLIENT_ID: process.env.BOT_CLIENT_ID,
    GUILD_ID_DEV: process.env.GUILD_ID_DEV,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  };

  if (!ensurePrivateValues(privateValues)) {
    console.error("Private values invalid");
    process.exit(1);
  }

  return privateValues as PrivateValues;
};

const ensurePrivateValues = (
  privateValues: Record<keyof PrivateValues, any>
) => {
  return Object.values(privateValues).every((n) => n !== undefined);
};
