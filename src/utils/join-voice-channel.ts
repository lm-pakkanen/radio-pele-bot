import {
  joinVoiceChannel as _joinVoiceChannel,
  VoiceConnection,
} from "@discordjs/voice";
import { GuildMember } from "discord.js";
import { Interaction } from "../types/index.ts";

export const joinVoiceChannel = (interaction: Interaction): VoiceConnection => {
  const member = interaction.member;

  if (!(member instanceof GuildMember)) {
    throw new Error("Invalid member");
  }

  const channel = member.voice.channel;
  const guild = channel?.guild;

  if (!(channel && guild)) {
    throw new Error("Not in a channel");
  }

  return _joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false,
  });
};
