export class EndpointError extends Error {
  code?: string;
  parameters?: Record<string, unknown>;

  constructor(description: string, parameters?: Record<string, unknown>) {
    super(description);
    this.name = 'EndpointError';
    this.parameters = parameters;
    if (parameters && typeof parameters.code === 'string') {
      this.code = parameters.code;
    }
  }
}

export class BotApiError extends Error {
  code: number;
  description: string;
  parameters?: Record<string, unknown>;

  constructor(description: string, code: number = 400, parameters?: Record<string, unknown>) {
    super(description);
    this.name = 'BotApiError';
    this.code = code;
    this.description = description;
    this.parameters = parameters;
  }
}

export const db = {
  select: () => ({
    from: () => ({
      where: () => ({
        orderBy: () => ({
          get: async () => null,
          all: async () => [],
        }),
        get: async () => null,
        all: async () => [],
      }),
      orderBy: () => ({
        get: async () => null,
        all: async () => [],
      }),
      get: async () => null,
      all: async () => [],
    }),
  }),
  insert: () => ({
    values: () => ({
      run: async () => ({ rowsAffected: 1 }),
    }),
  }),
  update: () => ({
    set: () => ({
      where: () => ({
        run: async () => ({ rowsAffected: 1 }),
      }),
    }),
  }),
};

export const api = {};
export const fetch = globalThis.fetch;
