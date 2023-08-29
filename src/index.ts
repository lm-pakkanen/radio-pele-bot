import {
  ApplicationCommandDataResolvable,
  Collection,
  Client as DiscordClient,
  GatewayIntentBits,
} from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Store } from "./store";
import { Player } from "./player";
import { SpotifyApi } from "./spotify-api";
import { Client, Interaction, PrivateValues } from "./types/index";
import { getPrivateValues } from "./utils/index";
import { YoutubeDataApi } from "./youtube-data-api";

const UPDATE_GLOBAL_COMMANDS = false;
const DELETE_GUILD_COMMANDS = false;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const createCommands = async (client: Client, privateValues: PrivateValues) => {
  client.commands = new Collection();

  try {
    const commandsAsJson: ApplicationCommandDataResolvable[] = [];

    const supportedFileTypes = [".js", ".ts"];

    const commandsFolderPath = path.join(__dirname, "commands");
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
        "./scripts/update-global-commands"
      );

      await updateGlobalCommands(privateValues, commandsAsJson);

      console.log("Global commands updated");
    }

    if (DELETE_GUILD_COMMANDS) {
      console.log("Deleting guild commands...");

      const { updateGuildCommands } = await import(
        "./scripts/update-guild-commands"
      );

      await updateGuildCommands(privateValues, []);

      console.log("Guild commands updated");
    }
  } catch (err) {
    console.error(err);
  }
};

const startClient = async (privateValues: PrivateValues) => {
  const { BOT_TOKEN, BOT_CLIENT_ID } = privateValues;

  const client: Client = new DiscordClient({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  }) as Client;

  client.on("ready", async () => {
    console.log("Ready");

    const botUser = client.users.cache.get(BOT_CLIENT_ID);

    if (!botUser) {
      console.error("Bot user not found");
      process.exit(1);
    }

    await createCommands(client, privateValues);

    const store = new Store();
    const player = new Player({ store, botUser });

    const youtubeDataApi = new YoutubeDataApi(privateValues);
    const spotifyApi = new SpotifyApi(privateValues, youtubeDataApi);

    client.on("interactionCreate", async (_interaction) => {
      const interaction = _interaction as unknown as Interaction;

      if (!interaction.isChatInputCommand()) {
        return;
      }

      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        return;
      }

      try {
        await command.execute(interaction, {
          botUser,
          store,
          player,
          spotifyApi,
          youtubeDataApi,
          privateValues,
        });
      } catch (err) {
        console.error(err);

        const message = `Command could not be executed`;

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: message, ephemeral: true });
        } else {
          await interaction.reply({ content: message, ephemeral: true });
        }
      }
    });
  });

  client.login(BOT_TOKEN);
};

const run = async () => {
  const privateValues = getPrivateValues();
  await startClient(privateValues);
};

run();
