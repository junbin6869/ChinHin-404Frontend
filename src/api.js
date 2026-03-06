const RAW_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

export const callBackend = async (path, options = {}) => {
  const finalPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${API_BASE_URL}${finalPath}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - ${text}`);
  }

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Expected JSON but got: ${text.slice(0, 200)}`);
  }
};

export const uploadDocumentForClassification = async (file) => {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE_URL}/insight/document/classify`, {
    method: "POST",
    body: form,
  });
  return res.json();
};

export const commitDocumentToSharePoint = async (stagingId) => {
  return callBackend("/insight/document/commit", {
    method: "POST",
    body: JSON.stringify({ staging_id: stagingId }),
  });
};
