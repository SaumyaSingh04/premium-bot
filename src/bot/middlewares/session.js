import sessionRepository from '../../repositories/sessionRepository.js';
import userService from '../../modules/user/userService.js';

/**
 * Attaches in-memory session to ctx.session.
 * Attaches the Postgres user record to ctx.pgUser (null if not found).
 */
const sessionMiddleware = async (ctx, next) => {
  const userId = ctx.from?.id;

  if (userId) {
    ctx.session = sessionRepository.getSession(userId);
    ctx.pgUser = await userService.findByTelegramId(userId).catch(() => null);
  }

  return next();
};

export default sessionMiddleware;
