import ytdl from "ytdl-core";

export const getSong = async (url) => {
  try {
    const videoInfo = await ytdl.getBasicInfo(url);

    const { author, title } = videoInfo.videoDetails;

    const authorName = author.name;
    const videoTitle = title;

    const fullVideoTitle = [
      videoTitle,
      authorName && !videoTitle.includes(authorName) ? `(${authorName})` : "",
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
