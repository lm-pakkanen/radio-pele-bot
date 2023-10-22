import Spotify from "spotify-web-api-node";
import { PrivateValues } from "types/index.js";
import { YoutubeDataApi } from "./youtube-data-api.js";

const getTrackIdFromUrl = (url: string): string => {
  return url.split("spotify.com/track/")[1];
};

export class SpotifyApi {
  private _spotifyClient: Spotify;
  private _youtubeDataApi: YoutubeDataApi;
  private _accessTokenRefreshTimerSeconds: number = 3600;

  constructor(privateValues: PrivateValues, youtubeDataApi: YoutubeDataApi) {
    const { SPOTIFY_CLIENT_SECRET } = privateValues;
    this._youtubeDataApi = youtubeDataApi;

    this._spotifyClient = new Spotify({
      clientId: "813c3544f8e548a2a1c9dc438ecf2c0d",
      clientSecret: SPOTIFY_CLIENT_SECRET,
    });

    this._refreshAccessToken();

    setInterval(() => {
      this._refreshAccessToken();
    }, (3 / 4) * this._accessTokenRefreshTimerSeconds * 1000);
  }

  public async getYoutubeUrlFromSpotifyLink(url: string): Promise<string> {
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

  private async _refreshAccessToken() {
    console.log("Refreshing spotify access token");

    this._spotifyClient.clientCredentialsGrant().then(
      (data) => {
        const nextToken = data.body.access_token;
        const nextTokenTimer = data.body.expires_in;

        if (this._accessTokenRefreshTimerSeconds !== nextTokenTimer) {
          this._accessTokenRefreshTimerSeconds = nextTokenTimer;
        }

        this._spotifyClient.setAccessToken(nextToken);
        console.log("Spotify access token refreshed");
      },
      (err) => {
        console.error(err);
        console.log("Could not refresh spotify access token");
      }
    );
  }
}
