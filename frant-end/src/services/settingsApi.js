import BASE_URL from "./apiConfig";

export async function fetchSettings(token) {
  const res = await fetch(`${BASE_URL}/auth/settings/`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  return res.json();
}

export const updateSettings = async (formData, token) => {
  try {
    const res = await fetch(`${BASE_URL}/auth/settings/`, {
      method: 'PUT', // or 'POST' if your backend expects POST
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set 'Content-Type' header when sending FormData!
      },
      body: formData,
    });
    const data = await res.json();
    return { success: res.ok, data };
  } catch (err) {
    return { success: false, error: err };
  }
};