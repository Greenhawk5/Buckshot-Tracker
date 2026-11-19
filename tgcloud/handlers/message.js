import { api } from 'sdk';

export default async function (message, ctx) {
  if (!message || !message.chat) return;

  const text = (message.text || '').trim();
  const chatId = message.chat.id;

  let miniAppUrl = 'https://app9258143432.tgcloud.ai/';
  try {
    const me = await api.getMe();
    if (me?.id) {
      miniAppUrl = `https://app${me.id}.tgcloud.ai/`;
    }
  } catch {
    // fallback to current app URL
  }

  if (text.startsWith('/start')) {
    // Set the persistent chat menu button to launch the Mini App
    try {
      await api.setChatMenuButton({
        chat_id: chatId,
        menu_button: {
          type: 'web_app',
          text: 'Tracker',
          web_app: { url: miniAppUrl },
        },
      });
    } catch {
      // Best-effort menu button setup
    }

    await api.sendMessage({
      chat_id: chatId,
      text: '🎲 *Buckshot Roulette Tracker*\n\nWelcome! This tactical companion helps you track live and blank shotgun shells remaining in the chamber during your matches.\n\nTap the button below to launch the tracker:',
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '⚡ Launch Ammunition Tracker',
              web_app: { url: miniAppUrl },
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
            web_app: { url: miniAppUrl },
          },
        ],
      ],
    },
  });
}
