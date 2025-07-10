const API_URL = "http://localhost:8000/api/auth/settings/"; // Adjust if your endpoint is different

export async function fetchSettings(token) {
  const res = await fetch(API_URL, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function updateSettings(data, token) {
  const formData = new FormData();
  for (const key in data) {
    if (key === "HSN_codes") {
      formData.append(key, JSON.stringify(data[key]));
    } else if (key === "logo" && data.logo instanceof File) {
      formData.append("logo", data.logo);
    } else if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  }
  const res = await fetch(API_URL, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });
  return res.json();
}