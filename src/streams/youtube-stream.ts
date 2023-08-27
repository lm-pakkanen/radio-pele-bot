import {
  createAudioResource,
  AudioResource,
  StreamType,
} from "@discordjs/voice";
import prism from "prism-media";
import ytdl from "ytdl-core";

type FFmpegArgs = prism.FFmpegOptions["args"];

interface YoutubeStreamOptions {
  isOpus: boolean;
}

interface GenerateEncodedAudioResourceOptions {
  isOpus: boolean;
}

interface YTDLOptions extends ytdl.downloadOptions {
  fmt?: string;
  encoderArgs?: FFmpegArgs;
  seek?: number;
}

const { opus: Opus, FFmpeg } = prism;

const YTDL_EVENTS = [
  "info",
  "progress",
  "abort",
  "request",
  "response",
  "error",
  "redirect",
  "retry",
  "reconnect",
];

export class YoutubeStream {
  _audioResource: undefined | Promise<AudioResource>;

  constructor(url: string, { isOpus }: YoutubeStreamOptions) {
    if (!url) {
      throw new Error("No input url provided");
    }

    if (typeof url !== "string") {
      throw new TypeError(
        `input URL must be a string. Received ${typeof url}.`
      );
    }

    if (!ytdl.validateURL(url)) {
      throw new SyntaxError("Incorrect URL format");
    }

    this._audioResource = generateEncodedAudioResource(url, { isOpus });
  }

  async getAudioResource(): Promise<AudioResource> {
    if (!this._audioResource) {
      throw new Error("Audio resource not available");
    }

    return await this._audioResource;
  }
}

const generateEncodedAudioResource = async (
  url: string,
  { isOpus }: GenerateEncodedAudioResourceOptions
) => {
  const options: YTDLOptions = {
    filter: "audioonly",
    highWaterMark: 1 << 25,
  };

  let FFmpegArgs: FFmpegArgs = [
    "-analyzeduration",
    "0",
    "-loglevel",
    "0",
    "-f",
    `${typeof options.fmt === "string" ? options.fmt : "s16le"}`,
    "-ar",
    "48000",
    "-ac",
    "2",
  ];

  if (options.seek !== undefined && !isNaN(options.seek)) {
    FFmpegArgs.unshift("-ss", options.seek.toString());
  }

  if (Array.isArray(options.encoderArgs)) {
    FFmpegArgs = FFmpegArgs.concat(options.encoderArgs);
  }

  const transcoder = new FFmpeg({
    args: FFmpegArgs,
    shell: false,
  });

  const inputStream = ytdl(url, options);

  inputStream.on("error", (err) => {
    console.error(err);
    transcoder.destroy();
  });

  const output = inputStream.pipe(transcoder);

  if (options && !isOpus) {
    for (const event of YTDL_EVENTS) {
      inputStream.on(event, (...args) => {
        output.emit(event, ...args);
      });
    }

    output.on("close", () => transcoder.destroy());
    return createAudioResource(output, { inputType: StreamType.Raw });
  }

  const opus = new Opus.Encoder({
    rate: 48000,
    channels: 2,
    frameSize: 960,
  });

  const outputStream = output.pipe(opus);

  output.on("error", (error) => {
    outputStream.emit("error", error);
  });

  for (const event of YTDL_EVENTS) {
    inputStream.on(event, (...args) => {
      return outputStream.emit(event, ...args);
    });
  }

  return createAudioResource(outputStream, { inputType: StreamType.Opus });
};
