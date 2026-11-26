import { useMemo, useState } from 'react';
import {
  FiCalendar,
  FiChevronDown,
  FiFilter,
  FiHeart,
  FiImage,
  FiMapPin,
  FiUsers,
} from 'react-icons/fi';
import { getMeetingImageUrl } from '../../api/meetings.js';
import './FavoritesSheet.css';

const CATEGORIES = ['전체', '운동', '카페', '맛집', '전시', '보드게임', '스터디', '기타'];

function HeartIcon({ filled = false }) {
  return <FiHeart aria-hidden="true" className={filled ? 'is-filled' : ''} />;
}

const CARD_ICONS = {
  image: FiImage,
  calendar: FiCalendar,
  pin: FiMapPin,
  people: FiUsers,
  down: FiChevronDown,
  filter: FiFilter,
};

function CardIcon({ name }) {
  const Icon = CARD_ICONS[name];
  return <Icon aria-hidden="true" />;
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
        <span className="favorite-meeting-image" aria-hidden="true">
          {meeting.imageUrls?.[0] ? (
            <img src={getMeetingImageUrl(meeting.imageUrls[0])} alt="" loading="lazy" />
          ) : (
            <CardIcon name="image" />
          )}
        </span>
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
