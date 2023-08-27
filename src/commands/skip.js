import { SlashCommandBuilder } from "discord.js";
import { createEmbed } from "../utils/index.js";

const data = new SlashCommandBuilder()
  .setName("skip")
  .setDescription("Skip current song in Q");

const execute = async (interaction, { botUser, store, player }) => {
  await player.skip();

  const qLength = store._queue.length;

  const fields = [
    {
      name: "Queue",
      value: `${qLength > 0 ? "Q empty." : `${qLength} song(s) in Q`}`,
    },
  ];

  const embed = createEmbed({
    botUser,
    title: "Song skipped",
    fields,
  });

  await interaction.reply({ embeds: [embed] });
};

export default {
  data,
  execute,
};
