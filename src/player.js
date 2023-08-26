import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  createAudioPlayer,
} from "@discordjs/voice";
import { YoutubeStream } from "./streams/index.js";
import { delay } from "./utils/index.js";

export class Player {
  _currentSong;
  _player;
  _store;
  _connection;
  _isFirstPlay;

  constructor(store) {
    this._store = store;

    this._player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Stop,
      },
    });

    this._player.on(AudioPlayerStatus.Idle, async () => {
      await this.play();
    });

    this._isFirstPlay = true;
  }

  async play(connection) {
    if (connection) {
      this._connection = connection;
    }

    let hasNext = false;

    switch (this._player.state.status) {
      case AudioPlayerStatus.Idle: {
        hasNext = await this._startNextSong();
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
    this._player.pause();
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
      const hasNext = await this.play();

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

      this._player.play(audioResource);
      return true;
    } else {
      return false;
    }
  }
}
