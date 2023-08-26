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
      throw new Error("URL missing");
    }

    const connection = joinVoiceChannel(interaction);

    if (url) {
      const { success } = await store.add(url);

      if (success) {
        player.play(connection, store);

        await interaction.reply("Added to queue");
      } else {
        throw new Error("Failed to load song");
      }
    } else {
      player.play(connection, store);
      await interaction.reply("Continuing Q");
    }
  } catch (err) {
    console.error(err);
    await interaction.reply("Could not add song");
  }
};

export default {
  data,
  execute,
};
