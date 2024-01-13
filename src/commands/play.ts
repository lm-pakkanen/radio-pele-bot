import { EmbedField, SlashCommandBuilder, TextChannel } from "discord.js";
import { joinVoiceChannel, createEmbed } from "utils/index.js";
import { Command } from "types/index.js";

const supportedSources = ["youtube", "spotify"];

const data: Command["data"] = new SlashCommandBuilder()
  .setName("play")
  .setDescription(
    `Plays song from search query or url (${supportedSources.join(", ")})`
  )
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription(
        `Search query or link (${supportedSources.join(
          ", "
        )}). Leave empty to continue paused Q.`
      )
      .setRequired(false)
  );

const execute: Command["execute"] = async (
  interaction,
  { store, player, spotifyApi, youtubeDataApi }
) => {
  const query = interaction.options.getString("query");

  if (!query && !player.isPaused) {
    throw new Error("URL missing (required when player is not paused)");
  }

  const textChannel = interaction.channel;

  if (!(textChannel instanceof TextChannel)) {
    throw new Error("Text channel not found");
  }

  joinVoiceChannel(interaction);

  if (!query) {
    await player.play({ textChannel });

    const fields: EmbedField[] = [];

    const embed = createEmbed({
      title: "RE-STARTING SONG",
      fields,
    });

    await interaction.reply({ embeds: [embed] });

    return;
  }

  const requestedByUserName = interaction.member.user.displayName;

  const songAddResponse = await store.add(
    query,
    requestedByUserName,
    youtubeDataApi,
    spotifyApi
  );

  if (!songAddResponse.success) {
    throw new Error(
      `Failed to load song${
        songAddResponse.reason ? `, reason: ${songAddResponse.reason}` : ""
      }`
    );
  }

  await player.play({ textChannel });

  const fields: EmbedField[] = [
    {
      name: "SONG",
      value: songAddResponse.qualifiedTitle,
      inline: false,
    },
    {
      name: "Q",
      value: `${store.qLength} song(s) in Q after current song`,
      inline: false,
    },
  ];

  const embed = createEmbed({
    title: "SONG ADDED",
    fields,
  });

  await interaction.reply({ embeds: [embed] });
};

const command: Command = {
  data,
  execute,
};

export default command;
