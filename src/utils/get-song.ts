import ytdl from "ytdl-core";
import { getStreamSource } from "./index.ts";
import { SongInfo } from "../types/index.ts";
import { SpotifyApi } from "../spotify-api.ts";

const getDurationInfo = (
  secondsAsString: string
): {
  durationString: string;
  durationSeconds: number;
} => {
  const inputSeconds = parseInt(secondsAsString);

  const minutes = Math.floor(inputSeconds / 60);
  const seconds = inputSeconds % 60;

  return {
    durationString: `${minutes}min ${seconds}s`,
    durationSeconds: inputSeconds,
  };
};

const getSongInfo = async (
  url: string
): Promise<Omit<SongInfo<true>, "success">> => {
  const videoInfo = await ytdl.getBasicInfo(url);

  const { author, title, lengthSeconds } = videoInfo.videoDetails;

  const { durationString, durationSeconds } = getDurationInfo(lengthSeconds);

  const authorName = author.name;
  const videoTitle = title;

  const fullTitle = [
    videoTitle,
    authorName && !videoTitle.includes(authorName) ? `(${authorName})` : "",
    ` | ${durationString}`,
  ]
    .filter((n) => n)
    .join(" ");

  return {
    url,
    fullTitle,
    durationString,
    durationSeconds,
  };
};

export const getSong = async (
  url: string,
  spotifyApi: SpotifyApi
): Promise<SongInfo> => {
  try {
    const source = getStreamSource(url);

    if (!source) {
      throw new Error("Unknown source");
    }

    if (source === "spotify") {
      url = await spotifyApi.getYoutubeUrlFromSpotifyLink(url);
    }

    if (!ytdl.validateURL(url)) {
      throw new SyntaxError("Not found");
    }

    const songInfo = await getSongInfo(url);

    return {
      success: true,
      ...songInfo,
    };
  } catch (err) {
    return {
      success: false,
      reason: "Invalid URL",
    };
  }
};
