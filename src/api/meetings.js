const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// 모임 등록
export async function createMeeting({ token, meeting }) {
  const formData = new FormData();
  formData.append(
    'meeting',
    new Blob([JSON.stringify(meeting)], { type: 'application/json' }),
  );

  const response = await fetch(`${API_BASE_URL}/api/meetings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
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

// 목록 조회
export async function getMeetings(token, { bounds, category, signal } = {}) {
  const params = new URLSearchParams();
  if (bounds) {
    for (const key of ['south', 'north', 'west', 'east']) {
      params.set(key, String(bounds[key]));
    }
  }
  if (category && category !== '전체') params.set('category', category);
  const query = params.toString();

  // 현재 위치에서 검색 버튼 클릭 시 백엔드에 데이터 전달하는 코드
  const response = await fetch(
    `${API_BASE_URL}/api/meetings${query ? `?${query}` : ''}`,
    {
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`모임 목록을 불러오지 못했습니다. (${response.status})`);
  }

  return response.json();
}
