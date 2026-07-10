import generationService from '../../modules/generation/generationService.js';
import { GENERATION_COSTS } from '../../modules/generation/generationCosts.js';
import { GENERATION_ERRORS } from '../../modules/generation/generationError.js';

const generateCommand = async (ctx) => {
  const prompt = ctx.message?.text?.replace(/^\/generate\s*/i, '').trim();

  if (!prompt) {
    return ctx.reply(`🎨 Usage: /generate <prompt>\n🎁 First image each day is free — then ${GENERATION_COSTS.IMAGE} coins`);
  }

  const loadingMsg = await ctx.reply('🎨 Generating image…');

  try {
    await ctx.sendChatAction('upload_photo');
    const { buffer, coinsSpent, free } = await generationService.generateImage(ctx.from.id, prompt);
    const costLabel = free ? '🎁 Free daily generation' : `💰 ${coinsSpent} coins spent`;
    await ctx.replyWithPhoto({ source: buffer }, { caption: `🎨 ${prompt}\n${costLabel}` });
  } catch (err) {
    const msg =
      err.code === GENERATION_ERRORS.INSUFFICIENT_COINS
        ? `❌ Not enough coins. Need ${GENERATION_COSTS.IMAGE} coins.`
        : '❌ Image generation failed. Please try again.';
    await ctx.reply(msg);
  } finally {
    await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
  }
};

export default generateCommand;
