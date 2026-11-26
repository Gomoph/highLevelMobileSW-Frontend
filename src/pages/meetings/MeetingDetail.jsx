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
  getMeetingImageUrl,
  confirmMeeting,
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
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [confirmationSubmitting, setConfirmationSubmitting] = useState(false);
  const [participationLoading, setParticipationLoading] = useState(true);
  const [participationSubmitting, setParticipationSubmitting] = useState(false);
  const [participation, setParticipation] = useState({
    joined: false,
    host: false,
    full: false,
    canJoin: true,
    confirmed: meeting?.confirmed ?? false,
    announcement: meeting?.announcement ?? '',
    currentMembers: meeting?.currentMembers ?? 0,
    maxMembers: meeting?.maxMembers ?? 0,
  });
  const participationButtonLabel = participationLoading
    ? '참가 상태 확인 중'
    : participationSubmitting || confirmationSubmitting
      ? '처리 중'
      : participation.host
        ? participation.confirmed ? '공지 확인' : '모임 확정'
        : participation.joined
          ? '참가 취소'
          : participation.confirmed || participation.full
            ? '참가 마감'
            : '신청하기';
  const showConfirmedParticipantActions =
    participation.confirmed && participation.joined && !participation.host;
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
    if (!participation.joined && (participation.host || participation.full || participation.confirmed)) return;
    setParticipationSubmitting(true);
    try {
      const result = participation.joined ? await leaveMeeting(token, meeting.id) : await joinMeeting(token, meeting.id);
      let updatedParticipation = result;
      try {
        const latestMeeting = await getMeetingById(meeting.id);
        updatedParticipation = { ...result, currentMembers: latestMeeting.currentMembers ?? result.currentMembers, maxMembers: latestMeeting.maxMembers ?? result.maxMembers, confirmed: latestMeeting.confirmed ?? result.confirmed, announcement: latestMeeting.announcement ?? result.announcement };
      } catch { /* Keep the participation response if refreshing the meeting fails. */ }
      setParticipation((current) => ({ ...current, ...updatedParticipation }));
      onMeetingUpdate?.(meeting.id, { currentMembers: updatedParticipation.currentMembers, maxMembers: updatedParticipation.maxMembers, confirmed: updatedParticipation.confirmed, announcement: updatedParticipation.announcement });
      setNotice(updatedParticipation.joined ? '참가 신청이 완료됐어요.' : '참가 신청을 취소했어요.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '참가 요청을 처리하지 못했어요.');
    } finally { setParticipationSubmitting(false); }
  };

  const handlePrimaryAction = () => {
    if (participation.host) {
      if (participation.confirmed) setAnnouncementModalOpen(true);
      else { setAnnouncementDraft(''); setConfirmModalOpen(true); }
      return;
    }
    if (participation.confirmed && participation.joined) setAnnouncementModalOpen(true);
    else handleParticipation();
  };

  const handleConfirmMeeting = async (event) => {
    event.preventDefault();
    if (!meeting?.id || !token || !announcementDraft.trim() || confirmationSubmitting) return;
    setConfirmationSubmitting(true);
    try {
      const result = await confirmMeeting(token, meeting.id, announcementDraft.trim());
      const updates = { confirmed: true, announcement: result.announcement ?? announcementDraft.trim() };
      setParticipation((current) => ({ ...current, ...updates }));
      onMeetingUpdate?.(meeting.id, updates);
      setConfirmModalOpen(false);
      setNotice('모임이 확정되고 공지가 등록됐어요.');
    } catch (error) { setNotice(error instanceof Error ? error.message : '모임 확정에 실패했어요.'); }
    finally { setConfirmationSubmitting(false); }
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
            <div className={`meeting-detail-cover${meeting.imageUrls?.[0] ? ' has-image' : ''}`} aria-label="모임 대표 이미지">
              {meeting.imageUrls?.[0] ? <img src={getMeetingImageUrl(meeting.imageUrls[0])} alt="모임 대표" /> : <><DetailIcon name="image" /><span>모임 대표 이미지</span></>}
            </div>
            {meeting.imageUrls?.length > 1 && <div className="meeting-detail-gallery" aria-label="모임 추가 이미지">{meeting.imageUrls.slice(1).map((imageUrl,index)=><img key={imageUrl} src={getMeetingImageUrl(imageUrl)} alt={`모임 사진 ${index+2}`} />)}</div>}
            <div className="meeting-detail-content">
              <div className="meeting-detail-meta">
                <span>{meeting.category ?? '카테고리 미정'}</span>
                <span className="meeting-detail-status">
                  {participation.confirmed ? '참가 마감' : meeting.status ?? '모집 중'}
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
            {showConfirmedParticipantActions ? (
              <div className="meeting-detail-actions-split">
                <button type="button" className="announcement-button" onClick={() => setAnnouncementModalOpen(true)}>공지 확인</button>
                <button type="button" className="cancel-button" disabled={participationSubmitting} onClick={handleParticipation}>취소</button>
              </div>
            ) : (
              <button type="button" disabled={participationLoading || participationSubmitting || confirmationSubmitting || (!participation.host && !participation.joined && (participation.full || participation.confirmed))} onClick={handlePrimaryAction}>{participationButtonLabel}</button>
            )}
            <p role="status">{notice || `${participation.currentMembers ?? meeting.currentMembers ?? 0} / ${participation.maxMembers || meeting.maxMembers || '-'}명 참여 중`}</p>
          </footer>
          {confirmModalOpen && (
            <div className="meeting-modal-backdrop" onClick={() => !confirmationSubmitting && setConfirmModalOpen(false)}>
              <section className="meeting-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-meeting-title" onClick={(event) => event.stopPropagation()}>
                <h2 id="confirm-meeting-title">모임 확정 및 공지 작성</h2>
                <p>확정하면 새 참가 신청이 마감돼요. 참가 중인 사용자는 취소할 수 있어요.</p>
                <form onSubmit={handleConfirmMeeting}>
                  <textarea value={announcementDraft} onChange={(event) => setAnnouncementDraft(event.target.value)} maxLength={1000} placeholder="참가자에게 전달할 공지를 작성해 주세요." required />
                  <div className="meeting-modal-actions">
                    <button type="button" className="meeting-modal-secondary" disabled={confirmationSubmitting} onClick={() => setConfirmModalOpen(false)}>취소</button>
                    <button type="submit" className="meeting-modal-primary" disabled={!announcementDraft.trim() || confirmationSubmitting}>{confirmationSubmitting ? '저장 중' : '확정하고 공지 저장'}</button>
                  </div>
                </form>
              </section>
            </div>
          )}
          {announcementModalOpen && (
            <div className="meeting-modal-backdrop" onClick={() => setAnnouncementModalOpen(false)}>
              <section className="meeting-modal announcement-modal" role="dialog" aria-modal="true" aria-labelledby="meeting-announcement-title" onClick={(event) => event.stopPropagation()}>
                <h2 id="meeting-announcement-title">모임 공지</h2>
                <p className="meeting-announcement-text">{participation.announcement || meeting.announcement || '등록된 공지가 없습니다.'}</p>
                <div className="meeting-modal-actions"><button type="button" className="meeting-modal-primary" onClick={() => setAnnouncementModalOpen(false)}>닫기</button></div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
