import { SlashCommandBuilder } from "discord.js";
import { createEmbed } from "../utils/create-embed.js";

const data = new SlashCommandBuilder()
  .setName("pause")
  .setDescription("Pause current song (restart with /play)");

const execute = async (interaction, { botUser, player }) => {
  const paused = await player.pause();

  const embed = createEmbed({
    botUser,
    title: paused ? "Song paused" : "Nothing to pause!",
    fields: [],
  });

  await interaction.reply({ embeds: [embed] });
};

export default {
  data,
  execute,
};
