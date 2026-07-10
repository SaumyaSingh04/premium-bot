import walletService from '../../modules/wallet/walletService.js';
import userService from '../../modules/user/userService.js';
import { safeMarkdownReply } from '../../helpers/formatMessage.js';

const balanceCommand = async (ctx) => {
  const user = await userService.findByTelegramId(ctx.from.id);
  if (!user) return ctx.reply('⚠️ Please send /start first.');

  const balance = await walletService.getBalance(user.id);

  await safeMarkdownReply(
    ctx,
    `💰 *Wallet Balance*\n\n• Coins: *${balance}* 🪙`
  );
};

export default balanceCommand;
