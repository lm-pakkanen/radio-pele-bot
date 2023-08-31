import nodeUrl from "node:url";
import { PrivateValues, SongInfo } from "../types/index";
import { YoutubeDataApiVideoResponse } from "../types/youtube-data-api";

export class YoutubeDataApi {
  _apiKey: string;
  _baseUrl: string;
  _videoBaseUrl: string;

  constructor(privateValues: PrivateValues) {
    this._apiKey = privateValues.YOUTUBE_API_KEY;
    this._baseUrl = "https://www.googleapis.com/youtube/v3";
    this._videoBaseUrl = "https://www.youtube.com/watch?v=";
  }

  async getVideoById(id: undefined | string | string[]): Promise<Video> {
    const part = "contentDetails,snippet";

    if (!this._isValidId(id)) {
      throw new Error("Invalid video ID");
    }

    try {
      const qualifiedUrl = `${this._baseUrl}/videos?part=${part}&key=${this._apiKey}&id=${id}`;

      const response = await fetch(qualifiedUrl);
      const responseJson = await response.json();

      const url = `${this._videoBaseUrl}${id}`;

      return new Video(url, responseJson);
    } catch (err) {
      console.error(err);
      throw new Error("Could not get video info");
    }
  }

  async getVideoByUrl(url: string): Promise<Video> {
    const transformedUrl = this._transformUrl(url);

    const parsedUrl = nodeUrl.parse(transformedUrl, true);
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

  _transformUrl(url: string) {
    if (url.includes("youtu.be")) {
      let id: string;

      const idMatch = /youtu\.be\/(.[^\?]+)\??/.exec(url);

      if (idMatch) {
        id = idMatch[1];
      } else {
        id = url.split("youtu.be/")[1];
      }

      if (!id) {
        return url;
      }

      return `${this._videoBaseUrl}${id}`;
    }

    return url;
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
  _duration: SongInfo<true>["duration"];

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

  get duration(): SongInfo<true>["duration"] {
    return this._duration;
  }

  _getDurationInfo(secondsAsString: string): {
    durationString: string;
    durationSeconds: number;
  } {
    const parsedString = secondsAsString.match(/PT(\d+)M(\d+)S/);

    const inputMinutes = parseInt(parsedString?.[1] || "0");
    const inputSeconds = parseInt(parsedString?.[2] || "0");

    const totalInputSeconds = inputMinutes * 60 + inputSeconds;

    const minutes = Math.floor(totalInputSeconds / 60);
    const seconds = totalInputSeconds % 60;

    return {
      durationString: `${minutes}min ${seconds}s`,
      durationSeconds: inputSeconds,
    };
  }
}
