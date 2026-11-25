import { useEffect, useRef, useState } from 'react';
import { FiMapPin, FiRefreshCw, FiTarget } from 'react-icons/fi';
import './MeetingMap.css';

export default function MeetingMap({
  meetings = [],
  favoriteMeetingIds = [],
  onLocationSelect,
  onSearchArea,
  onMeetingSelect,
  searching = false,
}) {
  const [map, setMap] = useState(null);

  // 사용자가 선택한 장소의 마커
  const markerRef = useRef(null);

  // 등록된 모임들의 마커
  const meetingMarkersRef = useRef([]);

  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  const [keyword, setKeyword] = useState('');
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');

  // 최신 콜백을 보관하여 지도 재생성 방지
  const onLocationSelectRef = useRef(onLocationSelect);
  const onSearchAreaRef = useRef(onSearchArea);
  const onMeetingSelectRef = useRef(onMeetingSelect);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
    onSearchAreaRef.current = onSearchArea;
    onMeetingSelectRef.current = onMeetingSelect;
  }, [onLocationSelect, onSearchArea, onMeetingSelect]);


  // 1. 카카오 지도 최초 초기화
  useEffect(() => {
    if (!window.kakao?.maps) {
      console.error('카카오맵 SDK를 불러오지 못했습니다.');
      return;
    }

    let isMounted = true;
    let mapInstance = null;

    window.kakao.maps.load(() => {
      if (!isMounted || !mapContainerRef.current) return;

      const options = {
        center: new window.kakao.maps.LatLng(37.581789, 127.010369),
        level: 3,
      };

      mapInstance = new window.kakao.maps.Map(mapContainerRef.current, options);
      mapRef.current = mapInstance;
      setMap(mapInstance);

      // 초기 진입 때 현재 지도 영역의 모임을 한 번 조회합니다.
      const bounds = mapInstance.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      onSearchAreaRef.current?.({
        south: sw.getLat(), west: sw.getLng(),
        north: ne.getLat(), east: ne.getLng(),
      });

      // 지도 빈 곳 클릭 시 마커를 생성하지 않습니다.
      // 장소 검색 목록을 선택했을 때의 표시 기능은 아래 handleSelectPlace에 유지합니다.
    });

    return () => {
      isMounted = false;
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      meetingMarkersRef.current.forEach((marker) => marker.setMap(null));
      meetingMarkersRef.current = [];
      mapRef.current = null;
    };
  }, []);


  // 2. 지도 범위에 있는 모임의 마커를 생성합니다.
  // 찜에 포함된 모임만 빨간색이고, 그 외에는 파란색입니다.
  useEffect(() => {
    if (!map) return undefined;

    // 먼저 이전 마커를 지워 중복 표시를 방지합니다.
    meetingMarkersRef.current.forEach((marker) => marker.setMap(null));
    meetingMarkersRef.current = [];

    const kakao = window.kakao;
    const blueImage = new kakao.maps.MarkerImage(
  '/markers/blueMarker.png',
  new kakao.maps.Size(40, 40),
  { offset: new kakao.maps.Point(20, 36) }
);
    const redImage = new kakao.maps.MarkerImage(
  '/markers/redMarker.png',
  new kakao.maps.Size(40, 40),
  { offset: new kakao.maps.Point(20, 36) }
);

    const favoriteIds = new Set(favoriteMeetingIds.map(String));
    const newMarkers = [];

    meetings.forEach((meeting) => {
      if (meeting.latitude == null || meeting.longitude == null) return;
      const latitude = Number(meeting.latitude);
      const longitude = Number(meeting.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(latitude, longitude),
        map,
        image: favoriteIds.has(String(meeting.id)) ? redImage : blueImage,
        title: meeting.title ?? '',
      });

      kakao.maps.event.addListener(marker, 'click', () => {
        onMeetingSelectRef.current?.(meeting);
      });
      newMarkers.push(marker);
    });

    meetingMarkersRef.current = newMarkers;
    return () => {
      newMarkers.forEach((marker) => marker.setMap(null));
      if (meetingMarkersRef.current === newMarkers) meetingMarkersRef.current = [];
    };
  }, [map, meetings, favoriteMeetingIds]);


  // 3. 장소 검색
  const handleSearch = (e) => {
    e.preventDefault();

    if (!keyword.trim()) {
      alert('검색어를 입력해 주세요!');
      return;
    }

    if (!window.kakao?.maps?.services) {
      alert('카카오 지도 라이브러리가 로드되지 않았습니다.');
      return;
    }

    const ps = new window.kakao.maps.services.Places();

    ps.keywordSearch(keyword, (data, status) => {
      if (
        status ===
        window.kakao.maps.services.Status.OK
      ) {
        setPlaces(data);
      } else if (
        status ===
        window.kakao.maps.services.Status.ZERO_RESULT
      ) {
        alert('검색 결과가 존재하지 않습니다.');
        setPlaces([]);
      } else {
        alert('검색 중 오류가 발생했습니다.');
      }
    });
  };


  // 4. 검색 결과에서 장소 선택
  const handleSelectPlace = (place) => {
    if (!map) return;

    const moveLatLon = new window.kakao.maps.LatLng(
      Number(place.y),
      Number(place.x)
    );

    // 선택한 장소로 지도 이동
    map.setCenter(moveLatLon);
    map.setLevel(3);

    // 기존 선택 마커 제거
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    const newMarker = new window.kakao.maps.Marker({
      position: moveLatLon,
      map,
    });

    markerRef.current = newMarker;

    setSelectedPlace(place);
    setSelectedAddress('');

    onLocationSelectRef.current?.({
      placeName: place.place_name,
      latitude: Number(place.y),
      longitude: Number(place.x),
    });
  };


  // 5. 현재 지도 범위에서 모임 검색
  const handleSearchArea = () => {
    if (!map || searching) return;

    // 현재 화면에 보이는 지도 좌표 가져오기
    const bounds = map.getBounds();

    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    // HomePage로 범위 전달
    onSearchAreaRef.current?.({
      south: southWest.getLat(),
      west: southWest.getLng(),
      north: northEast.getLat(),
      east: northEast.getLng(),
    });
  };


  return (
    <div className="map-container">

      {/* 장소 검색창 */}
      <form
        onSubmit={handleSearch}
        className="map-search-form"
      >
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="건물명이나 상호명을 입력하세요 (예: 한성대학교)"
          className="map-search-input"
        />

        <button
          type="submit"
          className="map-search-button"
        >
          검색
        </button>
      </form>


      {/* 지도 영역 */}
      <div className="map-viewport">

        <div
          ref={mapContainerRef}
          id="map"
          className="map-canvas"
        />

        {/* 현재 지도에서 모임 검색 */}
        <button
          type="button"
          className="map-area-search-button"
          onClick={handleSearchArea}
          disabled={!map || searching}
          aria-busy={searching}
        >
          <FiRefreshCw aria-hidden="true" />

          <span>
            {searching
              ? '검색 중…'
              : '이 지도에서 검색'}
          </span>
        </button>
      </div>


      {/* 선택된 장소 정보 */}
      {selectedPlace && (
        <div className="map-selection-info">
          <FiTarget aria-hidden="true" /> <strong>선택된 위치:</strong>{' '}
          {selectedPlace.place_name} (
          {selectedPlace.road_address_name ||
            selectedPlace.address_name})
        </div>
      )}

      {selectedAddress && (
        <div className="map-selection-info">
          <FiMapPin aria-hidden="true" /> <strong>선택한 주소:</strong>{' '}
          {selectedAddress}
        </div>
      )}


      {/* 장소 검색 결과 목록 */}
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
                className={`map-result-item${
                  selectedPlace?.id === place.id
                    ? ' is-selected'
                    : ''
                }`}
              >
                <div className="map-place-name">
                  {place.place_name}
                </div>

                <div className="map-place-address">
                  {place.road_address_name ||
                    place.address_name}
                </div>

                {place.phone && (
                  <div className="map-place-phone">
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
