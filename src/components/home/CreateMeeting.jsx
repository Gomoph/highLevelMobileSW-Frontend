import { useRef, useState } from 'react';
import './CreateMeeting.css';
import { createMeeting } from '../../api/meetings.js';

// 카테고리
const CATEGORIES = [
  '운동',
  '맛집',
  '카페',
  '전시',
  '보드게임',
  '스터디',
  '기타',
];

function Icon({ name }) {
  const paths = {
    back: (
      <>
        <path d="m15 18-6-6 6-6" />
      </>
    ),
    text: (
      <>
        <path d="M4 6h16M4 12h16M4 18h10" />
      </>
    ),
    tag: (
      <>
        <path d="m20 13-7 7-11-11V2h7l11 11Z" />
        <circle cx="6.5" cy="6.5" r=".7" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </>
    ),
    upload: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m17 8-5-5-5 5M12 3v12" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5.5-8 12-8 12S4 15.5 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    people: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),
  };
  return (
    <svg
      className={`create-icon create-icon-${name}`}
      viewBox="0 0 24 24"
      aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

// 폼 섹션 정의
function FormSection({ number, title, icon, children }) {
  return (
    <section className="create-section">
      <div className="create-section-heading">
        <span>{number}</span>
        <Icon name={icon} />
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

// 모임 등록
export default function CreateMeeting({ onBack, userName, token }) {
  const imageInput = useRef(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [place, setPlace] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [count, setCount] = useState(4);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // 전송

  // 이미지 추가
  function addImages(event) {
    const selected = Array.from(event.target.files || []);
    setImages((current) => [...current, ...selected].slice(0, 5));
    event.target.value = '';
  }

  // DB 전송
  async function submit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    if (!category) {
      setMessage('카테고리를 선택해주세요.');
      return;
    }

    if (!token) {
      setMessage('로그인 정보가 없습니다. 다시 로그인해주세요.');
      return;
    }

    setIsSubmitting(true);
    setMessage('모임을 등록하고 있습니다.');

    try {
      const result = await createMeeting({
        token,
        meeting: {
          title: title.trim(),
          category,
          description: description.trim(),
          placeName: place.trim(),
          latitude: null,
          longitude: null,
          startsAt: `${date}T${time}:00`,
          maxMembers: count,
        },
        images,
      });

      setMessage(
        result?.id
          ? `모임이 등록되었습니다. (번호: ${result.id})`
          : '모임이 등록되었습니다.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : '모임 등록에 실패했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // 화면 출력
  return (
    <div className="create-page">
      <header className="create-header">
        <button type="button" aria-label="이전 화면" onClick={onBack}>
          <Icon name="back" />
        </button>
        <h1>새 모임 만들기</h1>
        <span className="create-status">모집 중</span>
      </header>

      <form id="create-meeting-form" className="create-form" onSubmit={submit}>
        <FormSection number="01" title="모임 제목" icon="text">
          <input
            className="create-text-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={50}
            placeholder="모임 제목을 입력하세요"
            required
          />
          <p className="create-help">최대 50자까지 입력할 수 있어요.</p>
        </FormSection>

        <FormSection number="02" title="카테고리" icon="tag">
          <div className="create-categories">
            {CATEGORIES.map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={category === item}
                className={category === item ? 'selected' : ''}
                onClick={() => setCategory(item)}>
                {item}
              </button>
            ))}
          </div>
        </FormSection>

        <FormSection number="03" title="모임 설명" icon="text">
          <div className="create-description-wrap">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={300}
              placeholder="모임에 대해 간단히 소개해주세요"
              required
            />
            <span>{description.length} / 300</span>
          </div>
        </FormSection>

        <FormSection number="04" title="대표 이미지" icon="image">
          <input
            ref={imageInput}
            className="create-file-input"
            type="file"
            accept="image/png,image/jpeg"
            multiple
            onChange={addImages}
          />
          <div className="create-image-list">
            <button
              type="button"
              className="create-image-add"
              onClick={() => imageInput.current?.click()}
              disabled={images.length >= 5}>
              <Icon name="upload" />
              <span>사진 추가</span>
            </button>
            {images.map((image, index) => (
              <div
                className="create-image-name"
                key={`${image.name}-${index}`}
                title={image.name}>
                <span>{image.name}</span>
                <button
                  type="button"
                  aria-label={`${image.name} 삭제`}
                  onClick={() =>
                    setImages((current) =>
                      current.filter((_, imageIndex) => imageIndex !== index),
                    )
                  }>
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="create-help">최대 5장 · JPG, PNG</p>
        </FormSection>

        <FormSection number="05" title="장소" icon="pin">
          <label className="create-place-input">
            <Icon name="search" />
            <input
              value={place}
              onChange={(event) => setPlace(event.target.value)}
              placeholder="장소를 검색하거나 입력하세요"
              required
            />
          </label>
          <p className="create-help">
            지도 검색 연동 후 장소와 좌표를 선택할 수 있어요.
          </p>
        </FormSection>

        <FormSection number="06" title="날짜 및 시간" icon="calendar">
          <div className="create-datetime">
            <label>
              <Icon name="calendar" />
              <input
                aria-label="모임 날짜"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </label>
            <label>
              <Icon name="clock" />
              <input
                aria-label="모임 시간"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                required
              />
            </label>
          </div>
        </FormSection>

        <FormSection number="07" title="모집 인원" icon="people">
          <div className="create-count-control">
            <div>
              <strong>최대 모집 인원</strong>
              <span>주최자 포함</span>
            </div>
            <div className="create-count-buttons">
              <button
                type="button"
                aria-label="모집 인원 줄이기"
                onClick={() => setCount((current) => Math.max(2, current - 1))}>
                −
              </button>
              <strong>{count}</strong>
              <button
                type="button"
                aria-label="모집 인원 늘리기"
                onClick={() =>
                  setCount((current) => Math.min(50, current + 1))
                }>
                ＋
              </button>
            </div>
          </div>
          <p className="create-help">
            주최자 {userName || '회원'} 포함 · 추가 모집 {count - 1}명
          </p>
        </FormSection>

        <div className="create-data-note">
          <strong>등록될 정보</strong>
          <p>
            주최자, 모임 제목과 설명, 카테고리, 장소, 일정, 모집 인원, 대표
            이미지
          </p>
        </div>
        {message && (
          <p role="status" className="create-message">
            {message}
          </p>
        )}
      </form>

      <footer className="create-footer">
        <button type="button" className="create-cancel" onClick={onBack}>
          취소
        </button>
        <button
          type="submit"
          className="create-submit"
          form="create-meeting-form"
          disabled={isSubmitting}>
          {isSubmitting ? '등록 중…' : '모임 등록'}
        </button>
      </footer>
    </div>
  );
}
