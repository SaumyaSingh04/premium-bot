import generationService from '../../modules/generation/generationService.js';
import { GENERATION_COSTS } from '../../modules/generation/generationCosts.js';
import { GENERATION_ERRORS } from '../../modules/generation/generationError.js';

const editCommand = async (ctx) => {
  const prompt = ctx.message?.text?.replace(/^\/edit\s*/i, '').trim();
  const photo =
    ctx.message?.reply_to_message?.photo ??
    ctx.message?.photo;

  if (!prompt) {
    return ctx.reply(`✏️ Usage: reply to a photo with /edit <prompt>\n💰 Cost: ${GENERATION_COSTS.IMAGE_EDIT} coins`);
  }

  if (!photo) {
    return ctx.reply('✏️ Please reply to a photo to edit it.');
  }

  const fileId = photo[photo.length - 1].file_id;
  const fileLink = await ctx.telegram.getFileLink(fileId);
  const imageUrl = fileLink.href;

  const loadingMsg = await ctx.reply('✏️ Editing image…');

  try {
    await ctx.sendChatAction('upload_photo');
    const { buffer, coinsSpent } = await generationService.editImage(ctx.from.id, imageUrl, prompt);
    await ctx.replyWithPhoto({ source: buffer }, { caption: `✏️ ${prompt}\n💰 ${coinsSpent} coins spent` });
  } catch (err) {
    const msg =
      err.code === GENERATION_ERRORS.INSUFFICIENT_COINS
        ? `❌ Not enough coins. Need ${GENERATION_COSTS.IMAGE_EDIT} coins.`
        : '❌ Image edit failed. Please try again.';
    await ctx.reply(msg);
  } finally {
    await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
  }
};

export default editCommand;
