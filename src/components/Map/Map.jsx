import { useEffect, useState } from 'react';

export default function Map() {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // 1. 지도 최초 초기화
  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        const container = document.getElementById('map');
        const options = {
          center: new window.kakao.maps.LatLng(37.581789, 127.010369), // 한성대학교
          level: 3,
        };
        const mapInstance = new window.kakao.maps.Map(container, options);
        setMap(mapInstance);
      });
    }
  }, []);

  // 2. 검색 제출 처리 함수/
  const handleSearch = (e) => {
    e.preventDefault();
    if (!keyword.trim()) {
      alert('검색어를 입력해 주세요!');
      return;
    }

    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      alert('카카오 지도 라이브러리가 로드되지 않았습니다.');
      return;
    }

    // 장소 검색 객체 생성
    const ps = new window.kakao.maps.services.Places();

    // 키워드로 장소검색 요청
    ps.keywordSearch(keyword, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setPlaces(data); // 검색 결과 목록 저장
      } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
        alert('검색 결과가 존재하지 않습니다.');
        setPlaces([]);
      } else if (status === window.kakao.maps.services.Status.ERROR) {
        alert('검색 중 오류가 발생했습니다.');
      }
    });
  };

  // 3. 목록 항목 클릭 시 해당 위치로 지도 이동 및 마커 표시
  const handleSelectPlace = (place) => {
    if (!map) return;

    const moveLatLon = new window.kakao.maps.LatLng(place.y, place.x);

    // 지도 중심 이동 및 확대 레벨 조정
    map.setCenter(moveLatLon);
    map.setLevel(3);

    // 기존 마커 지우고 새 마커 생성
    if (marker) {
      marker.setMap(null);
    }

    const newMarker = new window.kakao.maps.Marker({
      position: moveLatLon,
    });
    newMarker.setMap(map);
    setMarker(newMarker);

    setSelectedPlace(place);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* 🔍 검색창 폼 */}
      <form
        onSubmit={handleSearch}
        style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="건물명이나 상호명을 입력하세요 (예: 한성대학교, 스타벅스)"
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '15px',
            border: '1px solid #ccc',
            borderRadius: '8px',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '12px 20px',
            fontSize: '15px',
            backgroundColor: '#FEE500',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}>
          검색
        </button>
      </form>

      {/* 🗺️ 지도 영역 */}
      <div
        id="map"
        style={{
          width: '100%',
          height: '400px',
          borderRadius: '12px',
          border: '1px solid #ccc',
          marginBottom: '20px',
        }}></div>

      {/* 📌 선택한 장소 정보 표시 */}
      {selectedPlace && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#eef6ff',
            borderRadius: '8px',
            marginBottom: '15px',
            border: '1px solid #b6d4fe',
          }}>
          🎯 <strong>선택된 위치:</strong> {selectedPlace.place_name} (
          {selectedPlace.address_name})
        </div>
      )}

      {/* 📜 검색 결과 목록 */}
      {places.length > 0 && (
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
          <h4
            style={{
              margin: 0,
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #ddd',
            }}>
            검색 결과 목록 ({places.length}건)
          </h4>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              maxHeight: '250px',
              overflowY: 'auto',
            }}>
            {places.map((place) => (
              <li
                key={place.id}
                onClick={() => handleSelectPlace(place)}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  backgroundColor:
                    selectedPlace?.id === place.id ? '#f0f0f0' : '#fff',
                }}>
                <div
                  style={{
                    fontWeight: 'bold',
                    fontSize: '15px',
                    color: '#333',
                  }}>
                  {place.place_name}
                </div>
                <div
                  style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                  {place.road_address_name || place.address_name}
                </div>
                {place.phone && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#888',
                      marginTop: '2px',
                    }}>
                    📞 {place.phone}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
