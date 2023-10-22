import { EmbedBuilder, EmbedField } from "discord.js";

interface CreateEmbedParams {
  title: string;
  fields: EmbedField[];
}

export const embedLayoutField: EmbedField = {
  name: "\u200B",
  value: "\u200B",
  inline: false,
};

export const createEmbed = ({ title, fields }: CreateEmbedParams) => {
  const embed = new EmbedBuilder()
    .setColor("#e32012")
    .setTitle(title)
    .addFields(fields);

  return embed;
};
