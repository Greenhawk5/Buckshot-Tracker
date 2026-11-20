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
  method?: string;

  constructor(description: string, code: number = 400, parameters?: Record<string, unknown>, method?: string) {
    super(description);
    this.name = 'BotApiError';
    this.code = code;
    this.description = description;
    this.parameters = parameters;
    this.method = method;
  }
}

export class InputFile {
  bytes: Uint8Array | ArrayBuffer;
  filename: string;
  opts?: { type?: string };

  constructor(bytes: Uint8Array | ArrayBuffer, filename: string, opts?: { type?: string }) {
    this.bytes = bytes;
    this.filename = filename;
    this.opts = opts;
  }
}

// In-memory mock store for backend unit and integration tests
export const memoryStore: {
  tracker_sessions: Map<string, any>;
  processed_operations: Map<string, any>;
  users: Map<string, any>;
  activity_events: Map<string, any>;
  broadcast_campaigns: Map<string, any>;
  broadcast_recipients: Map<string, any>;
  admin_audit_logs: Map<string, any>;
  app_settings: Map<string, any>;
  feedback_reports: Map<string, any>;
  reset: () => void;
  [key: string]: any;
} = {
  tracker_sessions: new Map<string, any>(),
  processed_operations: new Map<string, any>(),
  users: new Map<string, any>(),
  activity_events: new Map<string, any>(),
  broadcast_campaigns: new Map<string, any>(),
  broadcast_recipients: new Map<string, any>(),
  admin_audit_logs: new Map<string, any>(),
  app_settings: new Map<string, any>(),
  feedback_reports: new Map<string, any>(),
  reset() {
    this.tracker_sessions.clear();
    this.processed_operations.clear();
    this.users.clear();
    this.activity_events.clear();
    this.broadcast_campaigns.clear();
    this.broadcast_recipients.clear();
    this.admin_audit_logs.clear();
    this.app_settings.clear();
    this.feedback_reports.clear();
    apiMock.reset();
  },
};

export function table(name: string, schema: any, constraintsCb?: (t: any) => any) {
  const tbl: any = { _tableName: name };
  for (const [key, val] of Object.entries(schema)) {
    tbl[key] = { ...(val as object), prop: key };
  }
  if (constraintsCb) {
    tbl._constraints = constraintsCb(tbl);
  }
  return tbl;
}

function makeCol(name: string, type: string) {
  const col: any = { name, type };
  col.primaryKey = () => col;
  col.notNull = () => col;
  col.unique = () => col;
  col.default = (v: any) => ({ ...col, defaultVal: v, notNull: () => col });
  col.deprecated = (reason?: string) => ({ ...col, deprecated: reason });
  return col;
}

export function text(name: string) {
  return makeCol(name, 'text');
}

export function integer(name: string, opts?: any) {
  const col = makeCol(name, 'integer');
  col.opts = opts;
  return col;
}

export function boolean(name: string) {
  return makeCol(name, 'boolean');
}

export function json(name: string) {
  return makeCol(name, 'json');
}

export function index(name: string) {
  return { on: (..._cols: any[]) => ({ name }) };
}

export function uniqueIndex(name: string) {
  return { on: (..._cols: any[]) => ({ name, unique: true }) };
}

export function check(name: string, _expr: any) {
  return { name, type: 'check' };
}

function getColVal(row: any, col: any): any {
  if (!row) return undefined;
  if (typeof col === 'string') return row[col];
  const candidates = [col?.prop, col?.name, col?._name].filter(Boolean);
  for (const c of candidates) {
    if (row[c] !== undefined) return row[c];
  }
  for (const k of Object.keys(row)) {
    if (candidates.some((c) => c.replace(/_/g, '').toLowerCase() === k.replace(/_/g, '').toLowerCase())) {
      return row[k];
    }
  }
  return undefined;
}

export function eq(col: any, val: any) {
  return (row: any) => {
    const rowVal = getColVal(row, col);
    return rowVal === val;
  };
}

export function ne(col: any, val: any) {
  return (row: any) => {
    const rowVal = getColVal(row, col);
    return rowVal !== val;
  };
}

export function gt(col: any, val: any) {
  return (row: any) => {
    const rowVal = getColVal(row, col);
    return rowVal > val;
  };
}

export function gte(col: any, val: any) {
  return (row: any) => {
    const rowVal = getColVal(row, col);
    return rowVal >= val;
  };
}

export function lt(col: any, val: any) {
  return (row: any) => {
    const rowVal = getColVal(row, col);
    return rowVal < val;
  };
}

export function lte(col: any, val: any) {
  return (row: any) => {
    const rowVal = getColVal(row, col);
    return rowVal <= val;
  };
}

export function isNull(col: any) {
  return (row: any) => {
    const rowVal = getColVal(row, col);
    return rowVal === null || rowVal === undefined;
  };
}

export function isNotNull(col: any) {
  return (row: any) => {
    const rowVal = getColVal(row, col);
    return rowVal !== null && rowVal !== undefined;
  };
}

export function inArray(col: any, vals: any[]) {
  return (row: any) => {
    const rowVal = getColVal(row, col);
    return Array.isArray(vals) && vals.includes(rowVal);
  };
}

export function notInArray(col: any, vals: any[]) {
  return (row: any) => {
    const rowVal = getColVal(row, col);
    return Array.isArray(vals) && !vals.includes(rowVal);
  };
}

export function and(...predicates: any[]) {
  return (row: any) => predicates.filter(Boolean).every((p) => (typeof p === 'function' ? p(row) : true));
}

export function or(...predicates: any[]) {
  return (row: any) => predicates.filter(Boolean).some((p) => (typeof p === 'function' ? p(row) : false));
}

export function not(predicate: any) {
  return (row: any) => (typeof predicate === 'function' ? !predicate(row) : !predicate);
}

export function desc(col: any) {
  return { col, dir: 'desc' };
}

export function asc(col: any) {
  return { col, dir: 'asc' };
}

export const sql: any = (strings: TemplateStringsArray, ...values: any[]) => {
  return {
    raw: strings.reduce((acc, str, i) => acc + str + (values[i] !== undefined ? String(values[i]) : ''), ''),
    values,
  };
};
sql.raw = (str: string) => ({ raw: str, values: [] });

function getTableMap(tableDef: any): Map<string, any> {
  const name = tableDef?._tableName || 'tracker_sessions';
  if (!(memoryStore as any)[name]) {
    (memoryStore as any)[name] = new Map<string, any>();
  }
  return (memoryStore as any)[name];
}

function sortRows(rows: any[], orderBys: any[]): any[] {
  if (!orderBys || orderBys.length === 0) return rows;
  return [...rows].sort((a, b) => {
    for (const ob of orderBys) {
      const col = ob?.col;
      const dir = ob?.dir || 'asc';
      const aVal = getColVal(a, col);
      const bVal = getColVal(b, col);
      if (aVal < bVal) return dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return dir === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

function projectRows(rows: any[], projection?: any): any[] {
  if (!projection) return rows;
  return rows.map((r) => {
    const projected: any = {};
    for (const [k, v] of Object.entries(projection)) {
      projected[k] = getColVal(r, v);
    }
    return projected;
  });
}

export const db = {
  select: (projection?: any) => ({
    from: (tableDef: any) => {
      let currentWhere: any = null;
      let currentOrderBys: any[] = [];
      let currentLimit: number | null = null;
      let currentOffset: number = 0;

      const executeQuery = () => {
        const tbl = getTableMap(tableDef);
        let rows = Array.from(tbl.values());
        if (currentWhere) {
          rows = rows.filter((r) => (typeof currentWhere === 'function' ? currentWhere(r) : true));
        }
        rows = sortRows(rows, currentOrderBys);
        if (currentOffset > 0) {
          rows = rows.slice(currentOffset);
        }
        if (currentLimit !== null) {
          rows = rows.slice(0, currentLimit);
        }
        return projectRows(rows, projection);
      };

      const chain: any = {
        where: (predicate: any) => {
          currentWhere = predicate;
          return chain;
        },
        orderBy: (...orderBys: any[]) => {
          currentOrderBys = orderBys;
          return chain;
        },
        limit: (n: number) => {
          currentLimit = n;
          return chain;
        },
        offset: (n: number) => {
          currentOffset = n;
          return chain;
        },
        get: async () => {
          const rows = executeQuery();
          return rows[0] || null;
        },
        all: async () => {
          return executeQuery();
        },
        // Thenable support for `await db.select().from(...)`
        then: (resolve: any, reject: any) => {
          try {
            resolve(executeQuery());
          } catch (e) {
            reject(e);
          }
        },
      };

      return chain;
    },
  }),

  $count: async (tableDef: any, predicate?: any) => {
    const tbl = getTableMap(tableDef);
    let rows = Array.from(tbl.values());
    if (predicate) {
      rows = rows.filter((r) => (typeof predicate === 'function' ? predicate(r) : true));
    }
    return rows.length;
  },

  insert: (tableDef: any) => ({
    values: (rowsOrRow: any) => {
      let isReturning = false;
      const rows = Array.isArray(rowsOrRow) ? rowsOrRow : [rowsOrRow];

      const runInsert = () => {
        const tbl = getTableMap(tableDef);
        const insertedRows: any[] = [];
        for (const row of rows) {
          const key =
            row.id ||
            row.operationId ||
            row.telegramId ||
            row.eventId ||
            row.campaignKey ||
            row.key ||
            `mock_pk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const fullRow = { ...row, id: row.id || key };
          tbl.set(String(key), fullRow);
          insertedRows.push(fullRow);
        }
        return isReturning ? insertedRows : { rowsAffected: insertedRows.length, lastInsertRowid: 1, rows: [] };
      };

      const chain: any = {
        returning: () => {
          isReturning = true;
          return chain;
        },
        onConflictDoNothing: () => chain,
        onConflictDoUpdate: () => chain,
        run: async () => runInsert(),
        then: (resolve: any, reject: any) => {
          try {
            resolve(runInsert());
          } catch (e) {
            reject(e);
          }
        },
      };
      return chain;
    },
  }),

  update: (tableDef: any) => ({
    set: (updates: any) => ({
      where: (predicate: any) => {
        const runUpdate = () => {
          const tbl = getTableMap(tableDef);
          let count = 0;
          for (const [key, existing] of tbl.entries()) {
            if (typeof predicate === 'function' ? predicate(existing) : true) {
              tbl.set(key, { ...existing, ...updates });
              count++;
            }
          }
          return { rowsAffected: count };
        };

        return {
          run: async () => runUpdate(),
          then: (resolve: any, reject: any) => {
            try {
              resolve(runUpdate());
            } catch (e) {
              reject(e);
            }
          },
        };
      },
    }),
  }),

  delete: (tableDef: any) => ({
    where: (predicate: any) => {
      const runDelete = () => {
        const tbl = getTableMap(tableDef);
        let count = 0;
        for (const [key, existing] of Array.from(tbl.entries())) {
          if (typeof predicate === 'function' ? predicate(existing) : true) {
            tbl.delete(key);
            count++;
          }
        }
        return { rowsAffected: count };
      };

      return {
        run: async () => runDelete(),
        then: (resolve: any, reject: any) => {
          try {
            resolve(runDelete());
          } catch (e) {
            reject(e);
          }
        },
      };
    },
  }),

  run: async (_query: any, _params?: any) => {
    return { rowsAffected: 1, lastInsertRowid: 1, rows: [] };
  },
  all: async (_query: any, _params?: any) => {
    return [];
  },
  get: async (_query: any, _params?: any) => {
    return null;
  },
  values: async (_query: any, _params?: any) => {
    return [];
  },
};

// Configurable Telegram Bot API Mock for testing
export const apiMock = {
  calls: [] as Array<{ method: string; params: any }>,
  botInfo: { id: 9258143432, is_bot: true, first_name: 'Buckshot Tracker Bot', username: 'BuckshotTrackerBot' },
  customHandlers: new Map<string, (params: any) => any>(),

  reset() {
    this.calls = [];
    this.customHandlers.clear();
  },

  onMethod(method: string, handler: (params: any) => any) {
    this.customHandlers.set(method, handler);
  },
};

export const api = new Proxy(apiMock, {
  get(target, prop: string) {
    if (prop in target) {
      return (target as any)[prop];
    }
    return async (params: any) => {
      target.calls.push({ method: prop, params });
      if (target.customHandlers.has(prop)) {
        return target.customHandlers.get(prop)!(params);
      }
      if (prop === 'getMe') {
        return target.botInfo;
      }
      if (prop.startsWith('send') || prop.startsWith('edit')) {
        return { message_id: Math.floor(Math.random() * 100000) + 1, chat: { id: params?.chat_id } };
      }
      return { ok: true };
    };
  },
});

export const fetch = globalThis.fetch;
