/**
 * The one place that talks HTTP. Every other service calls these helpers.
 *
 * Server responses use the envelope { data } on success and
 * { error: { code, message, details } } on failure (see server errorHandler.js).
 * Failures are thrown as ApiError so components can show error.message and
 * map error.fieldErrors onto form fields.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const NETWORK_ERROR_MESSAGE = 'Unable to reach the server. Please check that the API is running.';
const UNKNOWN_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN', fieldErrors = {} } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

const HTTP_UNAUTHORIZED = 401;
const UNAUTHENTICATED_CODE = 'UNAUTHENTICATED';

// Called when the server says the session is missing or expired (see AuthContext).
let handleUnauthenticated = () => {};

export function setUnauthenticatedHandler(handler) {
  handleUnauthenticated = handler;
}

function buildUrl(path, query) {
  const url = `${API_BASE_URL}${path}`;
  if (!query) {
    return url;
  }
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * @param {string} method  HTTP method
 * @param {string} path    path below /api, e.g. '/income'
 * @param {{ query?: object, body?: unknown, unwrap?: boolean }} options
 *        unwrap=false returns the whole JSON body instead of body.data
 */
export async function request(method, path, { query, body, unwrap = true } = {}) {
  let response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE);
  }

  const payload = await parseJson(response);

  if (!response.ok) {
    const error = payload?.error;
    if (response.status === HTTP_UNAUTHORIZED && error?.code === UNAUTHENTICATED_CODE) {
      handleUnauthenticated();
    }
    throw new ApiError(error?.message || UNKNOWN_ERROR_MESSAGE, {
      status: response.status,
      code: error?.code,
      fieldErrors: error?.details || {},
    });
  }

  return unwrap ? payload?.data : payload;
}

export const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: (path) => request('DELETE', path),
};
