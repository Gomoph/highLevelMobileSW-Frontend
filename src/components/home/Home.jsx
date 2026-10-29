import { useMemo, useRef, useState } from 'react';
import { getMeetings } from '../../api/meetings.js';
import Map from '../Map/Map.jsx';
import './Home.css';

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
const MEETINGS = [
  {
    id: 1,
    title: '보드게임 같이 할 사람',
    category: '보드게임',
    place: '상봉역 보드게임카페',
    date: '오늘 18:30',
    members: '2 / 5명',
    distance: 1.2,
  },
  {
    id: 2,
    title: '저녁 러닝, 가볍게 함께해요',
    category: '운동',
    place: '중랑천 산책로',
    date: '오늘 19:00',
    members: '3 / 6명',
    distance: 0.4,
  },
  {
    id: 3,
    title: '커피 한 잔, 동네 친구 만들기',
    category: '카페',
    place: '면목역 카페 모퉁이',
    date: '내일 14:00',
    members: '2 / 4명',
    distance: 0.6,
  },
  {
    id: 4,
    title: '퇴근 후 함께 집중하는 스터디',
    category: '스터디',
    place: '사가정역 스터디카페',
    date: '오늘 20:00',
    members: '3 / 4명',
    distance: 0.8,
  },
  {
    id: 5,
    title: '동네 숨은 맛집 탐방',
    category: '맛집',
    place: '면목동 골목식당',
    date: '내일 12:00',
    members: '2 / 5명',
    distance: 0.3,
  },
  {
    id: 6,
    title: '작은 전시, 함께 감상해요',
    category: '전시',
    place: '중랑아트센터',
    date: '내일 15:00',
    members: '2 / 6명',
    distance: 1.5,
  },
  {
    id: 7,
    title: '주말 동네 산책 메이트',
    category: '기타',
    place: '면목체육공원',
    date: '내일 10:00',
    members: '2 / 4명',
    distance: 0.9,
  },
];

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 10c0 5.5-8 12-8 12S4 15.5 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function MeetingCard({ meeting, selected, onSelect }) {
  return (
    <button
      className={`home-meeting-card${selected ? ' is-selected' : ''}`}
      onClick={onSelect}>
      <span className="home-meeting-image" aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <rect x="7" y="7" width="34" height="34" rx="5" />
          <circle cx="18" cy="18" r="3" />
          <path d="m9 35 11-11 7 7 5-5 7 9" />
        </svg>
      </span>
      <span className="home-meeting-info">
        <span className="home-meeting-meta">
          <span>{meeting.category}</span>
          <i>·</i>
          <b>모집중</b>
          <span className="home-distance">{meeting.distance.toFixed(1)}km</span>
        </span>
        <strong>{meeting.title}</strong>
        <span className="home-detail-line">
          <PinIcon />
          {meeting.place}
        </span>
        <span className="home-detail-line">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {meeting.date}
        </span>
        <span className="home-meeting-members">
          {meeting.members}
          <span>모임 보기 ›</span>
        </span>
      </span>
    </button>
  );
}

export default function Home({ userName, onCreateTap, onLocationSelect }) {
  const [category, setCategory] = useState('전체');
  const [query, setQuery] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [listExpanded, setListExpanded] = useState(false);
  const [listHidden, setListHidden] = useState(false);
  const [address, setAddress] = useState('서울시 중랑구 면목동');
  const [notice, setNotice] = useState('');
  const panelDrag = useRef({ startY: 0, moved: false });

  // 미팅 카드
  const meetings = useMemo(
    () =>
      MEETINGS.filter((meeting) => {
        const matchesCategory =
          category === '전체' || meeting.category === category;
        const searchText = `${meeting.title} ${meeting.place} ${meeting.category}`;
        return matchesCategory && searchText.includes(query.trim());
      }),
    [category, query],
  );

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
              <span className="home-chevron">⌄</span>
            </button>
          </div>
          <div className="home-header-actions">
            <button aria-label="새 모임 만들기" onClick={onCreateTap}>
              <span>＋</span>
            </button>
            <button
              aria-label="알림"
              onClick={() => setNotice('아직 새로운 알림이 없어요.')}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
              </svg>
              <i />
            </button>
          </div>
        </div>
        <h1>{userName || '하민'}님, 오늘은 어디에서 함께할까요?</h1>
        <label className="home-search">
          <SearchIcon />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="장소나 지역을 검색해보세요"
            aria-label="모임 검색"
          />
          {query && (
            <button aria-label="검색어 지우기" onClick={() => setQuery('')}>
              ×
            </button>
          )}
        </label>
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
          <Map onLocationSelect={onLocationSelect} />
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
            {(selectedMeeting
              ? meetings.filter((meeting) => meeting.id === selectedMeeting.id)
              : meetings
            ).map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                selected={selectedMeeting?.id === meeting.id}
                onSelect={() => setSelectedMeeting(meeting)}
              />
            ))}
            {meetings.length === 0 && (
              <p className="home-empty">
                검색 결과가 없어요. 다른 장소나 모임을 검색해보세요.
              </p>
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
    </div>
  );
}
