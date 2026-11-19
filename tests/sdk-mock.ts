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

// In-memory mock store for backend unit tests
export const memoryStore = {
  tracker_sessions: new Map<string, any>(),
  processed_operations: new Map<string, any>(),
  reset() {
    this.tracker_sessions.clear();
    this.processed_operations.clear();
  },
};

export function table(name: string, schema: any) {
  const tbl: any = { _tableName: name };
  for (const [key, val] of Object.entries(schema)) {
    tbl[key] = { ...(val as object), prop: key };
  }
  return tbl;
}

export function text(name: string) {
  const col: any = { name, type: 'text' };
  col.primaryKey = () => col;
  col.notNull = () => col;
  return col;
}

export function integer(name: string) {
  const col: any = { name, type: 'integer' };
  col.notNull = () => col;
  col.default = (v: any) => ({ ...col, defaultVal: v, notNull: () => col });
  return col;
}

export function index(name: string) {
  return { on: () => ({ name }) };
}

export function eq(col: any, val: any) {
  return (row: any) => {
    if (!row) return false;
    const candidates = [col?.prop, col?.name, col?._name].filter(Boolean);
    for (const c of candidates) {
      if (row[c] !== undefined) {
        return row[c] === val;
      }
    }
    // Fallback case-insensitive match
    for (const k of Object.keys(row)) {
      if (candidates.some((c) => c.replace(/_/g, '').toLowerCase() === k.replace(/_/g, '').toLowerCase())) {
        return row[k] === val;
      }
    }
    return false;
  };
}

export function and(...predicates: any[]) {
  return (row: any) => predicates.every((p) => (typeof p === 'function' ? p(row) : true));
}

export function desc(col: any) {
  return { col, dir: 'desc' };
}

export const db = {
  select: () => ({
    from: (tableDef: any) => {
      const getTable = () => {
        const name = tableDef?._tableName || 'tracker_sessions';
        return (memoryStore as any)[name] || memoryStore.tracker_sessions;
      };

      return {
        where: (predicate: any) => ({
          orderBy: () => ({
            get: async () => {
              const rows = Array.from(getTable().values());
              return rows.find((r: any) => (typeof predicate === 'function' ? predicate(r) : true)) || null;
            },
            all: async () => {
              const rows = Array.from(getTable().values());
              return rows.filter((r: any) => (typeof predicate === 'function' ? predicate(r) : true));
            },
          }),
          get: async () => {
            const rows = Array.from(getTable().values());
            return rows.find((r: any) => (typeof predicate === 'function' ? predicate(r) : true)) || null;
          },
          all: async () => {
            const rows = Array.from(getTable().values());
            return rows.filter((r: any) => (typeof predicate === 'function' ? predicate(r) : true));
          },
        }),
        orderBy: () => ({
          get: async () => {
            const rows = Array.from(getTable().values());
            return rows[0] || null;
          },
          all: async () => Array.from(getTable().values()),
        }),
        get: async () => {
          const rows = Array.from(getTable().values());
          return rows[0] || null;
        },
        all: async () => Array.from(getTable().values()),
      };
    },
  }),
  insert: (tableDef: any) => ({
    values: (row: any) => ({
      run: async () => {
        const name = tableDef?._tableName || 'tracker_sessions';
        const tbl = (memoryStore as any)[name] || memoryStore.tracker_sessions;
        const key = row.id || row.operationId || Math.random().toString();
        tbl.set(key, { ...row });
        return { rowsAffected: 1 };
      },
    }),
  }),
  update: (tableDef: any) => ({
    set: (updates: any) => ({
      where: (predicate: any) => ({
        run: async () => {
          const name = tableDef?._tableName || 'tracker_sessions';
          const tbl = (memoryStore as any)[name] || memoryStore.tracker_sessions;
          for (const [key, existing] of tbl.entries()) {
            if (typeof predicate === 'function' ? predicate(existing) : true) {
              tbl.set(key, { ...existing, ...updates });
            }
          }
          return { rowsAffected: 1 };
        },
      }),
    }),
  }),
};

export const api = {};
export const fetch = globalThis.fetch;
