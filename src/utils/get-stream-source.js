export const getStreamSource = (url) => {
  if (url.includes("spotify.com")) {
    return "spotify";
  }

  return "youtube";
};
