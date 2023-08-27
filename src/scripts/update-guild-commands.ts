import { ApplicationCommandDataResolvable, REST, Routes } from "discord.js";
import { PrivateValues } from "../types/index.ts";

export const updateGuildCommands = async (
  privateValues: PrivateValues,
  commandsAsJson: ApplicationCommandDataResolvable[]
) => {
  const { BOT_TOKEN, BOT_CLIENT_ID, GUILD_ID_DEV } = privateValues;

  const rest = new REST().setToken(BOT_TOKEN);

  await rest.put(Routes.applicationGuildCommands(BOT_CLIENT_ID, GUILD_ID_DEV), {
    body: commandsAsJson,
  });
};
