import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  createAudioPlayer,
  VoiceConnection,
  AudioPlayer,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState,
} from "@discordjs/voice";
import { TextChannel } from "discord.js";
import { YoutubeStream } from "./streams/index.js";
import { createEmbed } from "./utils/index.js";
import { PrivateValues, SongInfo } from "./types/index.js";
import { Store } from "./store.js";

export class Player {
  private _textChannel: undefined | TextChannel;
  private _privateValues: PrivateValues;
  private _store: Store;
  private _player: AudioPlayer;

  private _currentSong: undefined | SongInfo<true>;

  constructor({
    store,
    privateValues,
  }: {
    store: Store;
    privateValues: PrivateValues;
  }) {
    this._privateValues = privateValues;
    this._store = store;

    this._player = createAudioPlayer({
      debug: true,
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Stop,
        maxMissedFrames: Infinity,
      },
    });

    this._player.on(AudioPlayerStatus.AutoPaused, this._onPauseOrStop);
    this._player.on(AudioPlayerStatus.Paused, this._onPauseOrStop);

    this._player.on(AudioPlayerStatus.Idle, async () => {
      this._onPauseOrStop();
      await this.play({
        textChannel: this._textChannel,
        sendUpdateMessage: true,
      });
    });

    this._player.on("error", async () => {
      this._onPauseOrStop();
      await this.play({
        textChannel: this._textChannel,
        sendUpdateMessage: true,
      });
    });

    const voiceConnection = this.voiceConnection;

    if (voiceConnection) {
      voiceConnection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(
              voiceConnection,
              VoiceConnectionStatus.Signalling,
              5_000
            ),
            entersState(
              voiceConnection,
              VoiceConnectionStatus.Connecting,
              5_000
            ),
          ]);
        } catch (error) {
          this.voiceConnection?.destroy();
        }
      });
    }
  }

  public async play({
    textChannel,
    sendUpdateMessage,
  }: {
    textChannel: undefined | TextChannel;

    sendUpdateMessage?: boolean;
  }): Promise<boolean> {
    if (!textChannel) {
      return false;
    }

    this._textChannel = textChannel;

    let hasNext = false;

    switch (this._player.state.status) {
      case AudioPlayerStatus.Idle: {
        const nextSong = await this._startNextSong();
        hasNext = nextSong !== false;

        if (nextSong && sendUpdateMessage === true) {
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

          textChannel.send({ embeds: [embed] });
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

    if (this.voiceConnection) {
      this.voiceConnection.destroy();
    }
  }

  public async skip(): Promise<boolean> {
    if (this.isPlaying) {
      this._player.stop();
      const hasNext = await this.play({ textChannel: this._textChannel });

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
    return getVoiceConnection(this._privateValues.GUILD_ID_DEV);
  }

  private async _startNextSong(): Promise<false | SongInfo<true>> {
    if (!this.voiceConnection || this._store.qLength === 0) {
      return false;
    }

    const nextSong = await this._store.play();

    if (nextSong?.url) {
      const stream = new YoutubeStream(nextSong.url, { isOpus: true });
      const audioResource = await stream.getAudioResource();

      this._player.play(audioResource);
      this._currentSong = nextSong;

      this.voiceConnection.subscribe(this._player);

      return nextSong;
    } else {
      return false;
    }
  }

  private _onPauseOrStop() {
    this._currentSong = undefined;
  }
}
