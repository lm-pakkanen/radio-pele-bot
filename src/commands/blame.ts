import { EmbedField, SlashCommandBuilder, TextChannel } from "discord.js";
import { createEmbed } from "../utils/index";
import { Command } from "../types/index";

const data: Command["data"] = new SlashCommandBuilder()
  .setName("blame")
  .setDescription("Get name of user who requested current song");

const execute: Command["execute"] = async (interaction, { player }) => {
  if (!player.isPlaying || !player.currentSong) {
    return;
  }

  const fields: EmbedField[] = [
    {
      name: "This song was requested by:",
      value: player.currentSong.requestedByUserName,
      inline: false,
    },
  ];

  const embed = createEmbed({
    title: "BLAME!",
    fields,
  });

  await interaction.reply({ embeds: [embed] });
};

const command: Command = {
  data,
  execute,
};

export default command;
