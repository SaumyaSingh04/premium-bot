import userService from '../../modules/user/userService.js';
import sessionRepository from '../../repositories/sessionRepository.js';
import { safeMarkdownReply } from '../../helpers/formatMessage.js';
import { BOT_MESSAGES } from '../../constants/index.js';

const startCommand = async (ctx) => {
  const { from } = ctx;
  const name = from?.first_name ?? 'there';

  // Register in Postgres (upsert + wallet creation) — non-blocking on failure
  await userService.registerFromTelegram(from).catch(() => {});

  // Keep in-memory session alive
  sessionRepository.getSession(from.id);

  await safeMarkdownReply(ctx, BOT_MESSAGES.WELCOME(name), 'MarkdownV2');
};

export default startCommand;
