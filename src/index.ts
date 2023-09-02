import type { Client, PrivateValues } from "./types/index";
import { Client as DiscordClient, GatewayIntentBits } from "discord.js";
import {
  getPrivateValues,
  createCommands,
  createAutoDisconnectEvent,
} from "./utils/index";
import { Store } from "./store";
import { Player } from "./player";
import { SpotifyApi } from "./api/spotify-api";
import { YoutubeDataApi } from "./api/youtube-data-api";
import { createCommandHandlerEvent } from "./utils/create-command-handler-event";

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
  });

  client.login(BOT_TOKEN);
};

const run = async () => {
  const privateValues = getPrivateValues();
  await startClient(privateValues);
};

run();
