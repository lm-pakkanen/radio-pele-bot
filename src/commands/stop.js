import { SlashCommandBuilder } from "discord.js";
import { createEmbed } from "../utils/index.js";

const data = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Stop & clear Q");

const execute = async (interaction, { botUser, player }) => {
  await player.stop();

  const fields = [];

  const embed = createEmbed({
    botUser,
    title: "Q stopped. Bye!",
    fields,
  });

  await interaction.reply({ embeds: [embed] });
};

export default {
  data,
  execute,
};
