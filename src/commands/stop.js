import { SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Stop & clear Q");

const execute = async (interaction, _, player) => {
  try {
    await player.stop();
    await interaction.reply("Q stopped. Bye!");
  } catch (err) {
    console.error(err);
    await interaction.reply("Q could not be stopped.");
  }
};

export default {
  data,
  execute,
};
