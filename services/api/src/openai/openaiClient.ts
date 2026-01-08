import OpenAI from 'openai';

function mustGetEnv(name: string): string {
  const v = process.env[name];
  const looksLikePlaceholder =
    typeof v === 'string' &&
    (v === 'YOUR_OPENAI_API_KEY' || v.startsWith('YOUR_') || v.toLowerCase().includes('replace'));

  if (!v || looksLikePlaceholder) {
    const err: any = new Error(
      name === 'OPENAI_API_KEY'
        ? 'OPENAI_API_KEY is not set in services/api/.env (required for AI recommendations)'
        : `Missing environment variable: ${name}`
    );
    err.status = 500;
    throw err;
  }
  return v;
}

export function createOpenAiClient() {
  return new OpenAI({
    apiKey: mustGetEnv('OPENAI_API_KEY'),
  });
}
