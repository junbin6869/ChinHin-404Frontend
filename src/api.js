const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export const callBackend = async (path, options = {}) => {
  const response = await fetch(API_BASE_URL + path, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  return response.json();
};

// For multipart/form-data uploads (do NOT set Content-Type manually)
export const uploadDocumentForClassification = async (file) => {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(API_BASE_URL + "/insight/document/classify", {
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