import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  createAudioPlayer,
  VoiceConnection,
  AudioPlayer,
} from "@discordjs/voice";
import { TextChannel } from "discord.js";
import { YoutubeStream } from "./streams/index.ts";
import { delay, createEmbed, embedLayoutField } from "./utils/index.ts";
import { SongInfoOnSuccess, User } from "./types/index.ts";
import { Store } from "./store.ts";

export class Player {
  _botUser: User;
  _textChannel: undefined | TextChannel;
  _connection: undefined | VoiceConnection;

  _player: AudioPlayer;
  _store;

  _currentSong: undefined | SongInfoOnSuccess;
  _isFirstPlay: boolean;

  constructor({ store, botUser }: { store: Store; botUser: User }) {
    this._store = store;
    this._botUser = botUser;

    this._player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Stop,
      },
    });

    this._player.on(AudioPlayerStatus.Idle, async () => {
      this._currentSong = undefined;
      await this.play({ sendUpdateMessage: true });
    });

    this._isFirstPlay = true;
  }

  async play({
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
            embedLayoutField,
            {
              name: "Song",
              value: nextSong.qualifiedTitle,
              inline: false,
            },
            {
              name: "Queue",
              value: `${this._store._queue.length} song(s) in Q`,
              inline: false,
            },
          ];

          const embed = createEmbed({
            botUser: this._botUser,
            title: "🎼 Now playing 🎼",
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

  async pause(): Promise<boolean> {
    if (this._player.state.status === AudioPlayerStatus.Playing) {
      this._player.pause();
      return true;
    }

    return false;
  }

  async stop() {
    await this._store.clear();

    if (this._isPlaying) {
      this._player.stop();
    }

    if (this._connection) {
      this._connection.destroy();
    }
  }

  async skip(): Promise<boolean> {
    if (this._isPlaying) {
      this._player.stop();
      const hasNext = await this.play({});

      return hasNext;
    }

    return false;
  }

  get _isPlaying(): boolean {
    return [AudioPlayerStatus.Playing, AudioPlayerStatus.Buffering].includes(
      this._player.state.status
    );
  }

  get _isPaused(): boolean {
    return [AudioPlayerStatus.Paused, AudioPlayerStatus.AutoPaused].includes(
      this._player.state.status
    );
  }

  async _startNextSong(): Promise<false | SongInfoOnSuccess> {
    const nextSong = await this._store.play();

    if (nextSong?.url) {
      if (this._connection) {
        this._connection.subscribe(this._player);
      }

      const stream = new YoutubeStream(nextSong.url, { isOpus: true });
      const audioResource = await stream.getAudioResource();

      if (this._isFirstPlay) {
        this._isFirstPlay = false;
        await delay(1000);
      }

      this._currentSong = nextSong;
      this._player.play(audioResource);

      return nextSong;
    } else {
      return false;
    }
  }
}
