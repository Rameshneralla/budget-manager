/** Browser file helpers for Settings > Data Management. */

export function downloadJson(data, fileName) {
  downloadBytes(JSON.stringify(data, null, 2), fileName, 'application/json');
}

/** Saves raw bytes (e.g. a SQLite backup) as a file download. */
export function downloadBytes(bytes, fileName, mimeType = 'application/octet-stream') {
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Reads a File chosen in an <input type="file"> and parses it as JSON. */
export async function readJsonFile(file) {
  const text = await file.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }
}
