import API_BASE_URL from "./apiConfig";

export async function fetchAccountStatement({ buyer_name, buyer_address, buyer_gst, from_date, to_date }) {
  const token = localStorage.getItem("access_token");
  const params = new URLSearchParams({ buyer_name, buyer_address, buyer_gst });
  if (from_date) params.append("from_date", from_date);
  if (to_date) params.append("to_date", to_date);
  const res = await fetch(`${API_BASE_URL}/accounts/statement/?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch statement");
  return await res.json();
} 