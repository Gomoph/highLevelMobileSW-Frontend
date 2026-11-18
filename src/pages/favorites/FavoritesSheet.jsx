import { useMemo, useState } from 'react';
import './FavoritesSheet.css';

const CATEGORIES = ['전체', '운동', '카페', '맛집', '전시', '보드게임', '스터디', '기타'];

function HeartIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={filled ? 'is-filled' : ''}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1 7.8 7.7 7.8-7.7 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    </svg>
  );
}

function CardIcon({ name }) {
  const paths = {
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    people: <><circle cx="9" cy="8" r="3" /><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2M16 5a3 3 0 0 1 0 6M18 14a4 4 0 0 1 4 4v3" /></>,
    down: <path d="m6 9 6 6 6-6" />,
    filter: <><path d="M4 6h16M7 12h10M10 18h4" /><circle cx="8" cy="6" r="1" /><circle cx="15" cy="12" r="1" /></>,
  };

  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function FavoriteMeetingCard({ meeting, onSelect, onRemove }) {
  const startsAt = meeting.startsAt ?? meeting.date;
  const dateLabel = startsAt
    ? String(startsAt).replace('T', ' ').slice(0, 16)
    : '일정 미정';
  const place = meeting.placeName ?? meeting.place ?? '장소 미정';
  const memberCount = meeting.currentMembers ?? meeting.cur;
  const maxMembers = meeting.maxMembers ?? meeting.max;
  const distance = Number(meeting.distance);

  return (
    <article className="favorite-meeting-card">
      <button className="favorite-meeting-main" type="button" onClick={onSelect}>
        <span className="favorite-meeting-image" aria-hidden="true"><CardIcon name="image" /></span>
        <span className="favorite-meeting-info">
          <span className="favorite-meeting-meta">
            <span>{meeting.category ?? meeting.cat ?? '모임'}</span>
            <i>·</i>
            <strong>{meeting.status ?? '모집중'}</strong>
            {Number.isFinite(distance) && <span className="favorite-meeting-distance">{distance.toFixed(1)}km</span>}
          </span>
          <strong className="favorite-meeting-title">{meeting.title ?? '제목 없는 모임'}</strong>
          <span className="favorite-meeting-detail"><CardIcon name="calendar" />{dateLabel}</span>
          <span className="favorite-meeting-place-row">
            <span className="favorite-meeting-detail"><CardIcon name="pin" />{place}</span>
            <span className="favorite-meeting-detail favorite-meeting-members"><CardIcon name="people" />
              {memberCount != null ? `${memberCount}/${maxMembers ?? '-'}명` : `최대 ${maxMembers ?? '-'}명`}
            </span>
          </span>
        </span>
      </button>
      <button
        className="favorite-meeting-remove"
        type="button"
        aria-label={`${meeting.title ?? '모임'} 찜 해제`}
        title="찜 해제"
        onClick={onRemove}
      >
        <HeartIcon filled />
      </button>
    </article>
  );
}

export default function FavoritesSheet({
  meetings = [],
  errorMessage = '',
  onClose,
  onMeetingSelect,
  onToggleFavorite,
}) {
  const [category, setCategory] = useState('전체');
  const [sort, setSort] = useState('최신순');
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  const removeFavorite = async (meeting) => {
    setActionError('');
    try {
      await onToggleFavorite?.(meeting);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '찜을 해제하지 못했어요.');
    }
  };

  const visibleMeetings = useMemo(() => {
    const filtered = meetings.filter((meeting) =>
      category === '전체' || (meeting.category ?? meeting.cat) === category,
    );

    if (sort === '가까운순') {
      return [...filtered].sort((left, right) => {
        const leftDistance = Number(left.distance);
        const rightDistance = Number(right.distance);
        return (Number.isFinite(leftDistance) ? leftDistance : Infinity)
          - (Number.isFinite(rightDistance) ? rightDistance : Infinity);
      });
    }

    // API가 저장 시각 내림차순으로 목록을 반환하므로 기본 정렬은 응답 순서를 유지합니다.
    return filtered;
  }, [category, meetings, sort]);

  return (
    <section className="favorites-sheet" role="dialog" aria-label="찜한 모임">
      <button className="favorites-sheet-handle" type="button" aria-label="찜 목록 닫기" onClick={onClose}>
        <span />
      </button>

      <header className="favorites-sheet-header">
        <div className="favorites-sheet-heading">
          <div>
            <h2>찜한 모임 <span>{meetings.length}</span></h2>
            <p>가까운 곳에서, 새로운 만남을 시작해요</p>
          </div>
          <div className="favorites-sheet-tools">
            <div className="favorites-sort-wrap">
              <button
                className="favorites-sort-button"
                type="button"
                aria-expanded={sortOpen}
                onClick={() => setSortOpen((open) => !open)}
              >
                {sort}<CardIcon name="down" />
              </button>
              {sortOpen && (
                <div className="favorites-sort-menu">
                  {['최신순', '가까운순'].map((option) => (
                    <button key={option} type="button" className={sort === option ? 'is-active' : ''} onClick={() => { setSort(option); setSortOpen(false); }}>
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className={`favorites-filter-button${filterOpen || category !== '전체' ? ' is-active' : ''}`}
              type="button"
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen((open) => !open)}
            >
              <CardIcon name="filter" />필터
            </button>
          </div>
        </div>
        {filterOpen && (
          <div className="favorites-category-list" aria-label="카테고리 필터">
            {CATEGORIES.map((item) => (
              <button key={item} type="button" className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)}>
                {item}
              </button>
            ))}
          </div>
        )}
      </header>

      {(errorMessage || actionError) && (
        <p className="favorites-error" role="status">{actionError || errorMessage}</p>
      )}

      <div className="favorites-sheet-list">
        {visibleMeetings.map((meeting) => (
          <FavoriteMeetingCard
            key={meeting.id}
            meeting={meeting}
            onSelect={() => onMeetingSelect?.(meeting)}
            onRemove={() => void removeFavorite(meeting)}
          />
        ))}
        {visibleMeetings.length === 0 && (
          <div className="favorites-empty-state">
            <span className="favorites-empty-heart"><HeartIcon /></span>
            <strong>{errorMessage ? '찜 목록을 불러오지 못했어요' : meetings.length === 0 ? '아직 찜한 모임이 없어요' : '이 카테고리의 찜한 모임이 없어요'}</strong>
            {!errorMessage && <p>마음에 드는 모임의 하트를 눌러 저장해보세요.</p>}
            {category !== '전체' && <button type="button" onClick={() => setCategory('전체')}>전체 모임 보기</button>}
          </div>
        )}
      </div>
    </section>
  );
}
