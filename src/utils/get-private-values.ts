import { PrivateValues } from "types/index.js";

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
): boolean => {
  const requiredValueKeys: (keyof PrivateValues)[] = [
    "BOT_TOKEN",
    "BOT_CLIENT_ID",
    "SPOTIFY_CLIENT_SECRET",
    "YOUTUBE_API_KEY",
  ];

  for (const [key, value] of Object.entries(privateValues)) {
    if (requiredValueKeys.includes(key as keyof PrivateValues) && !value) {
      return false;
    }
  }

  return true;
};
