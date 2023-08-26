import { SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("skip")
  .setDescription("Skip current song in Q");

const execute = async (interaction, _, player) => {
  try {
    const hasNext = await player.skip();
    await interaction.reply(`Song skipped${!hasNext ? ", Q empty" : ""}`);
  } catch (err) {
    console.error(err);
    await interaction.reply("Song could not be skipped");
  }
};

export default {
  data,
  execute,
};
