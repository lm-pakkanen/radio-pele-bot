import Spotify from "spotify-web-api-node";
import Youtube from "discord-youtube-api";
import { PrivateValues } from "./types/index.ts";

const getTrackIdFromUrl = (url: string): string => {
  return url.split("spotify.com/track/")[1];
};

export class SpotifyApi {
  _spotifyClient: Spotify;
  _youtubeClient: Youtube;

  constructor(privateValues: PrivateValues) {
    const { SPOTIFY_CLIENT_SECRET, YOUTUBE_API_KEY } = privateValues;

    this._spotifyClient = new Spotify({
      clientId: "813c3544f8e548a2a1c9dc438ecf2c0d",
      clientSecret: SPOTIFY_CLIENT_SECRET,
    });

    this._spotifyClient.clientCredentialsGrant().then(
      (data) => {
        this._spotifyClient.setAccessToken(data.body["access_token"]);
      },
      (err) => {
        throw new Error(err);
      }
    );

    this._youtubeClient = new Youtube(YOUTUBE_API_KEY);
  }

  async getYoutubeUrlFromSpotifyLink(url: string): Promise<string> {
    const trackId = getTrackIdFromUrl(url);

    if (!trackId) {
      throw new Error("Track ID not found");
    }

    const track = await this._spotifyClient.getTrack(trackId);

    const artistName = track.body.artists[0].name;
    const trackName = track.body.name;

    const fullTrackTitle = [
      trackName,
      artistName && !trackName.includes(artistName) ? `, ${artistName}` : "",
    ]
      .filter((n) => n)
      .join(" ");

    const matchingVideo = await this._youtubeClient.searchVideos(
      fullTrackTitle,
      10
    );

    const youtubeUrl = matchingVideo.url;
    return youtubeUrl;
  }
}
