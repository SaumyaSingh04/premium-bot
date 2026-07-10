import generationService from '../../modules/generation/generationService.js';
import { GENERATION_COSTS } from '../../modules/generation/generationCosts.js';
import { GENERATION_ERRORS } from '../../modules/generation/generationError.js';

const PROGRESS_MESSAGES = ['⏳ In queue…', '🎬 Generating…', '🔄 Still working…', '🎞️ Almost there…'];

const videoCommand = async (ctx) => {
  const prompt = ctx.message?.text?.replace(/^\/video\s*/i, '').trim();

  if (!prompt) {
    return ctx.reply(`🎬 Usage: /video <prompt>\n💰 Cost: ${GENERATION_COSTS.VIDEO} coins`);
  }

  const statusMsg = await ctx.reply('🎬 Starting video generation…');
  let progressIndex = 0;

  const onProgress = async (detail) => {
    const text = `${PROGRESS_MESSAGES[progressIndex % PROGRESS_MESSAGES.length]} ${detail}`;
    progressIndex++;
    await ctx.telegram
      .editMessageText(ctx.chat.id, statusMsg.message_id, undefined, text)
      .catch(() => {});
  };

  try {
    await ctx.sendChatAction('upload_video');
    const { url, coinsSpent } = await generationService.generateVideo(ctx.from.id, prompt, onProgress);

    await ctx.telegram
      .editMessageText(ctx.chat.id, statusMsg.message_id, undefined, '✅ Done! Sending video…')
      .catch(() => {});

    await ctx.replyWithVideo({ url }, { caption: `🎬 ${prompt}\n💰 ${coinsSpent} coins spent` });
    await ctx.deleteMessage(statusMsg.message_id).catch(() => {});
  } catch (err) {
    const msg =
      err.code === GENERATION_ERRORS.INSUFFICIENT_COINS
        ? `❌ Not enough coins. Need ${GENERATION_COSTS.VIDEO} coins.`
        : '❌ Video generation failed. Please try again.';
    await ctx.telegram
      .editMessageText(ctx.chat.id, statusMsg.message_id, undefined, msg)
      .catch(() => ctx.reply(msg));
  }
};

export default videoCommand;
