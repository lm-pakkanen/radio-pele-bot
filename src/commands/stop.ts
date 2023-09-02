import { EmbedField, SlashCommandBuilder } from "discord.js";
import { createEmbed } from "../utils/index";
import { Command } from "../types/index";

const data: Command["data"] = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Stop & clear Q");

const execute: Command["execute"] = async (interaction, { player }) => {
  await player.stop();

  const fields: EmbedField[] = [];

  const embed = createEmbed({
    title: "HASTA LA VISTA!",
    fields,
  });

  await interaction.reply({ embeds: [embed] });
};

const command: Command = {
  data,
  execute,
};

export default command;
