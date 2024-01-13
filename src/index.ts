import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import type { Client, PrivateValues } from "types/index.js";
import { Client as DiscordClient, GatewayIntentBits } from "discord.js";
import {
  getPrivateValues,
  createCommands,
  createAutoDisconnectEvent,
} from "utils/index.js";
import { Store } from "store.js";
import { Player } from "player.js";
import { SpotifyApi } from "api/spotify-api.js";
import { YoutubeDataApi } from "api/youtube-data-api.js";
import { createCommandHandlerEvent } from "utils/create-command-handler-event.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(path.join(__dirname, ".env")) });

const startClient = async (privateValues: PrivateValues) => {
  const { BOT_TOKEN } = privateValues;

  const client: Client = new DiscordClient({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  }) as Client;

  client.on("ready", async () => {
    console.log("Ready");

    await createCommands(client, privateValues);

    const store = new Store();
    const player = new Player({ store });

    const youtubeDataApi = new YoutubeDataApi(privateValues);
    const spotifyApi = new SpotifyApi(privateValues, youtubeDataApi);

    createAutoDisconnectEvent(client, player, privateValues);

    createCommandHandlerEvent(client, {
      player,
      store,
      spotifyApi,
      youtubeDataApi,
      privateValues,
    });

    setInterval(() => {
      if (store.qLength === 0 && !player.isPlaying) {
        console.log("Re-starting bot");
        process.exit(1);
      }
    }, 60 * 60 * 1000);
  });

  client.login(BOT_TOKEN);
};

const run = async () => {
  console.log("Starting bot...");
  const privateValues = getPrivateValues();
  await startClient(privateValues);
};

run();
