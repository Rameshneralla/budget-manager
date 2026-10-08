/**
 * Wraps a sql.js database so it behaves like the small part of better-sqlite3
 * that the server repositories use:
 *
 *   db.prepare(sql).all(...params) / .get(...params) / .run(...params)
 *   db.transaction(fn)   -> function that runs fn atomically
 *   db.exec(sql)
 *
 * Parameters work the same way: positional values (`?`), or one object whose
 * keys match `@name` placeholders.
 */

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** better-sqlite3 style params -> sql.js bind params. */
function toBindParams(params) {
  if (params.length === 1 && isPlainObject(params[0])) {
    return Object.fromEntries(
      Object.entries(params[0]).map(([key, value]) => [`@${key}`, value ?? null])
    );
  }
  return params.map((value) => value ?? null);
}

class Statement {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql;
  }

  all(...params) {
    const statement = this.database.prepare(this.sql);
    try {
      statement.bind(toBindParams(params));
      const rows = [];
      while (statement.step()) {
        rows.push(statement.getAsObject());
      }
      return rows;
    } finally {
      statement.free();
    }
  }

  get(...params) {
    return this.all(...params)[0];
  }

  run(...params) {
    this.database.run(this.sql, toBindParams(params));
    const changes = this.database.getRowsModified();
    const [lastIdRow] = this.database.exec('SELECT last_insert_rowid() AS id');
    return { changes, lastInsertRowid: lastIdRow ? lastIdRow.values[0][0] : 0 };
  }
}

export class SqliteAdapter {
  constructor(database) {
    this.database = database;
    this.transactionDepth = 0;
  }

  prepare(sql) {
    return new Statement(this.database, sql);
  }

  exec(sql) {
    this.database.exec(sql);
  }

  /** Nested calls use savepoints, like better-sqlite3. */
  transaction(work) {
    return (...args) => {
      const savepoint = `sp_${this.transactionDepth}`;
      this.database.exec(this.transactionDepth === 0 ? 'BEGIN' : `SAVEPOINT ${savepoint}`);
      this.transactionDepth += 1;
      try {
        const result = work(...args);
        this.transactionDepth -= 1;
        this.database.exec(this.transactionDepth === 0 ? 'COMMIT' : `RELEASE ${savepoint}`);
        return result;
      } catch (error) {
        this.transactionDepth -= 1;
        this.database.exec(
          this.transactionDepth === 0
            ? 'ROLLBACK'
            : `ROLLBACK TO ${savepoint}; RELEASE ${savepoint}`
        );
        throw error;
      }
    };
  }

  /** The whole database file, for saving to IndexedDB or downloading as a backup. */
  exportBytes() {
    return this.database.export();
  }
}
