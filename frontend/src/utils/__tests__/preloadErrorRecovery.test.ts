import { registerVitePreloadErrorRecovery } from '../preloadErrorRecovery';

describe('registerVitePreloadErrorRecovery', () => {
  const createTarget = () => {
    let listener: ((event: Event) => void) | undefined;
    const values = new Map<string, string>();
    const reload = jest.fn();
    const target = {
      addEventListener: jest.fn((_type: string, callback: EventListenerOrEventListenerObject) => {
        listener = callback as (event: Event) => void;
      }),
      sessionStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
      location: { reload },
    } as unknown as Parameters<typeof registerVitePreloadErrorRecovery>[0];

    return {
      target,
      reload,
      fire: () => {
        const event = new Event('vite:preloadError', { cancelable: true });
        listener?.(event);
        return event.defaultPrevented;
      },
    };
  };

  it('prevents the chunk error and reloads the stale page once', () => {
    const { target, reload, fire } = createTarget();
    registerVitePreloadErrorRecovery(target);

    expect(fire()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    fire();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('allows another recovery attempt after the loop guard expires', () => {
    const { target, reload, fire } = createTarget();
    const now = jest.spyOn(Date, 'now');
    now.mockReturnValue(1_000);
    registerVitePreloadErrorRecovery(target);

    fire();
    now.mockReturnValue(32_000);
    fire();

    expect(reload).toHaveBeenCalledTimes(2);
    now.mockRestore();
  });
});
