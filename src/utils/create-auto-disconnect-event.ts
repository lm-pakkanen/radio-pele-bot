import type { Player } from "player";
import type { Client, PrivateValues } from "types";
import { VoiceConnectionStatus } from "@discordjs/voice";

export const createAutoDisconnectEvent = (
  client: Client,
  player: Player,
  privateValues: PrivateValues
) => {
  const { BOT_CLIENT_ID } = privateValues;

  client.on("voiceStateUpdate", (channelState) => {
    // Some required value is missing
    if (
      !(
        !!player.voiceConnection &&
        !!channelState.channel &&
        channelState.channelId
      )
    ) {
      return;
    }

    // Bot acting on channel
    if (channelState.member?.id === BOT_CLIENT_ID) {
      return;
    }

    const botVoiceChannelId = player.voiceConnection.joinConfig.channelId;
    const isCorrectChannel = botVoiceChannelId === channelState.channelId;

    if (!isCorrectChannel) {
      return;
    }

    const connectionStatus = player.voiceConnection.state.status;

    if (connectionStatus === VoiceConnectionStatus.Destroyed) {
      return;
    }

    const voiceChannelMembers = channelState.channel.members;

    const botUser = voiceChannelMembers.get(BOT_CLIENT_ID);
    const isBotInChannel = !!botUser && botUser.user.bot;

    if (voiceChannelMembers?.size === 1 && isBotInChannel) {
      player.voiceConnection.destroy();
    }
  });
};
