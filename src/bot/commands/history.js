import generationService from '../../modules/generation/generationService.js';
import { safeMarkdownReply } from '../../helpers/formatMessage.js';

const TYPE_EMOJI = { IMAGE: '🎨', VIDEO: '🎬', CHAT: '💬' };

const historyCommand = async (ctx) => {
  const records = await generationService.getHistory(ctx.from.id, undefined, 10);

  if (!records.length) return ctx.reply('📜 No generation history yet.');

  const lines = ['📜 *Recent Generations*\n'];
  for (const r of records) {
    const emoji = TYPE_EMOJI[r.type] ?? '•';
    const date = new Date(r.createdAt).toLocaleDateString();
    const prompt = r.prompt ? r.prompt.slice(0, 40) + (r.prompt.length > 40 ? '…' : '') : '—';
    const status = r.status === 'SUCCESS' ? '✅' : r.status === 'FAILED' ? '❌' : '⏳';
    lines.push(`${emoji} ${status} *${r.type}* — ${date}`);
    lines.push(`  └ ${prompt} _(${r.coinsSpent} coins)_`);
  }

  await safeMarkdownReply(ctx, lines.join('\n'));
};

export default historyCommand;
