import { useEffect, useRef, useState } from 'react';
import './Map.css';

export default function Map({
  onLocationSelect,
  onSearchArea,
  searching = false,
}) {
  const [map, setMap] = useState(null);
  const markerRef = useRef(null);
  const [keyword, setKeyword] = useState('');
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');

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
        const geocoder = new window.kakao.maps.services.Geocoder();

        window.kakao.maps.event.addListener(mapInstance, 'click', (e) => {
          const position = e.latLng;
          const latitude = position.getLat();
          const longitude = position.getLng();

          if (markerRef.current) {
            markerRef.current.setMap(null);
          }

          const nextMarker = new window.kakao.maps.Marker({ position });
          nextMarker.setMap(mapInstance);
          markerRef.current = nextMarker;
          setSelectedPlace(null);
          setSelectedAddress('주소를 찾는 중…');

          // 카카오 역지오코딩은 경도, 위도 순서로 좌표를 받습니다.
          // (위도, 경도) => 장소 이름 변환
          geocoder.coord2Address(longitude, latitude, (result, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const placeName =
                result[0]?.road_address?.address_name ||
                result[0]?.address?.address_name ||
                '';

              setSelectedAddress(placeName || '주소를 찾을 수 없습니다.');
              onLocationSelect?.({ latitude, longitude, placeName });
              return;
            }

            setSelectedAddress('주소를 찾을 수 없습니다.');
            onLocationSelect?.({ latitude, longitude });
          });
        });
      });
    }
  }, [onLocationSelect]);

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
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    const newMarker = new window.kakao.maps.Marker({
      position: moveLatLon,
    });
    newMarker.setMap(map);
    markerRef.current = newMarker;

    setSelectedPlace(place);
    setSelectedAddress('');
    // 검색 결과 전달하는 값
    onLocationSelect?.({
      placeName: place.place_name,
      latitude: Number(place.y),
      longitude: Number(place.x),
    });
  };

  const handleSearchArea = () => {
    if (!map || searching) return;
    // 현재 지도의 좌표 가져오는 코드
    const bounds = map.getBounds();
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    // 지도에서 얻은 좌표를 Home.jsx로 전달하는 코드
    onSearchArea?.({
      south: southWest.getLat(),
      west: southWest.getLng(),
      north: northEast.getLat(),
      east: northEast.getLng(),
    });
  };

  return (
    <div className="map-container">
      {/* 🔍 검색창 폼 */}
      <form onSubmit={handleSearch} className="map-search-form">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="건물명이나 상호명을 입력하세요 (예: 한성대학교 )"
          className="map-search-input"
        />
        <button type="submit" className="map-search-button">
          검색
        </button>
      </form>

      {/* 🗺️ 지도 영역 */}
      <div className="map-viewport">
        <div id="map" className="map-canvas"></div>
        <button
          type="button"
          className="map-area-search-button"
          onClick={handleSearchArea}
          disabled={!map || searching}
          aria-busy={searching}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20 7v5h-5M20 12a8 8 0 1 1-2.34-5.66L20 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{searching ? '검색 중…' : '현 지도에서 검색'}</span>
        </button>
      </div>

      {/* 📌 선택한 장소 정보 표시 */}
      {selectedPlace && (
        <div className="map-selection-info">
          🎯 <strong>선택된 위치:</strong> {selectedPlace.place_name} (
          {selectedPlace.road_address_name || selectedPlace.address_name})
        </div>
      )}

      {selectedAddress && (
        <div className="map-selection-info">
          📍 <strong>선택한 주소:</strong> {selectedAddress}
        </div>
      )}

      {/* 📜 검색 결과 목록 */}
      {places.length > 0 && (
        <div className="map-results">
          <h4 className="map-results-heading">
            검색 결과 목록 ({places.length}건)
          </h4>
          <ul className="map-results-list">
            {places.map((place) => (
              <li
                key={place.id}
                onClick={() => handleSelectPlace(place)}
                className={`map-result-item${selectedPlace?.id === place.id ? ' is-selected' : ''}`}>
                <div className="map-place-name">{place.place_name}</div>
                <div className="map-place-address">
                  {place.road_address_name || place.address_name}
                </div>
                {place.phone && (
                  <div className="map-place-phone">📞 {place.phone}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
