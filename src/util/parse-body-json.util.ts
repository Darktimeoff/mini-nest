import type { IncomingMessage } from "node:http";

type RequestWithCachedBody = IncomingMessage & { body?: unknown }

export async function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const cachedBody = (req as RequestWithCachedBody).body;

    if (cachedBody) {
      return resolve(cachedBody);
    }

    const chunks: Buffer[] = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const rawString = Buffer.concat(chunks).toString('utf-8');

        if (!rawString) {
          return resolve({});
        }

        const parsed = JSON.parse(rawString);
        resolve(parsed);
      } catch (error) {
        reject(new Error('Invalid JSON payload'));
      }
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}
