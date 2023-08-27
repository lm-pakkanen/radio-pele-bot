import { SlashCommandBuilder } from "discord.js";
import { createEmbed } from "../utils/index.js";

const data = new SlashCommandBuilder()
  .setName("shuffle")
  .setDescription("Shuffle Q");

const execute = async (interaction, { botUser, store }) => {
  await store.shuffle();

  const fields = [
    {
      name: "Queue",
      value: `${store._queue.length} song(s) in Q`,
    },
  ];

  const embed = createEmbed({
    botUser,
    title: "Q shuffled",
    fields,
  });

  await interaction.reply({ embeds: [embed] });
};

export default {
  data,
  execute,
};
