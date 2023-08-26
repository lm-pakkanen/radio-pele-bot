import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
} from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Store } from "./store.js";
import { Player } from "./player.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getPrivateValues = () => {
  return {
    BOT_TOKEN: process.env.BOT_TOKEN,
    BOT_CLIENT_ID: process.env.BOT_CLIENT_ID,
    GUILD_ID_DEV: process.env.GUILD_ID_DEV,
  };
};

const ensurePrivateValues = (privateValues) => {
  return Object.values(privateValues).every((n) => n);
};

const createCommands = async (privateValues, commands) => {
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
      { body: commandsAsJson }
    );
  } catch (err) {
    console.error(err);
  }
};

const startClient = async (privateValues) => {
  const { BOT_TOKEN } = privateValues;

  const store = new Store();
  const player = new Player(store);

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });

  client.commands = new Collection();
  await createCommands(privateValues, client.commands);

  client.on("ready", () => {
    console.log("Ready");
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      return;
    }

    try {
      await command.execute(interaction, store, player);
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

  client.login(BOT_TOKEN);
};

const run = async () => {
  const privateValues = getPrivateValues();

  if (!ensurePrivateValues(privateValues)) {
    process.exit(1);
  }

  await startClient(privateValues);
};

run();
