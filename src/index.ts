import {
  Client as DiscordClient,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
} from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Store } from "./store.ts";
import { Player } from "./player.ts";
import { SpotifyApi } from "./spotify-api.ts";
import { Client, Interaction, PrivateValues } from "types/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getPrivateValues = (): PrivateValues => {
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

const createCommands = async (
  privateValues: PrivateValues,
  commands: Client["commands"]
) => {
  const { BOT_TOKEN, BOT_CLIENT_ID, GUILD_ID_DEV } = privateValues;

  try {
    const commandsAsJson = [];

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

      commands.set(command.data.name, command);
      commandsAsJson.push(command.data.toJSON());
    }

    const rest = new REST().setToken(BOT_TOKEN);

    await rest.put(
      Routes.applicationGuildCommands(BOT_CLIENT_ID, GUILD_ID_DEV),
      {
        body: commandsAsJson,
      }
    );

    await rest.put(Routes.applicationCommands(BOT_CLIENT_ID), {
      body: commandsAsJson,
    });
  } catch (err) {
    console.error(err);
  }
};

const startClient = async (privateValues: PrivateValues) => {
  const { BOT_TOKEN, BOT_CLIENT_ID } = privateValues;

  const client: Client = new DiscordClient({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  }) as Client;

  client.commands = new Collection();
  await createCommands(privateValues, client.commands);

  client.on("ready", () => {
    console.log("Ready");

    const botUser = client.users.cache.get(BOT_CLIENT_ID);

    if (!botUser) {
      console.error("Bot user not found");
      process.exit(1);
    }

    const store = new Store();
    const player = new Player({ store, botUser });
    const spotifyApi = new SpotifyApi(privateValues);

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
