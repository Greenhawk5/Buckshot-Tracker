import { useEffect, useState, useMemo, useCallback } from 'react';
import '../services/telegram.types';

export function useTelegram() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      try {
        webApp.ready();
        webApp.expand();
        webApp.setHeaderColor('#0c0d0f');
        webApp.setBackgroundColor('#0c0d0f');
      } catch {
        // graceful fallback if running outside Telegram
      }
      setIsReady(true);
    }
  }, []);

  const user = useMemo(() => {
    return window.Telegram?.WebApp?.initDataUnsafe?.user ?? null;
  }, [isReady]);

  const haptics = useMemo(() => {
    const h = window.Telegram?.WebApp?.HapticFeedback;
    return {
      light: () => {
        try { h?.impactOccurred('light'); } catch { /* ignore */ }
      },
      medium: () => {
        try { h?.impactOccurred('medium'); } catch { /* ignore */ }
      },
      heavy: () => {
        try { h?.impactOccurred('heavy'); } catch { /* ignore */ }
      },
      success: () => {
        try { h?.notificationOccurred('success'); } catch { /* ignore */ }
      },
      warning: () => {
        try { h?.notificationOccurred('warning'); } catch { /* ignore */ }
      },
      error: () => {
        try { h?.notificationOccurred('error'); } catch { /* ignore */ }
      },
      selection: () => {
        try { h?.selectionChanged(); } catch { /* ignore */ }
      },
    };
  }, []);

  const setClosingConfirmation = useCallback((enabled: boolean) => {
    try {
      if (enabled) {
        window.Telegram?.WebApp?.enableClosingConfirmation();
      } else {
        window.Telegram?.WebApp?.disableClosingConfirmation();
      }
    } catch {
      // ignore
    }
  }, []);

  const close = useCallback(() => {
    try {
      window.Telegram?.WebApp?.close();
    } catch {
      // ignore
    }
  }, []);

  return {
    isTelegram: Boolean(window.Telegram?.WebApp?.initData),
    webApp: window.Telegram?.WebApp,
    user,
    haptics,
    setClosingConfirmation,
    close,
  };
}
