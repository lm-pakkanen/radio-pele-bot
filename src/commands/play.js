import { SlashCommandBuilder } from "discord.js";
import { joinVoiceChannel } from "../utils/index.js";

const supportedSources = ["youtube", "spotify"];

const data = new SlashCommandBuilder()
  .setName("play")
  .setDescription(`Plays song from url (${supportedSources.join(", ")})`)
  .addStringOption((option) =>
    option
      .setName("url")
      .setDescription(
        `Song URL (${supportedSources.join(
          ", "
        )}). Leave empty to continue paused Q.`
      )
      .setRequired(false)
  );

const execute = async (interaction, store, player) => {
  try {
    const url = interaction.options.getString("url");

    if (!url && !player._isPaused) {
      throw new Error("URL missing (required when player is not paused");
    }

    if (!url) {
      const connection = joinVoiceChannel(interaction);

      await player.play(connection, store);
      await interaction.reply("Continuing Q");
      return;
    }

    const { success, reason, fullVideoTitle } = await store.add(url);

    if (!success) {
      throw new Error(
        `Failed to load song${reason ? `, reason: ${reason}` : ""}`
      );
    }

    const connection = joinVoiceChannel(interaction);

    await player.play(connection, store);
    await interaction.reply(`Added song to Q: ${fullVideoTitle}`);
  } catch (err) {
    await interaction.reply(err.message);
  }
};

export default {
  data,
  execute,
};
