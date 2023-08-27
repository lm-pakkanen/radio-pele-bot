import { SlashCommandBuilder } from "discord.js";
import { joinVoiceChannel, createEmbed } from "../utils/index.js";

const supportedSources = ["youtube", "spotify"];

const data = new SlashCommandBuilder()
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

const execute = async (interaction, { botUser, store, player, spotifyApi }) => {
  const url = interaction.options.getString("url");

  if (!url && !player._isPaused) {
    throw new Error("URL missing (required when player is not paused)");
  }

  const textChannel = interaction.channel;

  if (!url) {
    const connection = joinVoiceChannel(interaction);

    await player.play({ textChannel, connection, botUser });

    const embed = createEmbed({
      botUser,
      title: "Re-starting song",
      fields: [],
    });

    await interaction.reply({ embeds: [embed] });

    return;
  }

  const { success, reason, fullVideoTitle } = await store.add(url, spotifyApi);

  if (!success) {
    throw new Error(
      `Failed to load song${reason ? `, reason: ${reason}` : ""}`
    );
  }

  const connection = joinVoiceChannel(interaction);

  await player.play({ textChannel, connection, botUser });

  const fields = [
    {
      name: "Song",
      value: fullVideoTitle,
    },
    {
      name: "Queue",
      value: `${store._queue.length || 1} song(s) in Q`,
    },
  ];

  const embed = createEmbed({
    botUser,
    title: "Song added",
    fields,
  });

  await interaction.reply({ embeds: [embed] });
};

export default {
  data,
  execute,
};
