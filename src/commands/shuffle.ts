import { EmbedField, SlashCommandBuilder } from "discord.js";
import { createEmbed } from "../utils/index.ts";
import { Command } from "../types/index.ts";

const data: Command["data"] = new SlashCommandBuilder()
  .setName("shuffle")
  .setDescription("Shuffle Q");

const execute: Command["execute"] = async (interaction, { botUser, store }) => {
  await store.shuffle();

  const fields: EmbedField[] = [
    {
      name: "Queue",
      value: `${store._queue.length} song(s) in Q`,
      inline: false,
    },
  ];

  const embed = createEmbed({
    botUser,
    title: "Q shuffled",
    fields,
  });

  await interaction.reply({ embeds: [embed] });
};

const command: Command = {
  data,
  execute,
};

export default command;
