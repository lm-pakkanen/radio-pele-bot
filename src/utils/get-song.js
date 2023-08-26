import ytdl from "ytdl-core";
import { getStreamSource } from "./index.js";

const getDurationMinsString = (secondsAsString) => {
  const inputSeconds = parseInt(secondsAsString);

  const minutes = Math.floor(inputSeconds / 60);
  const seconds = inputSeconds % 60;

  return `${minutes}min ${seconds}s`;
};

export const getSong = async (url, spotifyApi) => {
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

    const videoInfo = await ytdl.getBasicInfo(url);

    const { author, title, lengthSeconds } = videoInfo.videoDetails;

    const durationString = getDurationMinsString(lengthSeconds);

    const authorName = author.name;
    const videoTitle = title;

    const fullVideoTitle = [
      videoTitle,
      authorName && !videoTitle.includes(authorName) ? `(${authorName})` : "",
      ` | ${durationString}`,
    ]
      .filter((n) => n)
      .join(" ");

    return {
      success: true,
      url,
      fullVideoTitle: fullVideoTitle,
    };
  } catch (err) {
    return {
      success: false,
      reason: "Invalid URL",
    };
  }
};
