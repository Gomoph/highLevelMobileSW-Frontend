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

  // bounds가 있으면 주변 목록 API, 없으면 전체 목록 API를 호출하도록 나누기
  const path = bounds ? '/api/meetings/nearby' : '/api/meetings';

  // 현재 위치에서 검색 버튼 클릭 시 백엔드에 데이터 전달하는 코드
  const response = await fetch(
    `${API_BASE_URL}${path}${query ? `?${query}` : ''}`,
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

// 내가 만든 모임 목록
export async function getMyMeetings(token) {
  const response = await fetch(`${API_BASE_URL}/api/meetings/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`내 모임을 불러오지 못했습니다. (${response.status})`);
  }

  return response.json();
}

// 공유 링크로 진입한 모임 상세 정보
export async function getMeetingById(meetingId) {
  const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}`);

  if (!response.ok) {
    throw new Error(`모임 정보를 불러오지 못했습니다. (${response.status})`);
  }

  return response.json();
}

async function requestParticipation(token, meetingId, method = 'GET') {
  const response = await fetch(
    `${API_BASE_URL}/api/meetings/${meetingId}/participation`,
    {
      method,
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      result?.message || result?.detail || `참여 정보를 처리하지 못했습니다. (${response.status})`,
    );
  }

  return result;
}

export function getMeetingParticipation(token, meetingId) {
  return requestParticipation(token, meetingId);
}

export function joinMeeting(token, meetingId) {
  return requestParticipation(token, meetingId, 'POST');
}

export function leaveMeeting(token, meetingId) {
  return requestParticipation(token, meetingId, 'DELETE');
}
