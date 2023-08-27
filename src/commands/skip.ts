import { EmbedField, SlashCommandBuilder } from "discord.js";
import { createEmbed } from "../utils/index.ts";
import { Command } from "../types/index.ts";

const data: Command["data"] = new SlashCommandBuilder()
  .setName("skip")
  .setDescription("Skip current song in Q");

const execute: Command["execute"] = async (
  interaction,
  { botUser, store, player }
) => {
  await player.skip();

  const qLength = store._queue.length;

  const fields: EmbedField[] = [
    {
      name: "Queue",
      value: `${qLength > 0 ? "Q empty." : `${qLength} song(s) in Q`}`,
      inline: false,
    },
  ];

  const embed = createEmbed({
    botUser,
    title: "Song skipped",
    fields,
  });

  await interaction.reply({ embeds: [embed] });
};

const command: Command = {
  data,
  execute,
};

export default command;
