import generationService from '../../modules/generation/generationService.js';
import { GenerationError } from '../../modules/generation/generationError.js';
import { GENERATION_COSTS } from '../../modules/generation/generationCosts.js';

const imageCommand = async (ctx) => {
  const telegramId = ctx.from?.id;
  const prompt = ctx.message?.text?.replace(/^\/image\s*/i, '').trim();

  if (!prompt) {
    return ctx.reply(
      `🎨 Please provide a prompt. Usage: /image <description>\n💰 Cost: ${GENERATION_COSTS.IMAGE} coins`
    );
  }

  const loadingMsg = await ctx.reply(`🎨 Generating image… (costs ${GENERATION_COSTS.IMAGE} coins)`);

  try {
    await ctx.sendChatAction('upload_photo');
    const { buffer, coinsSpent } = await generationService.generateImage(telegramId, prompt);
    await ctx.replyWithPhoto({ source: buffer }, { caption: `🎨 ${prompt}\n💰 ${coinsSpent} coins spent` });
  } catch (err) {
    const msg =
      err instanceof GenerationError && err.code === 'INSUFFICIENT_COINS'
        ? `❌ Not enough coins. You need ${GENERATION_COSTS.IMAGE} coins to generate an image.`
        : '❌ Failed to generate image. Please try again or refine your prompt.';
    await ctx.reply(msg);
  } finally {
    await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
  }
};

export default imageCommand;
