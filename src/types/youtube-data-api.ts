export interface YoutubeDataApiVideoResponse {
  kind: string;
  etag: string;
  items: YoutubeVideoData[];
  pageInfo: PageInfo;
}

export interface YoutubeVideoData {
  kind: string;
  etag: string;
  id: string;
  snippet: VideoSnippet;
  contentDetails: VideoContentDetails;
}

interface VideoContentDetails {
  duration: string;
  dimension: string;
  definition: string;
  caption: string;
  licensedContent: boolean;
  projection: string;
}

interface VideoSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default: VideoThumbnail;
    medium: VideoThumbnail;
    high: VideoThumbnail;
    standard: VideoThumbnail;
    maxres: VideoThumbnail;
  };
  channelTitle: string;
  tags: string[];
  categoryId: string;
  liveBroadcastContent: string;
  localized: LocalizedVideoInfo;
  defaultAudioLanguage: string;
}

interface LocalizedVideoInfo {
  title: string;
  description: string;
}

interface VideoThumbnail {
  url: string;
  width: number;
  height: number;
}

interface PageInfo {
  totalResults: number;
  resultsPerPage: number;
}
