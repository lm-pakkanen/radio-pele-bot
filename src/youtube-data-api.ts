import nodeUrl from "node:url";
import { PrivateValues, SongInfoOnSuccess } from "./types/index.ts";
import { YoutubeDataApiVideoResponse } from "./types/youtube-data-api.ts";

const VIDEO_BASE_URL = "https://www.youtube.com/watch?v=";

export class YoutubeDataApi {
  _apiKey: string;
  _baseUrl: string;

  constructor(privateValues: PrivateValues) {
    this._apiKey = privateValues.YOUTUBE_API_KEY;
    this._baseUrl = "https://www.googleapis.com/youtube/v3";
  }

  async getVideoById(id: undefined | string | string[]): Promise<Video> {
    const part = "contentDetails,snippet";

    if (!this._isValidId(id)) {
      throw new Error("Invalid video ID / URL");
    }

    try {
      const qualifiedUrl = `${this._baseUrl}/videos?part=${part}&key=${this._apiKey}&id=${id}`;

      const response = await fetch(qualifiedUrl);
      const responseJson = await response.json();

      const url = `${VIDEO_BASE_URL}${id}`;

      return new Video(url, responseJson);
    } catch (err) {
      console.error(err);
      throw new Error("Could not get video info");
    }
  }

  async getVideoByUrl(url: string): Promise<Video> {
    const parsedUrl = nodeUrl.parse(url, true);
    const videoId = parsedUrl.query.v;
    return await this.getVideoById(videoId);
  }

  async getVideosBySearch(
    searchValue: string,
    { maxResults }: { maxResults?: number }
  ): Promise<Video[]> {
    maxResults ??= 1;

    const part = "snippet";
    const type = "video";

    try {
      const qualifiedUrl = `${this._baseUrl}/search?part=${part}&key=${this._apiKey}&maxResults=${maxResults}&type=${type}&q=${searchValue}`;

      const response = await fetch(qualifiedUrl);
      const responseJson = await response.json();

      const ids = responseJson.items.map((n: any) => n.id.videoId);

      const videos: Video[] = [];

      for (const id of ids) {
        const video = await this.getVideoById(id);
        videos.push(video);
      }

      return videos;
    } catch (err) {
      console.error(err);
      throw new Error("Could not search videos");
    }
  }

  _isValidId(id: undefined | string | string[]): id is string {
    if (typeof id !== "string") {
      return false;
    }

    return /[A-Za-z0-9_-]+/.test(id);
  }
}

class Video {
  _url: string;
  _artistName: string;
  _songTitle: string;
  _duration: SongInfoOnSuccess["duration"];

  constructor(url: string, videoDataResponse: YoutubeDataApiVideoResponse) {
    const videoData = videoDataResponse.items?.[0];

    if (!videoData) {
      throw new Error("Video data not found");
    }

    this._url = url;

    this._artistName = videoData.snippet.channelTitle;
    this._songTitle = videoData.snippet.title;
    this._duration = this._getDurationInfo(videoData.contentDetails.duration);
  }

  get url(): string {
    return this._url;
  }

  get qualifiedName(): string {
    return [
      this._songTitle,
      this._artistName && !this._songTitle.includes(this._artistName)
        ? `(${this._artistName})`
        : "",
      ` | ${this._duration.durationString}`,
    ]
      .filter((n) => n)
      .join(" ");
  }

  get duration(): SongInfoOnSuccess["duration"] {
    return this._duration;
  }

  _getDurationInfo(secondsAsString: string): {
    durationString: string;
    durationSeconds: number;
  } {
    let inputSeconds;

    try {
      inputSeconds = parseInt(secondsAsString);
    } catch (err) {
      throw new Error("Invalid duration input");
    }

    const minutes = Math.floor(inputSeconds / 60);
    const seconds = inputSeconds % 60;

    return {
      durationString: `${minutes}min ${seconds}s`,
      durationSeconds: inputSeconds,
    };
  }
}
