import type { IncomingMessage } from "node:http";

export function hasRequestBody(req: IncomingMessage): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method || '')) {
    return false;
  }

  if (req.headers['transfer-encoding'] !== undefined) {
    return true;
  }

  const contentLength = req.headers['content-length'];
  if (contentLength !== undefined) {
    const parsedLength = parseInt(contentLength, 10);
    return !isNaN(parsedLength) && parsedLength > 0;
  }

  return false;
}