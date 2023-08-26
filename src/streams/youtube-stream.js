import { createAudioResource } from "@discordjs/voice";
import prism from "prism-media";
import ytdl from "ytdl-core";
import { delay } from "../utils/index.js";

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
  _videoInfo;
  _audioResource;

  constructor(url, { videoInfo, infoOnly, isOpus }) {
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

    if (!infoOnly) {
      this._audioResource = generateEncodedAudioResource(url, isOpus);
    }
  }

  async getVideoInfo() {
    return await this._videoInfo;
  }

  async getAudioResource() {
    return await this._audioResource;
  }
}

const generateEncodedAudioResource = async (url, isOpus) => {
  const options = {
    filter: "audioonly",
    highWaterMark: 1 << 25,
  };

  let FFmpegArgs = [
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

  if (!isNaN(options.seek)) {
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
    return createAudioResource(output, { inputType: "raw" });
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

  return createAudioResource(outputStream, { inputType: "opus" });
};
