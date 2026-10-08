/**
 * The REST API, answered inside the browser (GitHub Pages build).
 *
 * services/api.js sends requests here instead of over the network when
 * VITE_DATA_MODE=local. Routes and responses match server/src/routes exactly,
 * and the work is done by the SAME server services, validators and repositories
 * (bundled from server/src), so business rules exist in one place only.
 *
 * Returns { status, payload } just like an HTTP response.
 */
import incomeService from '../../../server/src/services/incomeService';
import expenseService from '../../../server/src/services/expenseService';
import upcomingIncomeService from '../../../server/src/services/upcomingIncomeService';
import dashboardService from '../../../server/src/services/dashboardService';
import monthService from '../../../server/src/services/monthService';
import metaService from '../../../server/src/services/metaService';
import auditService from '../../../server/src/services/auditService';
import dataService from '../../../server/src/services/dataService';
import errors from '../../../server/src/utils/errors';
import { getBrowserDatabase, persistBrowserDatabase } from './browserDatabase';
import {
  connect,
  disconnect,
  ensureStartupSync,
  getSyncStatus,
  resolveConflict,
  runSyncedWrite,
  syncNow,
} from './sync/syncManager';
import { SyncError } from './sync/githubStore';
import { downloadBytes } from '../utils/fileDownload';

const { AppError, NotFoundError } = errors;

const RECORD_SERVICES = {
  income: incomeService,
  expenses: expenseService,
  'upcoming-income': upcomingIncomeService,
};

// POST requests that do not change budget data (so they are not synced).
const NON_CHANGING_REQUESTS = new Set(['POST /data/backup']);

const DATABASE_ERROR_MESSAGE = 'A database error occurred. Your changes were not saved.';

function ok(data, status = 200) {
  return { status, payload: { data } };
}

/** /income/12/status -> ['income', '12', 'status'] */
function splitPath(path) {
  return path.split('/').filter(Boolean);
}

/** Standard record routes - mirrors server/src/routes/createRecordRouter.js. */
function handleRecordRoute(service, method, rest, query, body) {
  const [first, second] = rest;

  if (method === 'POST' && first === 'bulk-status') {
    return ok(service.bulkChangeStatus(body));
  }
  if (method === 'POST' && first === 'bulk-delete') {
    return ok(service.bulkRemove(body));
  }
  if (!first) {
    if (method === 'GET') {
      return ok(service.listByMonth(query.month));
    }
    if (method === 'POST') {
      return ok(service.create(body), 201);
    }
  }
  if (first && !second) {
    if (method === 'GET') {
      return ok(service.getById(first));
    }
    if (method === 'PUT') {
      return ok(service.update(first, body));
    }
    if (method === 'DELETE') {
      return ok(service.remove(first));
    }
  }
  if (first && second === 'status' && method === 'PATCH') {
    return ok(service.changeStatus(first, body));
  }
  return null;
}

function backupToDownload(adapter) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `budget-backup-${timestamp}.sqlite`;
  downloadBytes(adapter.exportBytes(), fileName, 'application/vnd.sqlite3');
  return { fileName, folder: 'Downloads', createdAt: new Date().toISOString() };
}

function route(method, path, query, body, adapter) {
  const [resource, ...rest] = splitPath(path);
  const key = `${method} /${[resource, ...rest].join('/')}`;

  switch (key) {
    case 'GET /health':
      return ok({ status: 'ok' });
    case 'GET /auth/session':
      // Data never leaves this device, so there is nothing to log in to.
      return ok({ authRequired: false, authenticated: true });
    case 'POST /auth/login':
    case 'POST /auth/logout':
      return ok({ authenticated: true });
    case 'GET /meta':
      return ok(metaService.getMeta());
    case 'GET /months':
      return ok(monthService.listMonths());
    case 'GET /activity':
      return ok(auditService.getRecentActivity(query.limit));
    case 'GET /dashboard':
      return ok(dashboardService.getDashboard(query.month));
    case 'GET /data/export':
      return { status: 200, payload: dataService.exportData() };
    case 'POST /data/import':
      return ok(dataService.importData(body, { source: 'import file' }));
    case 'POST /data/backup':
      return ok(backupToDownload(adapter), 201);
    default:
      break;
  }

  const service = RECORD_SERVICES[resource];
  const result = service && handleRecordRoute(service, method, rest, query, body);
  if (!result) {
    throw new NotFoundError(`API route not found: ${method} /api${path}`);
  }
  return result;
}

/** Same error envelope as server/src/middleware/errorHandler.js. */
function toErrorResponse(error) {
  if (error instanceof AppError) {
    const body = { code: error.code, message: error.message };
    if (error.details) {
      body.details = error.details;
    }
    return { status: error.statusCode, payload: { error: body } };
  }
  console.error(error);
  return {
    status: 500,
    payload: { error: { code: 'DATABASE_ERROR', message: DATABASE_ERROR_MESSAGE } },
  };
}

/** Settings > Sync across devices (browser version only). */
async function handleSyncRoute(method, path, body = {}) {
  const key = `${method} ${path}`;
  switch (key) {
    case 'GET /sync/status':
      return ok(getSyncStatus());
    case 'POST /sync/connect': {
      const { owner, repo, token, choice = null } = body;
      if (![owner, repo, token].every((value) => typeof value === 'string' && value.trim())) {
        throw new AppError('Repository and access token are required.', 400, 'VALIDATION_ERROR');
      }
      return ok(await connect({ owner, repo, token }, choice));
    }
    case 'POST /sync/now':
      return ok(await syncNow());
    case 'POST /sync/resolve':
      return ok(await resolveConflict(body.keep === 'cloud' ? 'cloud' : 'device'));
    case 'POST /sync/disconnect':
      return ok(disconnect());
    default:
      throw new NotFoundError(`API route not found: ${method} /api${path}`);
  }
}

export async function handleLocalRequest(method, path, query = {}, body = undefined) {
  try {
    // JSON round-trip gives services the same plain data an HTTP request would.
    const requestBody = body === undefined ? undefined : JSON.parse(JSON.stringify(body));
    if (path.startsWith('/sync/')) {
      return await handleSyncRoute(method, path, requestBody);
    }

    await getBrowserDatabase();
    await ensureStartupSync(); // show the latest synced data on the first screen

    const changesData = method !== 'GET' && !NON_CHANGING_REQUESTS.has(`${method} ${path}`);
    if (!changesData) {
      return route(method, path, query ?? {}, requestBody, await getBrowserDatabase());
    }
    // Changes are applied on top of the latest synced copy and then uploaded.
    const response = await runSyncedWrite(() =>
      route(method, path, query ?? {}, requestBody, null)
    );
    await persistBrowserDatabase();
    return response;
  } catch (error) {
    if (error instanceof SyncError) {
      return { status: 400, payload: { error: { code: 'SYNC_ERROR', message: error.message } } };
    }
    return toErrorResponse(error);
  }
}
