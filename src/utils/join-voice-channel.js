import { joinVoiceChannel as _joinVoiceChannel } from "@discordjs/voice";

export const joinVoiceChannel = (interaction) => {
  const channel = interaction.member.voice.channel;
  const guild = channel?.guild;

  if (!channel) {
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
