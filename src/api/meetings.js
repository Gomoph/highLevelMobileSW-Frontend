const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export async function createMeeting({ token, meeting }) {
  // fetch로 POST/api/meetings로 전송
  const response = await fetch(`${API_BASE_URL}/api/meetings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(meeting),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      result?.message ||
        result?.error ||
        result?.detail ||
        `모임 등록에 실패했습니다. (${response.status})`,
    );
  }

  return result;
}
