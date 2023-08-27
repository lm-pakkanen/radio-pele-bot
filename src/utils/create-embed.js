import { EmbedBuilder } from "discord.js";

export const embedLayoutField = {
  name: "\u200B",
  value: "\u200B",
};

export const createEmbed = ({ botUser, title, fields }) => {
  const embed = new EmbedBuilder()
    .setColor("#e32012")
    .setTitle(title)
    .setAuthor({
      name: botUser.username,
      iconURL: botUser.displayAvatarURL(),
    })
    .addFields(fields);

  return embed;
};
