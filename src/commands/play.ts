import { EmbedField, SlashCommandBuilder, TextChannel } from "discord.js";
import { joinVoiceChannel, createEmbed } from "../utils/index.ts";
import { Command } from "../types/index.ts";
import { YoutubeDataApi } from "youtube-data-api.ts";

const supportedSources = ["youtube", "spotify"];

const data: Command["data"] = new SlashCommandBuilder()
  .setName("play")
  .setDescription(`Plays song from url (${supportedSources.join(", ")})`)
  .addStringOption((option) =>
    option
      .setName("url")
      .setDescription(
        `Song URL (${supportedSources.join(
          ", "
        )}). Leave empty to continue paused Q.`
      )
      .setRequired(false)
  );

const execute: Command["execute"] = async (
  interaction,
  { botUser, store, player, spotifyApi, youtubeDataApi }
) => {
  const url = interaction.options.getString("url");

  if (!url && !player._isPaused) {
    throw new Error("URL missing (required when player is not paused)");
  }

  const textChannel = interaction.channel;

  if (!(textChannel instanceof TextChannel)) {
    throw new Error("Text channel not found");
  }

  if (!url) {
    const connection = joinVoiceChannel(interaction);

    await player.play({ textChannel, connection });

    const fields: EmbedField[] = [];

    const embed = createEmbed({
      botUser,
      title: "Re-starting song",
      fields,
    });

    await interaction.reply({ embeds: [embed] });

    return;
  }

  const songAddResponse = await store.add(url, youtubeDataApi, spotifyApi);

  if (!songAddResponse.success) {
    throw new Error(
      `Failed to load song${
        songAddResponse.reason ? `, reason: ${songAddResponse.reason}` : ""
      }`
    );
  }

  const connection = joinVoiceChannel(interaction);

  await player.play({ textChannel, connection });

  const fields: EmbedField[] = [
    {
      name: "Song",
      value: songAddResponse.qualifiedTitle,
      inline: false,
    },
    {
      name: "Queue",
      value: `${store._queue.length || 1} song(s) in Q`,
      inline: false,
    },
  ];

  const embed = createEmbed({
    botUser,
    title: "Song added",
    fields,
  });

  await interaction.reply({ embeds: [embed] });
};

const command: Command = {
  data,
  execute,
};

export default command;
