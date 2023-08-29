import ytdl from "ytdl-core";
import { getStreamSource } from "./index";
import { SongInfo } from "../types/index";
import { SpotifyApi } from "../spotify-api";
import { YoutubeDataApi } from "../youtube-data-api";

export const getSong = async (
  url: string,
  youtubeDataApi: YoutubeDataApi,
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

    const songInfo = await youtubeDataApi.getVideoByUrl(url);

    return {
      success: true,
      url: songInfo.url,
      qualifiedTitle: songInfo.qualifiedName,
      duration: songInfo.duration,
    };
  } catch (err) {
    return {
      success: false,
      reason: "Invalid URL",
    };
  }
};
