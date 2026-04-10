import type { IncomingMessage, ServerResponse } from 'node:http';
import vercelHandler from '../apps/api/src/vercel-handler.js';

function restoreOriginalApiPath(req: IncomingMessage) {
  const rawUrl = req.url ?? '/api';
  const parsed = new URL(rawUrl, 'http://vercel.local');
  const originalPath = parsed.searchParams.get('__pathname');
  if (!originalPath) return;

  parsed.searchParams.delete('__pathname');
  const search = parsed.searchParams.toString();
  req.url = `${originalPath}${search ? `?${search}` : ''}`;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  restoreOriginalApiPath(req);
  return vercelHandler(req, res);
}
