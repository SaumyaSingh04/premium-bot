import { safeMarkdownReply } from '../../helpers/formatMessage.js';

const profileCommand = async (ctx) => {
  const user = ctx.pgUser;
  const name = ctx.from?.first_name ?? 'Unknown';

  if (!user) {
    return ctx.reply('⚠️ Profile not found. Please send /start first.');
  }

  const joined = new Date(user.createdAt).toLocaleDateString();
  const balance = user.wallet?.balance ?? 0;

  const text =
    `👤 *Profile*\n\n` +
    `• Name: *${name}*\n` +
    `• ID: \`${user.telegramId.toString()}\`\n` +
    `• Joined: *${joined}*\n` +
    `• Messages sent: *${user.totalMessages}*\n` +
    `• Tokens used: *${user.totalTokens}*\n` +
    `• Coin balance: *${balance}* 🪙`;

  await safeMarkdownReply(ctx, text);
};

export default profileCommand;
