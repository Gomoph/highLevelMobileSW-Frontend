import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiArrowRight,
  FiCalendar,
  FiImage,
  FiMapPin,
  FiUsers,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { getMyProfile, updateMyProfile } from '../../api/members.js';
import {
  getJoinedMeetings,
  getMeetingImageUrl,
  getMyMeetings,
} from '../../api/meetings.js';
import './MyPage.css';

const MYPAGE_ICONS = {
  user: FiUser,
  pin: FiMapPin,
  people: FiUsers,
  image: FiImage,
  arrow: FiArrowRight,
  close: FiX,
  calendar: FiCalendar,
};

function MyPageIcon({ name, className = '' }) {
  const Icon = MYPAGE_ICONS[name];
  return <Icon className={className} aria-hidden="true" />;
}

function MeetingCard({ meeting, status, onClick }) {
  const startsAt = meeting.startsAt ?? meeting.date;
  const formattedDate = startsAt
    ? String(startsAt).replace('T', ' ').slice(0, 16)
    : '일정 미정';
  const place = meeting.placeName ?? meeting.place ?? '장소 미정';
  const currentMembers = meeting.currentMembers ?? meeting.cur;
  const maxMembers = meeting.maxMembers ?? meeting.max;

  return (
    <button className="mypage-meeting-card" type="button" onClick={onClick}>
      <div className="mypage-meeting-card-top">
        <span className="mypage-meeting-status">{status}</span>
        <span className="mypage-meeting-date">{formattedDate}</span>
      </div>
      <div className="mypage-meeting-card-body">
        <span className="mypage-meeting-image" aria-hidden="true">
          {meeting.imageUrls?.[0] ? (
            <img src={getMeetingImageUrl(meeting.imageUrls[0])} alt="" loading="lazy" />
          ) : (
            <MyPageIcon name="image" />
          )}
        </span>
        <span className="mypage-meeting-info">
          <span className="mypage-meeting-category">
            {meeting.category ?? meeting.cat ?? '모임'}
          </span>
          <strong>{meeting.title ?? '제목 없는 모임'}</strong>
          <span className="mypage-meeting-detail">
            <MyPageIcon name="pin" />
            {place}
          </span>
          <span className="mypage-meeting-detail">
            <MyPageIcon name="people" />
            {currentMembers != null
              ? `${currentMembers} / ${maxMembers ?? '-'}명`
              : `최대 ${maxMembers ?? '-'}명`}
          </span>
        </span>
        <MyPageIcon name="arrow" className="mypage-chevron" />
      </div>
    </button>
  );
}

export default function MyPage({
  user,
  userName,
  token,
  userId = '',
  address = '',
  introduction = '',
  interests = [],
  joinedMeetings: joinedFromProps = [],
  hostedMeetings: hostedFromProps = [],
  savedCount = 0,
  onOpenSaved,
  onMeetingSelect,
  onLogout,
  onNameChange,
}) {
  const displayName = user?.name ?? userName ?? '사용자';
  const [pageTab, setPageTab] = useState('profile');
  const [activity, setActivity] = useState('joined');
  const [notice, setNotice] = useState('');
  const noticeTimerRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [profile, setProfile] = useState({
    name: displayName,
    address: user?.address ?? address,
    addressDetail: user?.addressDetail ?? '',
    introduction: user?.introduction ?? introduction,
  });
  const [draftProfile, setDraftProfile] = useState(profile);
  const [hostedMeetings, setHostedMeetings] = useState(hostedFromProps);
  const [joinedMeetings, setJoinedMeetings] = useState(joinedFromProps);
  const displayId = profile.userId ?? user?.userId ?? userId;

  const meetings = activity === 'joined' ? joinedMeetings : hostedMeetings;
  const profileLink = useMemo(
    () => `moiza.app/profile/${displayId || 'my-profile'}`,
    [displayId],
  );

  const showNotice = useCallback((message) => {
    setNotice(message);
    window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(''), 2200);
  }, []);

  useEffect(() => () => window.clearTimeout(noticeTimerRef.current), []);

  useEffect(() => {
    if (!token) return undefined; // 로그인 토근 없으면 undefined 반환

    let isCurrent = true;
    getMyProfile(token)
      .then((data) => {
        if (!isCurrent) return;
        setProfile({
          ...data,
          address: data.address ?? '',
          addressDetail: data.addressDetail ?? '',
          introduction: data.introduction ?? '',
        });
      })
      .catch(() => {
        if (isCurrent) showNotice('회원 정보를 불러오지 못했어요.');
      });

    // 토큰 없을 때 API 요청 건너뛰는 검사
    return () => {
      isCurrent = false;
    };
  }, [token, showNotice]);

  // 참가 신청한 모임 불러오기
  useEffect(() => {
    if (!token) return undefined;

    let isCurrent = true;
    getJoinedMeetings(token)
      .then((data) => {
        if (isCurrent) setJoinedMeetings(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (isCurrent) {
          showNotice(
            error instanceof Error
              ? error.message
              : '참여 예정 모임을 불러오지 못했어요.',
          );
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [token, showNotice]);

  // 내가 만든 모임 불러오기
  useEffect(() => {
    if (!token) return undefined;

    let isCurrent = true;
    getMyMeetings(token)
      .then((data) => {
        if (isCurrent) setHostedMeetings(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (isCurrent) {
          showNotice(
            error instanceof Error
              ? error.message
              : '내가 만든 모임을 불러오지 못했어요.',
          );
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [token, showNotice]);

  const openEditor = () => {
    setDraftProfile(profile);
    setEditing(true);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!token || isSaving) return;

    setIsSaving(true);
    try {
      const savedProfile = await updateMyProfile(token, draftProfile);
      setProfile({
        ...savedProfile,
        address: savedProfile.address ?? '',
        addressDetail: savedProfile.addressDetail ?? '',
        introduction: savedProfile.introduction ?? '',
      });
      onNameChange?.(savedProfile.name);
      setEditing(false);
      showNotice('프로필이 저장되었어요.');
    } catch (error) {
      showNotice(
        error instanceof Error ? error.message : '프로필을 저장하지 못했어요.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const shareProfile = async (method) => {
    if (method === '링크 복사') {
      try {
        await navigator.clipboard.writeText(`https://${profileLink}`);
        showNotice('프로필 링크가 복사되었어요.');
      } catch {
        showNotice('이 브라우저에서는 링크 복사를 사용할 수 없어요.');
      }
    } else {
      showNotice(`${method} 공유는 준비 중이에요.`);
    }
    setSharing(false);
  };

  return (
    <div className="my-page">
      <header className="mypage-header">
        <p className="mypage-eyebrow">MY PAGE</p>
        <h1>마이페이지</h1>
        <nav className="mypage-tabs" aria-label="마이페이지 메뉴">
          {[
            { id: 'profile', label: '내 정보' },
            { id: 'meetings', label: '내 모임' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={pageTab === tab.id ? 'is-active' : ''}
              aria-current={pageTab === tab.id ? 'page' : undefined}
              onClick={() => setPageTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mypage-content">
        {pageTab === 'profile' ? (
          <>
            <section className="mypage-panel mypage-profile-panel">
              <div className="mypage-profile-summary">
                <div className="mypage-avatar" aria-hidden="true">
                  <MyPageIcon name="user" />
                  <span>+</span>
                </div>
                <div className="mypage-identity">
                  <div className="mypage-name-row">
                    <h2>{profile.name}</h2>
                    <span className="mypage-member-badge">일반 회원</span>
                  </div>
                  {displayId && <p className="mypage-user-id">@{displayId}</p>}
                  {(profile.address || profile.addressDetail) && (
                    <p className="mypage-address">
                      <MyPageIcon name="pin" />
                      {[profile.address, profile.addressDetail]
                        .filter(Boolean)
                        .join(' ')}
                    </p>
                  )}
                </div>
              </div>

              <section className="mypage-bio" aria-label="한 줄 소개">
                <h3>한 줄 소개</h3>
                <p>
                  {profile.introduction ||
                    '나를 소개하는 한 줄을 등록해보세요.'}
                </p>
              </section>

              <section className="mypage-interests" aria-label="관심 분야">
                <h3>관심 분야</h3>
                <p>선호하는 활동을 기준으로 모임을 찾아보세요.</p>
                {interests.length > 0 ? (
                  <div className="mypage-interest-list">
                    {interests.map((interest) => (
                      <span key={interest}>{interest}</span>
                    ))}
                  </div>
                ) : (
                  <span className="mypage-interest-empty">
                    관심 분야가 아직 등록되지 않았어요.
                  </span>
                )}
              </section>

              <div className="mypage-profile-actions">
                <button type="button" onClick={openEditor}>
                  프로필 관리
                </button>
                <button type="button" onClick={() => setSharing(true)}>
                  프로필 공유
                </button>
              </div>

              <div className="mypage-stats" aria-label="모임 활동">
                <button
                  type="button"
                  onClick={() => {
                    setActivity('joined');
                    setPageTab('meetings');
                  }}>
                  <strong>{joinedMeetings.length}</strong>
                  <span>참여한 모임</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivity('hosted');
                    setPageTab('meetings');
                  }}>
                  <strong>{hostedMeetings.length}</strong>
                  <span>만든 모임</span>
                </button>
                <button
                  type="button"
                  onClick={
                    onOpenSaved ??
                    (() => showNotice('찜한 모임 화면은 준비 중이에요.'))
                  }>
                  <strong>{savedCount}</strong>
                  <span>찜한 모임</span>
                </button>
              </div>
            </section>

            <section className="mypage-panel mypage-utility-links">
              <button
                type="button"
                onClick={() => showNotice('고객센터는 준비 중이에요.')}>
                고객센터
              </button>
              <button
                type="button"
                onClick={() => showNotice('약관 및 정책은 준비 중이에요.')}>
                약관 및 정책
              </button>
              <button
                type="button"
                className="mypage-logout"
                onClick={onLogout}>
                로그아웃
              </button>
            </section>
          </>
        ) : (
          <>
            <section className="mypage-panel mypage-meeting-summary">
              <div>
                <strong>{joinedMeetings.length}</strong>
                <span>참여한 모임</span>
              </div>
              <div>
                <strong>{hostedMeetings.length}</strong>
                <span>내가 만든 모임</span>
              </div>
            </section>
            <div
              className="mypage-activity-tabs"
              role="tablist"
              aria-label="모임 분류">
              <button
                type="button"
                role="tab"
                aria-selected={activity === 'joined'}
                className={activity === 'joined' ? 'is-active' : ''}
                onClick={() => setActivity('joined')}>
                참여 예정
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activity === 'hosted'}
                className={activity === 'hosted' ? 'is-active' : ''}
                onClick={() => setActivity('hosted')}>
                내가 만든 모임
              </button>
            </div>
            <section className="mypage-meetings-section">
              <div className="mypage-section-heading">
                <div>
                  <h2>
                    {activity === 'joined'
                      ? '참여 예정 모임'
                      : '내가 만든 모임'}
                  </h2>
                  <p>{meetings.length}개의 모임</p>
                </div>
              </div>
              {meetings.length > 0 ? (
                <div className="mypage-meeting-list">
                  {meetings.map((meeting) => (
                    <MeetingCard
                      key={meeting.id ?? meeting.title}
                      meeting={meeting}
                      status={
                        activity === 'joined'
                          ? (meeting.status ?? '참여 확정')
                          : (meeting.status ?? '모집 중')
                      }
                      // 클릭 이벤트 추가
                      onClick={() => onMeetingSelect?.(meeting)}
                    />
                  ))}
                </div>
              ) : (
                <div className="mypage-empty-state">
                  <span>
                    <MyPageIcon name="calendar" />
                  </span>
                  <strong>
                    {activity === 'joined'
                      ? '참여 중인 모임이 없어요'
                      : '만든 모임이 없어요'}
                  </strong>
                  <p>새로운 모임을 찾아 함께해보세요.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {notice && (
        <div className="mypage-toast" role="status">
          {notice}
        </div>
      )}

      {editing && (
        <div
          className="mypage-modal-backdrop"
          onClick={() => setEditing(false)}>
          <form
            className="mypage-modal"
            onSubmit={saveProfile}
            onClick={(event) => event.stopPropagation()}>
            <div className="mypage-modal-heading">
              <div>
                <h2>프로필 관리</h2>
                <p>내 프로필 정보를 수정해요.</p>
              </div>
              <button
                type="button"
                className="mypage-close-button"
                aria-label="닫기"
                onClick={() => setEditing(false)}>
                <MyPageIcon name="close" />
              </button>
            </div>
            <label>
              이름
              <input
                value={draftProfile.name}
                onChange={(event) =>
                  setDraftProfile({ ...draftProfile, name: event.target.value })
                }
                maxLength={30}
              />
            </label>
            <label>
              주소
              <input
                value={draftProfile.address}
                onChange={(event) =>
                  setDraftProfile({
                    ...draftProfile,
                    address: event.target.value,
                  })
                }
                maxLength={120}
                placeholder="예: 서울시 중랑구 면목동"
              />
            </label>
            <label>
              상세 주소
              <input
                value={draftProfile.addressDetail}
                onChange={(event) =>
                  setDraftProfile({
                    ...draftProfile,
                    addressDetail: event.target.value,
                  })
                }
                maxLength={120}
                placeholder="동·호수 등 상세 주소"
              />
            </label>
            <label>
              한 줄 소개
              <textarea
                value={draftProfile.introduction}
                onChange={(event) =>
                  setDraftProfile({
                    ...draftProfile,
                    introduction: event.target.value,
                  })
                }
                maxLength={100}
                rows={3}
                placeholder="나를 소개해보세요."
              />
            </label>
            <button
              className="mypage-primary-button"
              type="submit"
              disabled={isSaving}>
              {isSaving ? '저장 중…' : '저장하기'}
            </button>
          </form>
        </div>
      )}

      {sharing && (
        <div
          className="mypage-modal-backdrop mypage-share-backdrop"
          onClick={() => setSharing(false)}>
          <section
            className="mypage-share-sheet"
            aria-label="프로필 공유"
            onClick={(event) => event.stopPropagation()}>
            <div className="mypage-modal-heading">
              <div>
                <h2>프로필 공유</h2>
                <p>내 프로필 링크를 친구에게 공유해보세요.</p>
              </div>
              <button
                type="button"
                className="mypage-close-button"
                aria-label="닫기"
                onClick={() => setSharing(false)}>
                <MyPageIcon name="close" />
              </button>
            </div>
            <div className="mypage-share-link">
              <span>프로필 링크</span>
              <strong>{profileLink}</strong>
            </div>
            <div className="mypage-share-actions">
              {['링크 복사', '메시지', '더보기'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => void shareProfile(method)}>
                  {method}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
