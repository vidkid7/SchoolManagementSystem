const RELOAD_KEY = 'vite:preload-error-reload-at';
const RELOAD_THROTTLE_MS = 30_000;

type RecoveryWindow = Pick<Window, 'addEventListener' | 'sessionStorage'> & {
  location: Pick<Location, 'reload'>;
};

export function registerVitePreloadErrorRecovery(
  target: RecoveryWindow = window,
): void {
  target.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();

    try {
      const now = Date.now();
      const previousReload = Number(target.sessionStorage.getItem(RELOAD_KEY));

      // A broken current deployment must not cause an endless reload loop.
      if (previousReload > 0 && now - previousReload < RELOAD_THROTTLE_MS) {
        return;
      }

      target.sessionStorage.setItem(RELOAD_KEY, String(now));
      target.location.reload();
    } catch {
      // Storage can be disabled by browser policy; keep the original error visible.
    }
  });
}
