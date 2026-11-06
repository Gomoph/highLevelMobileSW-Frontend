// 목록에서 선택한 모임을 props로 받아 상세 정보를 표시합니다.
import { useState } from 'react';
import './MeetingDetail.css';

function DetailIcon({ name }) {
  const paths = {
    back: <path d="m15 18-6-6 6-6" />,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l4 2" /></>,
    people: <><circle cx="9" cy="7" r="3" /><path d="M2 21v-3a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v3M16 4a3 3 0 0 1 0 6M22 21v-3a5 5 0 0 0-4-4.9" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export default function MeetingDetail({ meeting, onBack }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [notice, setNotice] = useState('');
  const startsAt = meeting?.startsAt ?? meeting?.date;
  const distance = Number(meeting?.distance);
  const hasDistance = meeting?.distance != null && Number.isFinite(distance);

  return (
    <div className="meeting-detail-page">
      <header className="meeting-detail-header">
        <button type="button" onClick={onBack} aria-label="모임 목록으로 돌아가기">
          <DetailIcon name="back" />
        </button>
        <h1>모임 상세</h1>
        {meeting && (
          <button
            type="button"
            className={`meeting-detail-favorite${isFavorite ? ' is-active' : ''}`}
            aria-label="모임 찜하기"
            aria-pressed={isFavorite}
            onClick={() => {
              setIsFavorite((value) => !value);
              setNotice('찜은 이 화면에서만 임시로 적용돼요.');
            }}>
            <DetailIcon name="heart" />
          </button>
        )}
      </header>
      {!meeting ? (
        <main className="meeting-detail-empty">모임 정보가 없습니다. 목록으로 돌아가 모임을 선택해 주세요.</main>
      ) : (
        <>
          <main className="meeting-detail-main">
            <div className="meeting-detail-cover" aria-label="모임 대표 이미지 준비 중">
              <DetailIcon name="image" />
              <span>모임 대표 이미지</span>
            </div>
            <div className="meeting-detail-content">
              <div className="meeting-detail-meta">
                <span>{meeting.category ?? '카테고리 미정'}</span>
                <span className="meeting-detail-status">{meeting.status ?? '모집중'}</span>
              </div>
              <h2>{meeting.title}</h2>
              <dl className="meeting-detail-facts">
                <div>
                  <dt><DetailIcon name="pin" /><span className="meeting-detail-sr-only">위치</span></dt>
                  <dd>{meeting.placeName ?? meeting.place ?? '장소 미정'}{hasDistance && ` · ${distance.toFixed(1)}km`}</dd>
                </div>
                <div>
                  <dt><DetailIcon name="clock" /><span className="meeting-detail-sr-only">시간</span></dt>
                  <dd>{startsAt ? String(startsAt).replace('T', ' ').slice(0, 16) : '일정 미정'}</dd>
                </div>
                <div>
                  <dt><DetailIcon name="people" /><span className="meeting-detail-sr-only">참여 인원</span></dt>
                  <dd>{meeting.currentMembers != null
                    ? `${meeting.currentMembers} / ${meeting.maxMembers ?? '-'}명 참여`
                    : `최대 ${meeting.maxMembers ?? '-'}명`}</dd>
                </div>
              </dl>
              <section className="meeting-detail-description" aria-labelledby="meeting-description-title">
                <h3 id="meeting-description-title">이런 모임이에요</h3>
                <p>{meeting.description?.trim() || '아직 등록된 모임 소개가 없어요.'}</p>
              </section>
            </div>
          </main>
          <footer className="meeting-detail-actions">
            <button type="button" onClick={() => setNotice('모임 참여 기능은 준비 중이에요.')}>모임 참여하기</button>
            <p role="status">{notice || '참여 기능은 준비 중입니다.'}</p>
          </footer>
        </>
      )}
    </div>
  );
}
