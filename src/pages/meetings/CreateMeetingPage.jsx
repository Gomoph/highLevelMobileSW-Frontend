// src/pages/meetings/CreateMeetingPage.jsx — 모임 정보와 장소 입력 및 모임 등록 요청 처리
import { useEffect, useRef, useState } from 'react';
import {
  FiAlignLeft,
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiImage,
  FiMapPin,
  FiMinus,
  FiPlus,
  FiSearch,
  FiTag,
  FiUpload,
  FiUsers,
} from 'react-icons/fi';
import './CreateMeetingPage.css';
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

const CREATE_ICONS = {
  back: FiArrowLeft,
  text: FiAlignLeft,
  tag: FiTag,
  image: FiImage,
  upload: FiUpload,
  pin: FiMapPin,
  search: FiSearch,
  calendar: FiCalendar,
  clock: FiClock,
  people: FiUsers,
};

function Icon({ name }) {
  const IconComponent = CREATE_ICONS[name];
  return (
    <IconComponent
      className={`create-icon create-icon-${name}`}
      aria-hidden="true"
    />
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
export default function CreateMeetingPage({
  onBack,
  userName,
  token,
  selectedLocation,
}) {
  const imageInput = useRef(null);
  const placeSearchTimer = useRef(null);
  const placeSearchSequence = useRef(0);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [place, setPlace] = useState(selectedLocation?.placeName ?? '');
  const [placeSelection, setPlaceSelection] = useState(
    selectedLocation ?? null,
  );
  const [placeResults, setPlaceResults] = useState([]);
  const [placeSearchMessage, setPlaceSearchMessage] = useState('');
  const [placeSearchOpen, setPlaceSearchOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [count, setCount] = useState(4);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // 전송

  useEffect(
    () => () => {
      window.clearTimeout(placeSearchTimer.current);
      placeSearchSequence.current += 1;
    },
    [],
  );

  function handlePlaceChange(event) {
    const value = event.target.value;
    const keyword = value.trim();
    const requestSequence = ++placeSearchSequence.current;

    window.clearTimeout(placeSearchTimer.current);
    setPlace(value);
    setPlaceSelection(null);
    setPlaceResults([]);
    setPlaceSearchMessage('');
    setPlaceSearchOpen(keyword.length >= 2);

    if (keyword.length < 2) return;

    placeSearchTimer.current = window.setTimeout(() => {
      if (!window.kakao?.maps?.services) {
        setPlaceSearchMessage('장소 검색 서비스를 불러오지 못했습니다.');
        return;
      }

      setPlaceSearchMessage('장소를 검색하고 있어요.');
      const placesService = new window.kakao.maps.services.Places();

      placesService.keywordSearch(keyword, (results, status) => {
        if (requestSequence !== placeSearchSequence.current) return;

        if (status === window.kakao.maps.services.Status.OK) {
          setPlaceResults(results.slice(0, 6));
          setPlaceSearchMessage('');
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          setPlaceResults([]);
          setPlaceSearchMessage('검색 결과가 없습니다.');
        } else {
          setPlaceResults([]);
          setPlaceSearchMessage('장소 검색에 실패했습니다. 다시 시도해주세요.');
        }
      });
    }, 250);
  }

  function handlePlaceSelect(result) {
    window.clearTimeout(placeSearchTimer.current);
    placeSearchSequence.current += 1;

    setPlace(result.place_name);
    setPlaceSelection({
      placeName: result.place_name,
      address: result.road_address_name || result.address_name,
      latitude: Number(result.y),
      longitude: Number(result.x),
    });
    setPlaceResults([]);
    setPlaceSearchMessage('');
    setPlaceSearchOpen(false);
  }

  // 이미지 추가
  function addImages(event) {
    const selected = Array.from(event.target.files || []);
    setImages((current) => [...current, ...selected].slice(0, 3));
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

    // 좌표 없이 등록하면 지도에 모임 마커를 표시할 수 없습니다.
    if (
      !placeSelection ||
      !Number.isFinite(Number(placeSelection.latitude)) ||
      !Number.isFinite(Number(placeSelection.longitude)) ||
      placeSelection.latitude == null ||
      placeSelection.longitude == null
    ) {
      setMessage('장소 검색 결과에서 모임 장소를 선택해주세요.');
      return;
    }

    if (!token) {
      setMessage('로그인 정보가 없습니다. 다시 로그인해주세요.');
      return;
    }

    setIsSubmitting(true);
    setMessage('모임을 등록하고 있습니다.');

    // 토큰과 작성한 내용 전송
    try {
      const result = await createMeeting({
        token,
        meeting: {
          title: title.trim(),
          category,
          description: description.trim(),
          placeName: place.trim(),
          latitude: placeSelection?.latitude ?? null,
          longitude: placeSelection?.longitude ?? null,
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
      onBack();
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
              disabled={images.length >= 3}>
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
          <p className="create-help">
            선택한 사진 중 첫 번째 사진이 대표 이미지예요. 최대 3장까지 추가할 수 있어요.
          </p>
        </FormSection>

        <FormSection number="05" title="장소" icon="pin">
          <div className="create-place-autocomplete">
            <label className="create-place-input">
              <Icon name="search" />
              <input
                value={place}
                onChange={handlePlaceChange}
                onFocus={() => {
                  if (place.trim().length >= 2) setPlaceSearchOpen(true);
                }}
                placeholder="장소명이나 주소를 검색하세요"
                autoComplete="off"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={placeSearchOpen && placeResults.length > 0}
                aria-controls="create-place-results"
                required
              />
            </label>
            {placeSearchOpen &&
              (placeResults.length > 0 || placeSearchMessage) && (
                <div className="create-place-dropdown">
                  {placeSearchMessage && (
                    <p className="create-place-search-message">
                      {placeSearchMessage}
                    </p>
                  )}
                  {placeResults.length > 0 && (
                    <ul id="create-place-results" role="listbox">
                      {placeResults.map((result) => (
                        <li key={result.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={false}
                            onClick={() => handlePlaceSelect(result)}>
                            <strong>{result.place_name}</strong>
                            <span>
                              {result.road_address_name || result.address_name}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
          </div>
          <p className="create-help">
            목록에서 장소를 선택하면 장소명과 좌표가 등록돼요.
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
                <FiMinus aria-hidden="true" />
              </button>
              <strong>{count}</strong>
              <button
                type="button"
                aria-label="모집 인원 늘리기"
                onClick={() =>
                  setCount((current) => Math.min(50, current + 1))
                }>
                <FiPlus aria-hidden="true" />
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
