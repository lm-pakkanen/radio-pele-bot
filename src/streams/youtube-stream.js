import { createAudioResource } from "@discordjs/voice";
import prism from "prism-media";
import ytdl from "ytdl-core";

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
  _audioResource;

  constructor(url, isOpus) {
    if (!url) {
      throw new Error("No input url provided");
    }

    if (typeof url !== "string") {
      throw new TypeError(
        `input URL must be a string. Received ${typeof url}.`
      );
    }

    this._audioResource = generateEncodedAudioResource(url, isOpus);
  }

  getAudioResource() {
    return this._audioResource;
  }
}

const generateEncodedAudioResource = (url, isOpus) => {
  const options = {
    filter: "audioonly",
    highWaterMark: 1 << 25,
    opusEncoded: isOpus,
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

  inputStream.on("error", () => transcoder.destroy());

  const output = inputStream.pipe(transcoder);

  if (options && !options.opusEncoded) {
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
