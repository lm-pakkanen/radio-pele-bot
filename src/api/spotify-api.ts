import Spotify from "spotify-web-api-node";
import { PrivateValues } from "../types/index";
import { YoutubeDataApi } from "./youtube-data-api";

const getTrackIdFromUrl = (url: string): string => {
  return url.split("spotify.com/track/")[1];
};

export class SpotifyApi {
  _spotifyClient: Spotify;
  _youtubeDataApi: YoutubeDataApi;

  constructor(privateValues: PrivateValues, youtubeDataApi: YoutubeDataApi) {
    const { SPOTIFY_CLIENT_SECRET } = privateValues;
    this._youtubeDataApi = youtubeDataApi;

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

    const matchingVideos = await this._youtubeDataApi.getVideosBySearch(
      fullTrackTitle,
      { maxResults: 1 }
    );

    const matchingVideo = matchingVideos[0];

    if (!matchingVideo) {
      throw new Error("No results for youtube search");
    }

    const youtubeUrl = matchingVideo.url;
    return youtubeUrl;
  }
}
