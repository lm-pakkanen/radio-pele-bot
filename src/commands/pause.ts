import { EmbedField, SlashCommandBuilder } from "discord.js";
import { createEmbed } from "../utils/create-embed.ts";
import { Command } from "../types/index.ts";

const data: Command["data"] = new SlashCommandBuilder()
  .setName("pause")
  .setDescription("Pause current song (restart with /play)");

const execute: Command["execute"] = async (
  interaction,
  { botUser, player }
) => {
  const paused = await player.pause();

  const fields: EmbedField[] = [];

  const embed = createEmbed({
    botUser,
    title: paused ? "Song paused" : "Nothing to pause!",
    fields,
  });

  await interaction.reply({ embeds: [embed] });
};

const command: Command = {
  data,
  execute,
};

export default command;
