import router from '../cv.routes';

const registeredRoutes = (router as any).stack
  .filter((layer: any) => layer.route)
  .map((layer: any) => ({
    path: layer.route.path as string,
    methods: Object.keys(layer.route.methods as Record<string, boolean>),
  }));

describe('CV route registration', () => {
  it('registers only the supported customization, data, regeneration, and PDF endpoints', () => {
    expect(registeredRoutes).toEqual([
      { path: '/:id/data', methods: ['get'] },
      { path: '/:id/needs-regeneration', methods: ['get'] },
      { path: '/:id/download', methods: ['get'] },
      { path: '/:id/regenerate', methods: ['post'] },
      { path: '/:id', methods: ['get'] },
      { path: '/:id', methods: ['put'] },
    ]);
  });

  it('keeps specific student subroutes before the generic student route', () => {
    const genericRouteIndex = registeredRoutes.findIndex((route: { path: string }) => route.path === '/:id');
    const specificRouteIndexes = registeredRoutes
      .map((route: { path: string }, index: number) => route.path === '/:id' ? -1 : index)
      .filter((index: number) => index >= 0);

    expect(genericRouteIndex).toBeGreaterThan(-1);
    expect(specificRouteIndexes.every((index: number) => index < genericRouteIndex)).toBe(true);
  });
});
