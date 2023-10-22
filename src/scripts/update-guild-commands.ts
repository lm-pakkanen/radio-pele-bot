import type { PrivateValues } from "types/index.js";
import { ApplicationCommandDataResolvable, REST, Routes } from "discord.js";

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
