export const getStreamSource = (url: string): "spotify" | "youtube" => {
  if (url.includes("spotify.com")) {
    return "spotify";
  }

  return "youtube";
};
