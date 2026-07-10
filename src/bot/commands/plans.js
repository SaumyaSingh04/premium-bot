import coinPlanService from '../../modules/coinPlan/coinPlanService.js';
import { safeMarkdownReply } from '../../helpers/formatMessage.js';

const plansCommand = async (ctx) => {
  const plans = await coinPlanService.getPlans();

  if (!plans.length) return ctx.reply('No coin plans available at the moment.');

  const lines = ['🪙 *Coin Plans*\n'];
  for (const p of plans) {
    lines.push(`*${p.name}*`);
    lines.push(`• Coins: ${p.coins}`);
    lines.push(`• Price: $${p.priceUsd.toFixed(2)}\n`);
  }

  await safeMarkdownReply(ctx, lines.join('\n'));
};

export default plansCommand;
