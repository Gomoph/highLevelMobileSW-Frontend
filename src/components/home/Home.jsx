import { useEffect, useMemo, useRef, useState } from 'react';
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
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 10c0 5.5-8 12-8 12S4 15.5 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
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
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {formattedStartsAt}
        </span>
        <span className="home-meeting-members">
          {meeting.currentMembers != null
            ? `${meeting.currentMembers} / ${meeting.maxMembers}명`
            : `최대 ${meeting.maxMembers ?? '-'}명`}
          <span>모임 보기 ›</span>
        </span>
      </span>
    </button>
  );
}

export default function Home({
  userName,
  token,
  onCreateTap,
  onLocationSelect,
}) {
  const [category, setCategory] = useState('전체');

  const [allMeetings, setAllMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [meetingsError, setMeetingsError] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [listExpanded, setListExpanded] = useState(false);
  const [listHidden, setListHidden] = useState(false);
  const [address, setAddress] = useState('서울시 중랑구 면목동');
  const [notice, setNotice] = useState('');
  const panelDrag = useRef({ startY: 0, moved: false });

  useEffect(() => {
    let isCurrentRequest = true;

    getMeetings(token)
      .then((result) => {
        const meetingList = Array.isArray(result) ? result : result?.meetings;

        if (!Array.isArray(meetingList)) {
          throw new Error('백엔드 응답이 모임 목록 형식이 아닙니다.');
        }

        if (isCurrentRequest) setAllMeetings(meetingList);
      })
      .catch((error) => {
        if (isCurrentRequest) {
          setMeetingsError(
            error instanceof Error
              ? error.message
              : '모임 목록을 불러오지 못했습니다.',
          );
        }
      })
      .finally(() => {
        if (isCurrentRequest) setMeetingsLoading(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [token]);

  const meetings = useMemo(
    () =>
      allMeetings.filter((meeting) => {
        const matchesCategory =
          category === '전체' || meeting.category === category;
        return matchesCategory;
      }),
    [allMeetings, category],
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
            {displayedMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                selected={selectedMeeting?.id === meeting.id}
                onSelect={() => setSelectedMeeting(meeting)}
              />
            ))}
            {meetingsLoading && (
              <p className="home-empty">모임 목록을 불러오는 중이에요.</p>
            )}
            {!meetingsLoading && meetingsError && (
              <p className="home-empty">{meetingsError}</p>
            )}
            {!meetingsLoading && !meetingsError && meetings.length === 0 && (
              <p className="home-empty">
                아직 등록된 모임이 없어요.
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
