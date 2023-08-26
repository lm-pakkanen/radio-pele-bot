import { SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("pause")
  .setDescription("Pause current song (restart with /play)");

const execute = async (interaction, _, player) => {
  try {
    await player.pause();
    await interaction.reply("Q paused. Restart with /play");
  } catch (err) {
    console.error(err);
    await interaction.reply("Q could not be paused");
  }
};

export default {
  data,
  execute,
};
