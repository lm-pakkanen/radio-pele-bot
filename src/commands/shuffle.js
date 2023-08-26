import { SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("shuffle")
  .setDescription("Shuffle Q");

const execute = async (interaction, store, _) => {
  try {
    await store.shuffle();
    await interaction.reply("Q shuffled");
  } catch (err) {
    console.error(err);
    await interaction.reply("Q could not be shuffled");
  }
};

export default {
  data,
  execute,
};
