import type { ApplicationCommandDataResolvable } from "discord.js";
import type { Client, PrivateValues } from "types";
import { Collection } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const UPDATE_GLOBAL_COMMANDS = false;
const DELETE_GUILD_COMMANDS = false;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createCommands = async (
  client: Client,
  privateValues: PrivateValues
) => {
  client.commands = new Collection();

  try {
    const commandsAsJson: ApplicationCommandDataResolvable[] = [];

    const supportedFileTypes = [".js", ".ts"];

    const commandsFolderPath = path.join(__dirname, "../commands");
    const commandFilePaths = fs.readdirSync(commandsFolderPath);

    for (const commandFile of commandFilePaths) {
      const filePath = `file://${path.join(commandsFolderPath, commandFile)}`;

      if (!supportedFileTypes.some((n) => filePath.endsWith(n))) {
        console.log("Unsupported command filetype");
        continue;
      }

      const command = (await import(filePath)).default;

      if (!("data" in command && "execute" in command)) {
        console.log(`Not using command file: ${filePath}`);
        continue;
      }

      client.commands.set(command.data.name, command);
      commandsAsJson.push(command.data.toJSON());
    }

    if (UPDATE_GLOBAL_COMMANDS) {
      console.log("Updating global commands...");

      const { updateGlobalCommands } = await import(
        "../scripts/update-global-commands"
      );

      await updateGlobalCommands(privateValues, commandsAsJson);

      console.log("Global commands updated");
    }

    if (DELETE_GUILD_COMMANDS) {
      console.log("Deleting guild commands...");

      const { updateGuildCommands } = await import(
        "../scripts/update-guild-commands"
      );

      await updateGuildCommands(privateValues, []);

      console.log("Guild commands updated");
    }

    if (UPDATE_GLOBAL_COMMANDS || DELETE_GUILD_COMMANDS) {
      process.exit(0);
    }
  } catch (err) {
    console.error(err);
  }
};
