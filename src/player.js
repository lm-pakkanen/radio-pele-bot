import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  createAudioPlayer,
} from "@discordjs/voice";
import { YoutubeStream } from "./streams/index.js";
import { delay, createEmbed, embedLayoutField } from "./utils/index.js";

export class Player {
  _textChannel;
  _connection;

  _client;
  _player;
  _store;

  _currentSong;
  _isFirstPlay;

  constructor(store) {
    this._store = store;

    this._player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Stop,
      },
    });

    this._player.on(AudioPlayerStatus.Idle, async () => {
      this._currentSong = null;
      await this.play({ sendUpdateMessage: true });
    });

    this._isFirstPlay = true;
  }

  async play({ textChannel, connection, botUser, sendUpdateMessage }) {
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

        if (hasNext && sendUpdateMessage === true) {
          const fields = [
            embedLayoutField,
            {
              name: "Song",
              value: nextSong.fullVideoTitle,
            },
            {
              name: "Queue",
              value: `${this._store._queue.length} song(s) in Q`,
            },
          ];

          const embed = createEmbed({
            botUser,
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

  async pause() {
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

  async skip() {
    if (this._isPlaying) {
      this._player.stop();
      const hasNext = await this.play({});

      return hasNext;
    }
  }

  get _isPlaying() {
    return [AudioPlayerStatus.Playing, AudioPlayerStatus.Buffering].includes(
      this._player.state.status
    );
  }

  get _isPaused() {
    return [AudioPlayerStatus.Paused, AudioPlayerStatus.AutoPaused].includes(
      this._player.state.status
    );
  }

  async _startNextSong() {
    const nextSong = await this._store.play();

    if (nextSong?.url) {
      if (this._connection) {
        this._connection.subscribe(this._player);
      }

      const stream = new YoutubeStream(nextSong.url, {
        videoInfo: nextSong.videoInfo,
        isOpus: true,
      });

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
