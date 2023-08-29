import { EmbedBuilder, EmbedField } from "discord.js";
import { User } from "../types/index";

interface CreateEmbedParams {
  botUser: User;
  title: string;
  fields: EmbedField[];
}

export const embedLayoutField: EmbedField = {
  name: "\u200B",
  value: "\u200B",
  inline: false,
};

export const createEmbed = ({ botUser, title, fields }: CreateEmbedParams) => {
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
