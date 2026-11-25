const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function readError(response, fallbackMessage) {
  const body = await response.json().catch(() => null);
  return new Error(body?.message || body?.error || fallbackMessage);
}

// 마이페이지 프로필 불러오기
export async function getMyProfile(token) {
  const response = await fetch(`${API_BASE_URL}/api/members/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw await readError(response, `회원 정보를 불러오지 못했습니다. (${response.status})`);
  }

  return response.json();
}

export async function updateMyProfile(token, profile) {
  const response = await fetch(`${API_BASE_URL}/api/members/me`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: profile.name,
      address: profile.address,
      addressDetail: profile.addressDetail,
      introduction: profile.introduction,
      mapLocationAddress: profile.mapLocationAddress,
      locationLatitude: profile.locationLatitude,
      locationLongitude: profile.locationLongitude,
    }),
  });

  if (!response.ok) {
    throw await readError(response, `프로필을 저장하지 못했습니다. (${response.status})`);
  }

  return response.json();
}
