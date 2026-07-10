import userService from '../../modules/user/userService.js';
import walletService from '../../modules/wallet/walletService.js';
import sessionRepository from '../../repositories/sessionRepository.js';
import pgUserRepository from '../../repositories/pg/pgUserRepository.js';
import config from '../../config/index.js';

const adminCommand = async (ctx) => {
  const args = ctx.message.text.split(/\s+/).slice(1);
  const sub = args[0];

  if (!sub || sub === 'help') {
    return ctx.reply(
      '🔧 *Admin Commands*\n\n' +
      '/admin stats — global usage stats\n' +
      '/admin broadcast <msg> — send message to all active users\n' +
      '/admin user <id> — lookup user info\n' +
      '/admin health — system health',
      { parse_mode: 'Markdown' }
    );
  }

  if (sub === 'stats') {
    const stats = await userService.globalStats();
    const totalMessages = stats._sum?.totalMessages ?? 0;
    const totalTokens = stats._sum?.totalTokens ?? 0;
    const totalUsers = await userService.count();
    return ctx.reply(
      `📊 *Global Stats*\n\n` +
      `• Total users: ${totalUsers}\n` +
      `• Active sessions: ${sessionRepository.totalUsers()}\n` +
      `• Session messages: ${sessionRepository.globalMessageCount()}\n` +
      `• Session tokens: ${sessionRepository.globalTokenCount()}\n` +
      `• DB messages: ${totalMessages}\n` +
      `• DB tokens: ${totalTokens}\n` +
      `• Uptime: ${Math.floor(process.uptime())}s\n` +
      `• Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      { parse_mode: 'Markdown' }
    );
  }

  if (sub === 'health') {
    const mem = process.memoryUsage();
    return ctx.reply(
      `🏥 *Health*\n\n` +
      `• Uptime: ${Math.floor(process.uptime())}s\n` +
      `• RSS: ${Math.round(mem.rss / 1024 / 1024)}MB\n` +
      `• Heap: ${Math.round(mem.heapUsed / 1024 / 1024)}/${Math.round(mem.heapTotal / 1024 / 1024)}MB\n` +
      `• Env: ${config.env}\n` +
      `• Version: ${config.bot.version}`,
      { parse_mode: 'Markdown' }
    );
  }

  if (sub === 'user') {
    const targetId = parseInt(args[1], 10);
    if (!targetId) return ctx.reply('Usage: /admin user <telegram_id>');
    const user = await userService.findByTelegramId(targetId);
    if (!user) return ctx.reply('User not found.');
    const balance = user.wallet?.balance ?? 0;
    return ctx.reply(
      `👤 *User ${targetId}*\n\n` +
      `• Name: ${user.firstName ?? ''} ${user.lastName ?? ''}\n` +
      `• Username: @${user.username ?? 'none'}\n` +
      `• Messages: ${user.totalMessages}\n` +
      `• Tokens: ${user.totalTokens}\n` +
      `• Coin balance: ${balance} 🪙\n` +
      `• Joined: ${new Date(user.createdAt).toLocaleDateString()}`,
      { parse_mode: 'Markdown' }
    );
  }

  if (sub === 'broadcast') {
    const message = args.slice(1).join(' ');
    if (!message) return ctx.reply('Usage: /admin broadcast <message>');
    const users = await pgUserRepository.findAllTelegramIds();
    let sent = 0, failed = 0;
    for (const telegramId of users) {
      try {
        await ctx.telegram.sendMessage(telegramId.toString(), `📢 ${message}`);
        sent++;
      } catch {
        failed++;
      }
    }
    return ctx.reply(`📢 Broadcast done: ${sent} sent, ${failed} failed`);
  }

  return ctx.reply('Unknown sub-command. Use /admin help');
};

export default adminCommand;
