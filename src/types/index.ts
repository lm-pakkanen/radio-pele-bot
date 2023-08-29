import {
  User as DiscordUser,
  Client as DiscordClient,
  Collection as DiscordCollection,
  ChatInputCommandInteraction as DiscordChatInputCommandInteraction,
  SlashCommandBuilder as DiscordSlashCommandBuilder,
} from "discord.js";
import { Player } from "../player";
import { SpotifyApi } from "../api/spotify-api";
import { Store } from "../store";
import { YoutubeDataApi } from "../api/youtube-data-api";

interface SongInfoOnFailure {
  success: false;
  reason?: string;
}

interface SongInfoOnSuccess {
  success: true;
  url: string;
  qualifiedTitle: string;
  duration: {
    durationString: string;
    durationSeconds: number;
  };
}

export type User = DiscordUser;

export type SongInfo<TSuccess extends boolean | "either" = "either"> =
  TSuccess extends "either"
    ? SongInfoOnFailure | SongInfoOnSuccess
    : TSuccess extends false
    ? SongInfoOnFailure
    : SongInfoOnSuccess;

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
  youtubeDataApi: YoutubeDataApi;
  privateValues: PrivateValues;
}

export interface Command {
  data: Partial<DiscordSlashCommandBuilder>;
  execute: (interaction: Interaction, params: CommandParams) => Promise<void>;
}

export type CommandsCollection = DiscordCollection<string, Command>;

export type Client = DiscordClient & {
  commands: CommandsCollection;
};

export interface Interaction
  extends Omit<DiscordChatInputCommandInteraction<any>, "client"> {
  client: Client;
}
