import { api } from 'sdk';

const MINI_APP_URL = 'https://app8969495812.tgcloud.ai/';

export default async function (message, ctx) {
  if (!message || !message.chat) return;

  const text = (message.text || '').trim();
  const chatId = message.chat.id;

  if (text.startsWith('/start')) {
    // Set the persistent chat menu button to launch the Mini App
    try {
      await api.setChatMenuButton({
        chat_id: chatId,
        menu_button: {
          type: 'web_app',
          text: 'Tracker',
          web_app: { url: MINI_APP_URL },
        },
      });
    } catch {
      // Best-effort menu button setup
    }

    await api.sendMessage({
      chat_id: chatId,
      text: '🎲 *Buckshot Roulette Tracker*\n\nWelcome! This companion app helps you track live and blank shotgun shells remaining in the chamber during your Buckshot Roulette matches.\n\nTap the button below to launch the tracker:',
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '⚡ Launch Ammunition Tracker',
              web_app: { url: MINI_APP_URL },
            },
          ],
        ],
      },
    });
    return;
  }

  await api.sendMessage({
    chat_id: chatId,
    text: 'Tap below to open the tracker.',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '⚡ Open Tracker',
            web_app: { url: MINI_APP_URL },
          },
        ],
      ],
    },
  });
}
