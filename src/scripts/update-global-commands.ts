import { ApplicationCommandDataResolvable, REST, Routes } from "discord.js";
import { PrivateValues } from "../types/index";

export const updateGlobalCommands = async (
  privateValues: PrivateValues,
  commandsAsJson: ApplicationCommandDataResolvable[]
) => {
  const { BOT_TOKEN, BOT_CLIENT_ID } = privateValues;

  const rest = new REST().setToken(BOT_TOKEN);

  await rest.put(Routes.applicationCommands(BOT_CLIENT_ID), {
    body: commandsAsJson,
  });
};
