// src/pages/home/HomePage.jsx — 지도 범위·카테고리별 모임 조회와 모임 목록 표시
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiBell,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiImage,
  FiMapPin,
  FiPlus,
} from 'react-icons/fi';
import { getMeetings } from '../../api/meetings.js';
import MeetingMap from '../../components/map/MeetingMap.jsx';
import FavoritesSheet from '../favorites/FavoritesSheet.jsx';
import './HomePage.css';

const CATEGORIES = [
  '전체',
  '운동',
  '카페',
  '맛집',
  '전시',
  '보드게임',
  '스터디',
  '기타',
];
// 모임 날짜의 다음 날 00:00부터 홈 지도와 목록에서만 숨깁니다.
// 서버 데이터는 삭제하지 않으므로 마이페이지의 모임 기록은 유지됩니다.
function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isMeetingVisibleOnHome(meeting, today) {
  const startsAt = meeting.startsAt ?? meeting.date;
  // 날짜 정보가 없으면 잘못된 데이터 삭제로 이어지지 않도록 그대로 둡니다.
  if (!startsAt) return true;
  const match = String(startsAt).match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return true;
  // 날짜가 같은 날까지는 표시하고 다음 날부터 숨깁니다.
  return match[1] >= today;
}

function PinIcon() {
  return <FiMapPin aria-hidden="true" />;
}

function MeetingCard({ meeting, selected, onSelect }) {
  const placeName = meeting.placeName ?? meeting.place ?? '장소 미정';
  const startsAt = meeting.startsAt ?? meeting.date;
  const formattedStartsAt = startsAt
    ? String(startsAt).replace('T', ' ').slice(0, 16)
    : '일정 미정';
  const distance = Number(meeting.distance);
  const hasDistance =
    meeting.distance !== null &&
    meeting.distance !== undefined &&
    Number.isFinite(distance);

  return (
    <button
      className={`home-meeting-card${selected ? ' is-selected' : ''}`}
      onClick={onSelect}>
      <span className="home-meeting-image" aria-hidden="true">
        <FiImage aria-hidden="true" />
      </span>
      <span className="home-meeting-info">
        <span className="home-meeting-meta">
          <span>{meeting.category}</span>
          <i>·</i>
          <b>모집중</b>
          {hasDistance && (
            <span className="home-distance">{distance.toFixed(1)}km</span>
          )}
        </span>
        <strong>{meeting.title}</strong>
        <span className="home-detail-line">
          <PinIcon />
          {placeName}
        </span>
        <span className="home-detail-line">
          <FiClock aria-hidden="true" />
          {formattedStartsAt}
        </span>
        <span className="home-meeting-members">
          {meeting.currentMembers != null
            ? `${meeting.currentMembers} / ${meeting.maxMembers}명`
            : `최대 ${meeting.maxMembers ?? '-'}명`}
          <span>모임 보기 <FiChevronRight aria-hidden="true" /></span>
        </span>
      </span>
    </button>
  );
}

export default function HomePage({
  userName,
  token,
  onCreateTap,
  onLocationSelect,
  onMeetingSelect,
  favoritesOpen = false,
  favoriteMeetings = [],
  favoritesError = '',
  onCloseFavorites,
  onToggleFavorite,
}) {
  const [category, setCategory] = useState('전체');
  const [today, setToday] = useState(getTodayDateKey);
  const [searchBounds, setSearchBounds] = useState(null);
  const [searchVersion, setSearchVersion] = useState(0);

  const [allMeetings, setAllMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [meetingsError, setMeetingsError] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [listExpanded, setListExpanded] = useState(false);
  const [listHidden, setListHidden] = useState(false);
  const [address, setAddress] = useState('서울시 중랑구 면목동');
  const [notice, setNotice] = useState('');
  const panelDrag = useRef({ startY: 0, moved: false });

  // 날짜가 바뀌는 자정에 마커와 목록을 다시 필터링합니다.
  useEffect(() => {
    let midnightTimer;
    const refreshDate = () => setToday(getTodayDateKey());
    const scheduleNextMidnight = () => {
      window.clearTimeout(midnightTimer);
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      midnightTimer = window.setTimeout(() => {
        refreshDate();
        scheduleNextMidnight();
      }, nextMidnight.getTime() - now.getTime() + 100);
    };
    const checkOnReturn = () => {
      refreshDate();
      scheduleNextMidnight();
    };
    scheduleNextMidnight();
    window.addEventListener('focus', checkOnReturn);
    document.addEventListener('visibilitychange', checkOnReturn);
    return () => {
      window.clearTimeout(midnightTimer);
      window.removeEventListener('focus', checkOnReturn);
      document.removeEventListener('visibilitychange', checkOnReturn);
    };
  }, []);

  // 검색 버튼을 누른 시점의 지도 범위를 조회합니다.
  // 카테고리/찜 변경은 이미 받은 데이터로 즉시 필터링/마커 색상 갱신합니다.
  useEffect(() => {
    if (!searchBounds) return undefined;

    let isCurrentRequest = true;
    const controller = new AbortController();

    getMeetings(token, {
      bounds: searchBounds,
      category: '전체',
      signal: controller.signal,
    })
      .then((result) => {
        const meetingList = Array.isArray(result) ? result : result?.meetings;
        if (!Array.isArray(meetingList)) {
          throw new Error('백엔드 응답이 모임 목록 형식이 아닙니다.');
        }
        if (isCurrentRequest) setAllMeetings(meetingList);
      })
      .catch((error) => {
        if (isCurrentRequest && error?.name !== 'AbortError') {
          setMeetingsError(error instanceof Error ? error.message : '모임 목록을 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (isCurrentRequest) setMeetingsLoading(false);
      });

    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [token, searchBounds, searchVersion]);

  const handleSearchArea = useCallback((bounds) => {
    setMeetingsLoading(true);
    setMeetingsError('');
    setAllMeetings([]);
    setSelectedMeeting(null);
    setListHidden(false);
    setSearchBounds(bounds);
    // 같은 범위에서 다시 눌러도 서버를 재조회합니다.
    setSearchVersion((version) => version + 1);
  }, []);

  const meetings = useMemo(() => {
    if (!searchBounds) return [];
    return allMeetings.filter((meeting) => {
      if (!isMeetingVisibleOnHome(meeting, today)) return false;
      const matchesCategory = category === '전체' || meeting.category === category;
      const lat = Number(meeting.latitude);
      const lng = Number(meeting.longitude);
      const hasCoordinates = meeting.latitude != null && meeting.longitude != null
        && Number.isFinite(lat) && Number.isFinite(lng);
      const withinBounds = hasCoordinates
        && lat >= searchBounds.south && lat <= searchBounds.north
        && lng >= searchBounds.west && lng <= searchBounds.east;
      return matchesCategory && withinBounds;
    });
  }, [allMeetings, category, searchBounds, today]);

  const favoriteMeetingIds = useMemo(
    () => favoriteMeetings.map((meeting) => String(meeting.id)),
    [favoriteMeetings],
  );

  const displayedMeetings = selectedMeeting
    ? meetings.filter((meeting) => meeting.id === selectedMeeting.id)
    : meetings;

  function handlePanelPointerDown(event) {
    panelDrag.current = { startY: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePanelPointerUp(event) {
    const distance = event.clientY - panelDrag.current.startY;
    if (Math.abs(distance) > 24) {
      panelDrag.current.moved = true;
      if (distance < 0) {
        setListHidden(false);
        setListExpanded(true);
      } else if (listExpanded) {
        setListExpanded(false);
      } else {
        setListHidden(true);
      }
      window.setTimeout(() => {
        panelDrag.current.moved = false;
      }, 0);
    }
  }

  function togglePanel() {
    if (panelDrag.current.moved) {
      panelDrag.current.moved = false;
      return;
    }
    setListExpanded((expanded) => !expanded);
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-top">
          <div>
            <span className="home-location-caption">현재 위치 기준</span>
            <button
              className="home-location"
              onClick={() =>
                setAddress(
                  address === '서울시 중랑구 면목동'
                    ? '서울시 중랑구 상봉동'
                    : '서울시 중랑구 면목동',
                )
              }>
              <PinIcon />
              {address}
              <FiChevronDown className="home-chevron" aria-hidden="true" />
            </button>
          </div>
          <div className="home-header-actions">
            <button aria-label="새 모임 만들기" onClick={onCreateTap}>
              <FiPlus aria-hidden="true" />
            </button>
            <button
              aria-label="알림"
              onClick={() => setNotice('아직 새로운 알림이 없어요.')}>
              <FiBell aria-hidden="true" />
              <i />
            </button>
          </div>
        </div>
        <h1>{userName || '하민'}님, 오늘은 어디에서 함께할까요?</h1>
        <div className="home-categories" aria-label="모임 카테고리">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              aria-pressed={category === item}
              className={category === item ? 'active' : ''}
              onClick={() => {
                setCategory(item);
                setSelectedMeeting(null);
              }}>
              {item}
            </button>
          ))}
        </div>
      </header>

      <main className="home-content">
        {/* 지도 화면에 출력 */}
        <section className="home-map" aria-label="지도 영역">
          {/* 지도 컴포넌트 */}
          <MeetingMap
            meetings={meetings}
            favoriteMeetingIds={favoriteMeetingIds}
            onLocationSelect={onLocationSelect}
            onSearchArea={handleSearchArea}
            onMeetingSelect={onMeetingSelect}
            searching={meetingsLoading}
          />
        </section>

        {/* 모임 카드 영역 */}
        <section
          className={`home-list-panel${listExpanded ? ' expanded' : ''}${listHidden ? ' hidden' : ''}`}
          aria-hidden={listHidden}>
          {/* 모임 카드 접고 펴는 버튼 */}
          <button
            type="button"
            className="home-panel-handle"
            aria-label={
              listExpanded ? '주변 모임 목록 접기' : '주변 모임 목록 펼치기'
            }
            aria-expanded={listExpanded}
            onPointerDown={handlePanelPointerDown}
            onPointerUp={handlePanelPointerUp}
            onClick={togglePanel}>
            <span />
          </button>
          {/* 모임 카드 헤더 */}
          <div className="home-list-heading">
            <div>
              <h2>
                {selectedMeeting ? '선택한 모임' : '내 주변 모임'}{' '}
                <span>{meetings.length}</span>
              </h2>
              <p>가까운 곳에서, 새로운 만남을 시작해요</p>
            </div>
            <button onClick={() => setNotice('모임 정렬은 준비 중입니다.')}>
              최신순 ⌄
            </button>
          </div>
          {/* 모임 카드 필터링 영역 */}
          <div className="home-meeting-list">
            {/* 저장한 데이터 모임카드에 전달 */}
            {displayedMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                selected={selectedMeeting?.id === meeting.id}
                onSelect={() => onMeetingSelect(meeting)}
              />
            ))}
            {meetingsLoading && (
              <p className="home-empty">모임 목록을 불러오는 중이에요.</p>
            )}
            {!meetingsLoading && meetingsError && (
              <p className="home-empty">{meetingsError}</p>
            )}
            {!meetingsLoading && !meetingsError && meetings.length === 0 && (
              <p className="home-empty">아직 등록된 모임이 없어요.</p>
            )}
          </div>
        </section>
        {/* 모임 카드 리스트 안보이게 하기 (지도 전체화면) */}
        {listHidden && (
          <button
            type="button"
            className="home-list-reopen"
            onClick={() => {
              setListHidden(false);
              setListExpanded(false);
            }}>
            <span>주변 모임</span>
            <span aria-hidden="true">⌃</span>
          </button>
        )}
      </main>
      {notice && (
        <div role="status" className="home-toast">
          <span>{notice}</span>
          <button aria-label="닫기" onClick={() => setNotice('')}>
            ×
          </button>
        </div>
      )}
      {favoritesOpen && (
        <FavoritesSheet
          meetings={favoriteMeetings}
          errorMessage={favoritesError}
          onClose={onCloseFavorites}
          onMeetingSelect={onMeetingSelect}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </div>
  );
}
