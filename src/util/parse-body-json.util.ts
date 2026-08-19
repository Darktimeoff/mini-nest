import type { IncomingMessage } from "node:http";

export async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((req as any).body) {
      return resolve((req as any).body);
    }

    const chunks: Buffer[] = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const rawString = Buffer.concat(chunks).toString('utf-8');
        
        // Если тело пустое, возвращаем пустой объект
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