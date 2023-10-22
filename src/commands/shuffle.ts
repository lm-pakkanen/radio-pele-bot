import { EmbedField, SlashCommandBuilder } from "discord.js";
import { createEmbed } from "utils/index.js";
import { Command } from "types/index.js";

const data: Command["data"] = new SlashCommandBuilder()
  .setName("shuffle")
  .setDescription("Shuffle Q");

const execute: Command["execute"] = async (interaction, { store }) => {
  await store.shuffle();

  const fields: EmbedField[] = [
    {
      name: "Q",
      value: `${store.qLength} song(s) in Q after current song`,
      inline: false,
    },
  ];

  const embed = createEmbed({
    title: "Q SHUFFLED",
    fields,
  });

  await interaction.reply({ embeds: [embed] });
};

const command: Command = {
  data,
  execute,
};

export default command;
