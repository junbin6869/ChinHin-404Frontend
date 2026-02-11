const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const callBackend = async (path, options = {}) => {
  const response = await fetch(API_BASE_URL + path, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  return response.json();
};
