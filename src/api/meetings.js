const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export async function createMeeting({ token, meeting, images = [] }) {
  const body = new FormData();
  body.append(
    'meeting',
    new Blob([JSON.stringify(meeting)], { type: 'application/json' }),
  );
  images.forEach((image) => body.append('images', image));

  const response = await fetch(`${API_BASE_URL}/api/meetings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      result?.message || result?.error || result?.detail || `모임 등록에 실패했습니다. (${response.status})`,
    );
  }

  return result;
}
