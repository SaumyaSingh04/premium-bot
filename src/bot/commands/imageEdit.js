import generationService from '../../modules/generation/generationService.js';
import { GenerationError } from '../../modules/generation/generationError.js';
import { GENERATION_COSTS } from '../../modules/generation/generationCosts.js';

const imageEditCommand = async (ctx) => {
  const telegramId = ctx.from?.id;
  const prompt = ctx.message?.text?.replace(/^\/imageedit\s*/i, '').trim();

  // Source image: replied-to photo or photo sent with caption command
  const photo =
    ctx.message?.reply_to_message?.photo ??
    ctx.message?.photo;

  if (!prompt) {
    return ctx.reply(
      `✏️ Usage: reply to a photo with /imageedit <description>\n💰 Cost: ${GENERATION_COSTS.IMAGE_EDIT} coins`
    );
  }

  if (!photo) {
    return ctx.reply('✏️ Please reply to a photo to edit it. Usage: /imageedit <description>');
  }

  // Pick highest-resolution file
  const fileId = photo[photo.length - 1].file_id;
  const fileLink = await ctx.telegram.getFileLink(fileId);
  const imageUrl = fileLink.href;

  const loadingMsg = await ctx.reply(`✏️ Editing image… (costs ${GENERATION_COSTS.IMAGE_EDIT} coins)`);

  try {
    await ctx.sendChatAction('upload_photo');
    const { buffer, coinsSpent } = await generationService.editImage(telegramId, imageUrl, prompt);
    await ctx.replyWithPhoto({ source: buffer }, { caption: `✏️ ${prompt}\n💰 ${coinsSpent} coins spent` });
  } catch (err) {
    const msg =
      err instanceof GenerationError && err.code === 'INSUFFICIENT_COINS'
        ? `❌ Not enough coins. You need ${GENERATION_COSTS.IMAGE_EDIT} coins to edit an image.`
        : '❌ Failed to edit image. Please try again or refine your prompt.';
    await ctx.reply(msg);
  } finally {
    await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
  }
};

export default imageEditCommand;
