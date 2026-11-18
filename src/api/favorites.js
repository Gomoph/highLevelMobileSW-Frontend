const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function throwApiError(response, fallbackMessage) {
  const body = await response.json().catch(() => null);
  throw new Error(body?.message || body?.error || fallbackMessage);
}

export async function getFavoriteMeetings(token) {
  const response = await fetch(`${API_BASE_URL}/api/favorites`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    await throwApiError(response, `찜 목록을 불러오지 못했습니다. (${response.status})`);
  }

  return response.json();
}

export async function addFavoriteMeeting(token, meetingId) {
  const response = await fetch(`${API_BASE_URL}/api/favorites/${meetingId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    await throwApiError(response, `찜 목록에 저장하지 못했습니다. (${response.status})`);
  }
}

export async function removeFavoriteMeeting(token, meetingId) {
  const response = await fetch(`${API_BASE_URL}/api/favorites/${meetingId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    await throwApiError(response, `찜을 해제하지 못했습니다. (${response.status})`);
  }
}
