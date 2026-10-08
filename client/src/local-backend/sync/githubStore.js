/**
 * Reads and writes the synced database file in a PRIVATE GitHub repository
 * through the GitHub REST API (contents endpoints). Used only by syncManager.js.
 *
 * Every write sends the file's previous `sha`; GitHub rejects the write (409/422)
 * if another device saved in between, which is how conflicts are detected.
 */
const API_BASE = 'https://api.github.com';
const BASE64_CHUNK_SIZE = 0x8000;

export class SyncError extends Error {
  /** @param {'auth'|'not-found'|'public-repo'|'conflict'|'network'|'other'} kind */
  constructor(message, kind) {
    super(message);
    this.name = 'SyncError';
    this.kind = kind;
  }
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let start = 0; start < bytes.length; start += BASE64_CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(start, start + BASE64_CHUNK_SIZE));
  }
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function githubRequest(config, method, apiPath, body) {
  let response;
  try {
    response = await fetch(`${API_BASE}${apiPath}`, {
      method,
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${config.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new SyncError('No internet connection - changes are saved on this device.', 'network');
  }

  if (response.status === 401 || response.status === 403) {
    throw new SyncError(
      'GitHub refused the access token. Check that it is valid and has Contents: Read and write access to the repository.',
      'auth'
    );
  }
  if (response.status === 409 || response.status === 422) {
    throw new SyncError('The synced data was changed on another device.', 'conflict');
  }
  return response;
}

function repoPath(config) {
  return `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}`;
}

function filePath(config) {
  return `${repoPath(config)}/contents/${config.path.split('/').map(encodeURIComponent).join('/')}`;
}

/** Confirms the repository exists, is reachable with the token, and is PRIVATE. */
export async function checkRepository(config) {
  const response = await githubRequest(config, 'GET', repoPath(config));
  if (response.status === 404) {
    throw new SyncError(
      `Repository "${config.owner}/${config.repo}" was not found, or the token cannot access it. ` +
        `Check the repository exists, then edit the token on GitHub: Repository access → ` +
        `"Only select repositories" → ${config.repo}, and Contents → "Read and write".`,
      'not-found'
    );
  }
  if (!response.ok) {
    throw new SyncError(`GitHub error ${response.status} while checking the repository.`, 'other');
  }
  const repository = await response.json();
  if (!repository.private) {
    throw new SyncError(
      'This repository is PUBLIC. Your budget can only be synced to a private repository.',
      'public-repo'
    );
  }
  return repository;
}

/** @returns {Promise<{ sha: string, bytes: Uint8Array } | null>} null when the file does not exist yet */
export async function downloadFile(config) {
  const response = await githubRequest(config, 'GET', filePath(config));
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new SyncError(`GitHub error ${response.status} while downloading.`, 'other');
  }
  const file = await response.json();
  let { content } = file;
  if (!content && file.size > 0) {
    // Files over 1 MB are not returned inline; fetch them as a blob instead.
    const blob = await githubRequest(config, 'GET', `${repoPath(config)}/git/blobs/${file.sha}`);
    content = (await blob.json()).content;
  }
  return { sha: file.sha, bytes: base64ToBytes(content || '') };
}

/** Uploads the file; `previousSha` must be the last known version (null for a new file). */
export async function uploadFile(config, bytes, previousSha, message) {
  const response = await githubRequest(config, 'PUT', filePath(config), {
    message,
    content: bytesToBase64(bytes),
    ...(previousSha ? { sha: previousSha } : {}),
  });
  if (!response.ok) {
    throw new SyncError(`GitHub error ${response.status} while uploading.`, 'other');
  }
  return (await response.json()).content.sha;
}
