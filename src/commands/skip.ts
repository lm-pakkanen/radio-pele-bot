import { EmbedField, SlashCommandBuilder } from "discord.js";
import { createEmbed } from "../utils/index";
import { Command } from "../types/index";

const data: Command["data"] = new SlashCommandBuilder()
  .setName("skip")
  .setDescription("Skip current song in Q");

const execute: Command["execute"] = async (
  interaction,
  { botUser, store, player }
) => {
  await player.skip();

  const fields: EmbedField[] = [
    {
      name: "Queue",
      value: `${
        store.qLength > 0 ? "Q empty." : `${store.qLength} song(s) in Q`
      }`,
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
