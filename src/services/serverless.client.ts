import { TelegramServerlessError } from './telegram.types';

export class ServerlessError extends Error {
  code?: string;
  type?: string;
  parameters?: Record<string, unknown>;

  constructor(message: string, type?: string, parameters?: Record<string, unknown>) {
    super(message);
    this.name = 'ServerlessError';
    this.type = type;
    this.parameters = parameters;
    if (parameters && typeof parameters.code === 'string') {
      this.code = parameters.code;
    }
  }
}

export async function callServerless<T = unknown>(
  endpoint: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const serverless = window.Telegram?.WebApp?.Serverless;
  if (!serverless) {
    throw new ServerlessError(
      'Telegram Serverless API is unavailable. Run inside Telegram Mini App.',
      'NO_SERVERLESS'
    );
  }

  return new Promise<T>((resolve, reject) => {
    serverless.call(endpoint, payload, (err: TelegramServerlessError | null, result?: unknown) => {
      if (err) {
        reject(new ServerlessError(err.message || 'Call failed', err.type, err.parameters));
      } else {
        resolve(result as T);
      }
    });
  });
}
