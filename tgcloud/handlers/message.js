import { api } from 'sdk';

export default async function (message, ctx) {
  if (!message || !message.chat) return;

  const text = (message.text || '').trim();
  const chatId = message.chat.id;

  if (text.startsWith('/start')) {
    await api.sendMessage({
      chat_id: chatId,
      text: '🎲 *Buckshot Roulette Tracker*\n\nWelcome! This companion app tracks live and blank shotgun shells during your game.\n\nOpen the Mini App from the bot menu or launch button to start tracking.',
      parse_mode: 'Markdown',
    });
    return;
  }

  await api.sendMessage({
    chat_id: chatId,
    text: 'Use the Mini App to track shells. Send /start for info.',
  });
}
