// 목록에서 선택한 모임을 props로 받아 상세 정보를 표시합니다.
import { useEffect, useState } from 'react';
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiHeart,
  FiImage,
  FiMapPin,
  FiShare2,
  FiUsers,
} from 'react-icons/fi';
import {
  getMeetingById,
  getMeetingParticipation,
  joinMeeting,
  leaveMeeting,
} from '../../api/meetings.js';
import './MeetingDetail.css';

const DETAIL_ICONS = {
  back: FiArrowLeft,
  share: FiShare2,
  heart: FiHeart,
  pin: FiMapPin,
  clock: FiClock,
  people: FiUsers,
  image: FiImage,
  calendar: FiCalendar,
};

function DetailIcon({ name }) {
  const Icon = DETAIL_ICONS[name];
  return <Icon aria-hidden="true" />;
}

export default function MeetingDetail({
  meeting,
  onBack,
  token,
  isFavorite = false,
  onToggleFavorite,
  onMeetingUpdate,
}) {
  const [notice, setNotice] = useState('');
  const [participationLoading, setParticipationLoading] = useState(true);
  const [participationSubmitting, setParticipationSubmitting] = useState(false);
  const [participation, setParticipation] = useState({
    joined: false,
    host: false,
    full: false,
    canJoin: true,
    currentMembers: meeting?.currentMembers ?? 0,
    maxMembers: meeting?.maxMembers ?? 0,
  });
  const participationButtonLabel = participationLoading
    ? '참여 정보 확인 중…'
    : participationSubmitting
      ? '처리 중…'
      : participation.host
        ? '내가 만든 모임'
        : participation.joined
          ? '참여 취소하기'
          : participation.full
            ? '모집 마감'
            : '신청하기';
  const startsAt = meeting?.startsAt ?? meeting?.date;
  const distance = Number(meeting?.distance);
  const hasDistance = meeting?.distance != null && Number.isFinite(distance);

  useEffect(() => {
    if (!meeting?.id || !token) return undefined;

    let isCurrent = true;
    getMeetingParticipation(token, meeting.id)
      .then((result) => {
        if (isCurrent) setParticipation(result);
      })
      .catch((error) => {
        if (isCurrent) {
          setNotice(
            error instanceof Error
              ? error.message
              : '참여 정보를 불러오지 못했어요.',
          );
        }
      })
      .finally(() => {
        if (isCurrent) setParticipationLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [meeting?.id, token]);

  const handleParticipation = async () => {
    if (!meeting?.id || !token || participationSubmitting) return;

    setParticipationSubmitting(true);
    try {
      const result = participation.joined
        ? await leaveMeeting(token, meeting.id)
        : await joinMeeting(token, meeting.id);
      let updatedParticipation = result;
      try {
        const latestMeeting = await getMeetingById(meeting.id);
        updatedParticipation = {
          ...result,
          currentMembers: latestMeeting.currentMembers ?? result.currentMembers,
          maxMembers: latestMeeting.maxMembers ?? result.maxMembers,
        };
      } catch {
        // 참여 처리는 완료됐으므로 최신 상세 조회가 실패하면 변경 응답을 사용합니다.
      }
      setParticipation(updatedParticipation);
      onMeetingUpdate?.(meeting.id, {
        currentMembers: updatedParticipation.currentMembers,
        maxMembers: updatedParticipation.maxMembers,
      });
      setNotice(
        updatedParticipation.joined ? '모임 참여가 완료되었어요.' : '모임 참여를 취소했어요.',
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : '모임 참여 처리에 실패했어요.',
      );
    } finally {
      setParticipationSubmitting(false);
    }
  };

  const shareMeeting = async () => {
    if (!meeting?.id) return;
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('meetingId', meeting.id);

    try {
      if (navigator.share) {
        await navigator.share({
          title: meeting.title ?? '모임 초대',
          text: `${meeting.title ?? '모임'}에 함께 참여해보세요.`,
          url: shareUrl.toString(),
        });
        setNotice('모임 링크를 공유했어요.');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl.toString());
        setNotice('모임 링크를 복사했어요.');
      } else {
        setNotice(shareUrl.toString());
      }
    } catch (error) {
      if (error?.name !== 'AbortError')
        setNotice('모임 링크를 공유하지 못했어요.');
    }
  };

  return (
    <div className="meeting-detail-page">
      <header className="meeting-detail-header">
        <button
          type="button"
          onClick={onBack}
          aria-label="모임 목록으로 돌아가기">
          <DetailIcon name="back" />
        </button>
        <h1>모임 상세</h1>
        {meeting && (
          <button
            type="button"
            className="meeting-detail-share"
            aria-label="모임 링크 공유"
            onClick={shareMeeting}>
            <DetailIcon name="share" />
          </button>
        )}
        {meeting && (
          <button
            type="button"
            className={`meeting-detail-favorite${isFavorite ? ' is-active' : ''}`}
            aria-label="모임 찜하기"
            aria-pressed={isFavorite}
            onClick={async () => {
              try {
                await onToggleFavorite?.();
                setNotice(
                  isFavorite
                    ? '찜 목록에서 삭제했어요.'
                    : '찜 목록에 저장했어요.',
                );
              } catch {
                setNotice('찜 상태를 저장하지 못했어요. 다시 시도해 주세요.');
              }
            }}>
            <DetailIcon name="heart" />
          </button>
        )}
      </header>
      {!meeting ? (
        <main className="meeting-detail-empty">
          모임 정보가 없습니다. 목록으로 돌아가 모임을 선택해 주세요.
        </main>
      ) : (
        <>
          <main className="meeting-detail-main">
            <div
              className="meeting-detail-cover"
              aria-label="모임 대표 이미지 준비 중">
              <DetailIcon name="image" />
              <span>모임 대표 이미지</span>
            </div>
            <div className="meeting-detail-content">
              <div className="meeting-detail-meta">
                <span>{meeting.category ?? '카테고리 미정'}</span>
                <span className="meeting-detail-status">
                  {meeting.status ?? '모집중'}
                </span>
              </div>
              <h2>{meeting.title}</h2>
              <dl className="meeting-detail-facts">
                <div>
                  <dt>
                    <DetailIcon name="pin" />
                    <span className="meeting-detail-sr-only">위치</span>
                  </dt>
                  <dd>
                    {meeting.placeName ?? meeting.place ?? '장소 미정'}
                    {hasDistance && ` · ${distance.toFixed(1)}km`}
                  </dd>
                </div>
                <div>
                  <dt>
                    <DetailIcon name="clock" />
                    <span className="meeting-detail-sr-only">시간</span>
                  </dt>
                  <dd>
                    {startsAt
                      ? String(startsAt).replace('T', ' ').slice(0, 16)
                      : '일정 미정'}
                  </dd>
                </div>
                <div>
                  <dt>
                    <DetailIcon name="people" />
                    <span className="meeting-detail-sr-only">참여 인원</span>
                  </dt>
                  <dd>
                    {participation.currentMembers ??
                      meeting.currentMembers ??
                      0}{' '}
                    / {participation.maxMembers || meeting.maxMembers || '-'}명
                    참여
                  </dd>
                </div>
              </dl>
              <section
                className="meeting-detail-description"
                aria-labelledby="meeting-description-title">
                <h3 id="meeting-description-title">이런 모임이에요</h3>
                <p>
                  {meeting.description?.trim() ||
                    '아직 등록된 모임 소개가 없어요.'}
                </p>
              </section>
            </div>
          </main>
          <footer className="meeting-detail-actions">
            <button
              type="button"
              disabled={
                participationLoading ||
                participationSubmitting ||
                ((participation.host || participation.full) &&
                  !participation.joined)
              }
              onClick={handleParticipation}>
              {participationButtonLabel}
            </button>
            <p role="status">
              {notice ||
                `${participation.currentMembers ?? meeting.currentMembers ?? 0} / ${participation.maxMembers || meeting.maxMembers || '-'}명 참여 중`}
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
