const YOUTUBE_DOMAIN_REGEXES = [
  /googlevideo\./,
  /gvt1\./,
  /\.google\./,
  /youtu\.be/,
  /youtube\./,
  /youtubeeducation\./,
  /googleapis\./,
  /youtubekids\./,
  /youtube-nocookie\./,
  /yt3\.ggpht\./,
  /yt\.be/,
  /ytimg\./,
  /app\.goo\.gl/,
];

export enum StreamSource {
  NONE = -1,
  SPOTIFY = 0,
  YOUTUBE = 1,
}

export const getStreamSource = (query: string): StreamSource => {
  if (query.includes("spotify.com")) {
    return StreamSource.SPOTIFY;
  }

  if (YOUTUBE_DOMAIN_REGEXES.some((n) => n.test(query))) {
    return StreamSource.YOUTUBE;
  }

  return StreamSource.NONE;
};
