import ytdl from "ytdl-core";
import { getStreamSource } from "./index";
import { SongInfo } from "../types/index";
import { SpotifyApi } from "../api/spotify-api";
import { YoutubeDataApi } from "../api/youtube-data-api";
import { StreamSource } from "./get-stream-source";

export const getSong = async (
  query: string,
  youtubeDataApi: YoutubeDataApi,
  spotifyApi: SpotifyApi
): Promise<SongInfo> => {
  try {
    const source = getStreamSource(query);

    let url;

    if (source === StreamSource.NONE) {
      const matchingVideos = await youtubeDataApi.getVideosBySearch(query, {
        maxResults: 1,
      });

      const matchingVideo = matchingVideos[0];

      if (!matchingVideo) {
        throw new Error("No results");
      }

      url = matchingVideo.url;
    } else if (source === StreamSource.SPOTIFY) {
      url = await spotifyApi.getYoutubeUrlFromSpotifyLink(query);
    } else if (source === StreamSource.YOUTUBE) {
      if (!ytdl.validateURL(query)) {
        throw new SyntaxError("Not found");
      }

      url = query;
    } else {
      throw new Error("Unknown stream source");
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
