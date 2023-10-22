import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  createAudioPlayer,
  VoiceConnection,
  AudioPlayer,
} from "@discordjs/voice";
import { TextChannel } from "discord.js";
import { YoutubeStream } from "./streams/index.js";
import { createEmbed } from "./utils/index.js";
import { SongInfo } from "./types/index.js";
import { Store } from "./store.js";

export class Player {
  private _textChannel: undefined | TextChannel;
  private _connection: undefined | VoiceConnection;

  private _player: AudioPlayer;
  private _store: Store;

  private _currentSong: undefined | SongInfo<true>;

  constructor({ store }: { store: Store }) {
    this._store = store;

    this._player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Stop,
      },
    });

    this._player.on(AudioPlayerStatus.AutoPaused, this._onPauseOrStop);
    this._player.on(AudioPlayerStatus.Paused, this._onPauseOrStop);

    this._player.on(AudioPlayerStatus.Idle, async () => {
      this._onPauseOrStop();
      await this.play({ sendUpdateMessage: true });
    });
  }

  public async play({
    textChannel,
    connection,
    sendUpdateMessage,
  }: {
    textChannel?: undefined | TextChannel;
    connection?: undefined | VoiceConnection;
    sendUpdateMessage?: boolean;
  }): Promise<boolean> {
    if (textChannel) {
      this._textChannel = textChannel;
    }

    if (connection) {
      this._connection = connection;
    }

    let hasNext = false;

    switch (this._player.state.status) {
      case AudioPlayerStatus.Idle: {
        const nextSong = await this._startNextSong();
        hasNext = nextSong !== false;

        if (
          this._textChannel &&
          nextSong !== false &&
          sendUpdateMessage === true
        ) {
          const fields = [
            {
              name: "SONG",
              value: nextSong.qualifiedTitle,
              inline: false,
            },
            {
              name: "Q",
              value: `${this._store.qLength} song(s) in Q after current song`,
              inline: false,
            },
          ];

          const embed = createEmbed({
            title: "NOW PLAYING",
            fields,
          });

          this._textChannel.send({ embeds: [embed] });
        }

        break;
      }

      case AudioPlayerStatus.AutoPaused:
      case AudioPlayerStatus.Paused: {
        this._player.unpause();
        hasNext = true;
        break;
      }

      case AudioPlayerStatus.Playing: {
        hasNext = true;
        break;
      }

      default: {
        hasNext = false;
        break;
      }
    }

    return hasNext;
  }

  public async pause(): Promise<boolean> {
    if (this._player.state.status === AudioPlayerStatus.Playing) {
      this._player.pause();
      return true;
    }

    return false;
  }

  public async stop() {
    await this._store.clear();

    if (this.isPlaying) {
      this._player.stop();
    }

    if (this._connection) {
      this._connection.destroy();
    }
  }

  public async skip(): Promise<boolean> {
    if (this.isPlaying) {
      this._player.stop();
      const hasNext = await this.play({});

      return hasNext;
    }

    return false;
  }

  public get isPlaying(): boolean {
    return [AudioPlayerStatus.Playing, AudioPlayerStatus.Buffering].includes(
      this._player.state.status
    );
  }

  public get currentSong(): undefined | SongInfo<true> {
    return this._currentSong;
  }

  public get isPaused(): boolean {
    return [AudioPlayerStatus.Paused, AudioPlayerStatus.AutoPaused].includes(
      this._player.state.status
    );
  }

  public get voiceConnection(): undefined | VoiceConnection {
    return this._connection;
  }

  private async _startNextSong(): Promise<false | SongInfo<true>> {
    const nextSong = await this._store.play();

    if (nextSong?.url) {
      if (this._connection) {
        this._connection.subscribe(this._player);
      }

      const stream = new YoutubeStream(nextSong.url, { isOpus: true });
      const audioResource = await stream.getAudioResource();

      this._player.play(audioResource);
      this._currentSong = nextSong;

      return nextSong;
    } else {
      return false;
    }
  }

  private _onPauseOrStop() {
    this._currentSong = undefined;
  }
}
