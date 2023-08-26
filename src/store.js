import { getSong } from "./utils/index.js";

export class Store {
  _queue = [];

  async add(url) {
    let result = { success: false };

    try {
      result = await getSong(url);

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

  async play() {
    let nextSong = this._queue.shift();
    return nextSong;
  }
}
