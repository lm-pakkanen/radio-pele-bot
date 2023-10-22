import type { Client, CommandParams, Interaction } from "types/index.js";

export const createCommandHandlerEvent = (
  client: Client,
  commandParams: CommandParams
) => {
  client.on("interactionCreate", async (_interaction) => {
    const interaction = _interaction as unknown as Interaction;

    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      return;
    }

    try {
      await command.execute(interaction, commandParams);
    } catch (err) {
      console.error(err);

      const message = `Command could not be executed`;

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: message, ephemeral: true });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
    }
  });
};
