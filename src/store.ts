import { SongInfo, SongInfoOnSuccess } from "./types/index.ts";
import { getSong } from "./utils/index.ts";
import { SpotifyApi } from "./spotify-api.ts";

export class Store {
  _queue: SongInfoOnSuccess[];

  constructor() {
    this._queue = [];
  }

  async add(url: string, spotifyApi: SpotifyApi): Promise<SongInfo> {
    let result: SongInfo = {
      success: false,
    };

    try {
      result = await getSong(url, spotifyApi);

      if (result.success) {
        this._queue.push(result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      return result;
    }
  }

  async clear() {
    this._queue = [];
  }

  async shuffle() {
    for (let i = this._queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._queue[i], this._queue[j]] = [this._queue[j], this._queue[i]];
    }
  }

  async play(): Promise<undefined | SongInfoOnSuccess> {
    let nextSong = this._queue.shift();
    return nextSong;
  }
}
