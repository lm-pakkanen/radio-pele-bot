import {
  User as DiscordUser,
  Client as DiscordClient,
  Collection as DiscordCollection,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { Player } from "../player.ts";
import { SpotifyApi } from "../spotify-api.ts";
import { Store } from "../store.ts";

export type User = DiscordUser;

export interface SongInfoOnFailure {
  success: false;
  reason?: string;
}

export interface SongInfoOnSuccess {
  success: true;
  url: string;
  fullTitle: string;
}

export type SongInfo = SongInfoOnFailure | SongInfoOnSuccess;

export interface PrivateValues {
  BOT_TOKEN: string;
  BOT_CLIENT_ID: string;
  GUILD_ID_DEV: string;
  SPOTIFY_CLIENT_SECRET: string;
  YOUTUBE_API_KEY: string;
}

export interface CommandParams {
  botUser: User;
  player: Player;
  store: Store;
  spotifyApi: SpotifyApi;
}

export interface Command {
  data: Partial<SlashCommandBuilder>;
  execute: (interaction: Interaction, params: CommandParams) => Promise<void>;
}

export type CommandsCollection = DiscordCollection<string, Command>;

export type Client = DiscordClient & {
  commands: CommandsCollection;
};

export interface Interaction
  extends Omit<ChatInputCommandInteraction<any>, "client"> {
  client: Client;
}
