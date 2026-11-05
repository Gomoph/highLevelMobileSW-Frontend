// src/pages/auth/SignupPage.jsx — 회원 정보 입력과 회원가입 요청 처리

import { useState } from 'react';
import './Auth.css';
import './SignupPage.css';

// input 칸을 map()을 활용하여 동적으로 생성하기 위한 객체 배열
const fields = [
  {
    name: 'userId',
    label: '아이디',
    placeholder: '사용할 아이디를 입력하세요',
    autoComplete: 'username',
    hint: '영문, 숫자 4~20자',
  },
  {
    name: 'password',
    label: '비밀번호',
    placeholder: '비밀번호를 입력하세요',
    type: 'password',
    autoComplete: 'new-password',
    hint: '영문 + 숫자 + 특수문자 8자 이상',
  },
  {
    name: 'passwordConfirm',
    label: '비밀번호 확인',
    placeholder: '비밀번호를 다시 입력하세요',
    type: 'password',
    autoComplete: 'new-password',
  },
  {
    name: 'name',
    label: '이름',
    placeholder: '실명을 입력하세요',
    autoComplete: 'name',
  },
  {
    name: 'email',
    label: '이메일',
    placeholder: '이메일 주소를 입력하세요',
    type: 'email',
    autoComplete: 'email',
  },
  {
    name: 'phone',
    label: '전화번호',
    placeholder: '010-0000-0000',
    type: 'tel',
    autoComplete: 'tel',
    hint: '숫자 입력 시 자동 형식 적용',
  },
];

// 약관 동의 배열
const terms = [
  { name: 'terms', label: '[필수] 서비스 이용약관' },
  { name: 'privacy', label: '[필수] 개인정보 처리방침' },
  { name: 'marketing', label: '[선택] 마케팅 정보 수신 동의' },
];

// 전화번호에서 숫자만 남기고, 입력 길이에 따라 하이픈(-)을 붙이는 함수
function formatPhoneNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  const areaLength = digits.startsWith('02') ? 2 : 3;
  if (digits.length <= areaLength) return digits;
  if (digits.length <= areaLength + 3)
    return `${digits.slice(0, areaLength)}-${digits.slice(areaLength)}`;
  const middleEnd =
    digits.length <= areaLength + 7 ? areaLength + 3 : areaLength + 4;
  return `${digits.slice(0, areaLength)}-${digits.slice(areaLength, middleEnd)}-${digits.slice(middleEnd)}`;
}

export default function SignupPage({ onBack }) {
  // 초기값 & 상태 설정

  // 안내 메세지
  const [message, setMessage] = useState('');

  // 회원가입 입력값 상태 (초기값: 공백)
  const [form, setForm] = useState({
    userId: '',
    password: '',
    passwordConfirm: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    addressDetail: '',
  });

  // 약관 동의
  const [agreement, setAgreement] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  });

  // 아이디 중복 확인 value: 확인한 아이디, idle: 확인 전 아이디
  const [duplication, setDuplication] = useState({ value: '', status: 'idle' });

  // 항목 별 에러 메세지
  const [errors, setErrors] = useState({});

  // 모든 약관 동의 확인
  const isAllAgreed = Object.values(agreement).every(Boolean);

  function handleInputChange(event) {
    const { name, value } = event.target; // 입력창에 기입한 데이터 가져오기

    // 이전 상태를 받아 새 값을 반환하는 함수
    setForm((previous) => ({
      ...previous,
      // 이름 항목 변경 & 전화번호라면 (-) 붙히기
      [name]: name === 'phone' ? formatPhoneNumber(value) : value,
    }));

    // 이전 상태를 받아 수정된 항목의 오류 메세지 지우는 함수
    setErrors((previous) => ({
      ...previous,
      [name]: '',
      // 비밀번호 수정 시 비밀번호 확인의 오류도 삭제
      ...(name === 'password' ? { passwordConfirm: '' } : {}),
    }));

    // 아이디 수정 시 중복확인 상태 초기화 (아이디 바꾸면 중복확인 다시 해야 하는 코드)
    if (name === 'userId') setDuplication({ value: '', status: 'idle' });

    setMessage(''); // 화면에 공통 메세지 삭제
  }

  // 아이디 중복 확인
  async function handleDuplicateCheck() {
    const userId = form.userId;

    // 정규 표현식 (아이디 중복 확인 체크)
    if (!/^[a-zA-Z0-9]{4,20}$/.test(form.userId)) {
      setErrors((previous) => ({
        ...previous,
        userId: '아이디는 영문, 숫자 4~20자로 입력해 주세요.',
      }));
      return;
    }

    setErrors((previous) => ({ ...previous, userId: '' }));
    setDuplication({ value: userId, status: 'checking' });

    // api에 있는 데이터 확인
    try {
      const response = await fetch(
        `http://localhost:8080/api/check-userid?userId=${encodeURIComponent(userId)}`,
      );

      if (!response.ok) throw new Error('중복 확인 요청 실패');

      // 중복확인 여부
      const isDuplicate = await response.json();

      // 형식 다르면 오류 던지기
      if (typeof isDuplicate !== 'boolean') {
        throw new Error('응답 형식 확인');
      }

      // 중복 확인 결과를 상태에 반영
      setDuplication((previous) => {
        // 요청 중 아이디가 변경되어 상태가 초기화됐다면 결과 무시
        if (previous.value !== userId || previous.status !== 'checking') {
          return previous;
        }

        return {
          value: userId,
          status: isDuplicate ? 'unavailable' : 'available',
        };
      });
    } catch {
      // 현재 확인 중인 아이디에 대한 요청 실패만 반영
      setDuplication((previous) =>
        previous.value === userId && previous.status === 'checking'
          ? { value: userId, status: 'error' }
          : previous,
      );
    }
  }

  // 약관 동의 체크
  function handleAgreementChange(event) {
    const { name, checked } = event.target; // 변경한 약관 이름과 체크 여부 가져오기
    setAgreement((previous) => ({ ...previous, [name]: checked })); // 다른 약관은 유지하고 해당 약관의 체크 여부 변경
    setErrors((previous) => ({ ...previous, agreement: '' })); // 체크 상태 변경 시 약관 오류 메세지 없애기
    setMessage('');
  }

  function handleAllAgreementsChange(event) {
    const { checked } = event.target; // 약관에 체크 여부 가져오기
    setAgreement({ terms: checked, privacy: checked, marketing: checked }); // 모든 약관 체크 상태로 변경
    setErrors((previous) => ({ ...previous, agreement: '' })); // 오류 메세지 없애기
    setMessage('');
  }

  // 아이디 형식, 비밀번호 조건·일치 여부, 이메일, 주소, 약관 동의 검사 코드
  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {}; // 항목 별 오류를 담을 빈 객체 생성

    if (!/^[a-zA-Z0-9]{4,20}$/.test(form.userId))
      nextErrors.userId = '아이디는 영문, 숫자 4~20자로 입력해 주세요.';
    if (
      !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,}$/.test(form.password)
    )
      nextErrors.password =
        '영문, 숫자, 특수문자를 포함해 8자 이상 입력해 주세요.';
    if (!form.passwordConfirm || form.password !== form.passwordConfirm)
      nextErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    if (!form.name.trim()) nextErrors.name = '이름을 입력해 주세요.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      nextErrors.email = '이메일 주소를 확인해 주세요.';
    if (!/^0\d{8,10}$/.test(form.phone.replace(/-/g, '')))
      nextErrors.phone = '전화번호를 확인해 주세요.';
    if (!form.address.trim()) nextErrors.address = '주소를 입력해 주세요.';
    if (!agreement.terms || !agreement.privacy)
      nextErrors.agreement = '필수 약관에 동의해 주세요.';

    // 에러 발생 시 객체에 저장 후 화면에 보여주기
    setErrors(nextErrors);

    const firstError = Object.keys(nextErrors)[0];

    if (firstError) {
      setMessage('입력 내용을 확인해 주세요.');
      event.currentTarget.elements
        .namedItem(
          firstError === 'agreement'
            ? !agreement.terms
              ? 'terms'
              : 'privacy'
            : firstError,
        )
        ?.focus();
      return;
    }
    try {
      const response = await fetch('http://localhost:8080/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setMessage('회원가입이 완료되었습니다!');
        onBack(); // 회원가입 성공 시 -> 로그인 화면으로 전환
      } else {
        setMessage('회원가입에 실패했습니다.');
      }
    } catch (error) {
      // 콘솔에서 오류 코드 보기
      console.log(error);
      setMessage('서버와 연결할 수 없습니다.');
    }
  }

  return (
    // UI 하면 구현
    <main className="login-page signup-page">
      <section
        className="login-phone signup-phone"
        aria-labelledby="signup-title">
        <div className="login-status" aria-hidden="true">
          <span>9:41</span>
          <span>▮▮▮ · ▰</span>
        </div>
        <header className="signup-header">
          <button
            className="signup-back"
            type="button"
            onClick={onBack}
            aria-label="로그인 화면으로 돌아가기">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* 제목 */}
          <h1 id="signup-title">회원가입</h1>
        </header>

        {/* Form 태그 시작 */}
        <form className="signup-form" onSubmit={handleSubmit} noValidate>
          <div className="signup-content">
            {/* map을 활용하여 각 항목의 input 박스 생성 */}
            {fields.map(
              ({
                name,
                label,
                placeholder,
                type = 'text',
                autoComplete,
                hint,
              }) => (
                <div className="signup-field" key={name}>
                  <label htmlFor={`signup-${name}`}>
                    {label} <span aria-hidden="true">*</span>
                  </label>
                  <div className="signup-input-row">
                    {/* 항목 별 입력칸 및 중복 확인 버튼 */}
                    <input
                      id={`signup-${name}`}
                      name={name}
                      type={type}
                      value={form[name]}
                      onChange={handleInputChange}
                      placeholder={placeholder}
                      autoComplete={autoComplete}
                      required
                      aria-invalid={Boolean(errors[name])}
                      aria-describedby={`signup-${name}-help`}
                    />
                    {/* 아이디에만 중복 확인 버튼 생성 */}
                    {name === 'userId' && (
                      <button
                        className="signup-small-button"
                        type="button"
                        onClick={handleDuplicateCheck}>
                        중복확인
                      </button>
                    )}
                  </div>

                  <div id={`signup-${name}-help`}>
                    {hint && <p className="signup-hint">{hint}</p>}

                    {/* 입력값 형식 오류 표시 */}
                    {errors[name] && (
                      <p className="signup-error" role="alert">
                        {errors[name]}
                      </p>
                    )}

                    {/* 아이디 입력칸에 중복 확인 상태 표시 */}
                    {name === 'userId' && (
                      <p role="status">
                        {duplication.status === 'checking' &&
                          '중복 확인 중입니다.'}
                        {duplication.status === 'available' &&
                          '사용 가능한 아이디입니다.'}
                        {duplication.status === 'unavailable' &&
                          '이미 사용 중인 아이디입니다.'}
                        {duplication.status === 'error' &&
                          '중복 확인에 실패했습니다. 다시 시도해 주세요.'}
                      </p>
                    )}
                  </div>
                </div>
              ),
            )}

            {/* 주소 입력 */}
            <div className="signup-field">
              <label htmlFor="signup-address">
                주소 <span aria-hidden="true">*</span>
              </label>
              <div className="signup-input-row">
                <input
                  id="signup-address"
                  name="address"
                  value={form.address}
                  onChange={handleInputChange}
                  placeholder="주소를 입력하거나 검색하세요"
                  autoComplete="street-address"
                  required
                  aria-invalid={Boolean(errors.address)}
                  aria-describedby="signup-address-help"
                />

                {/* DB 연결 후 주소 검색 확인*/}
                <button
                  className="signup-search"
                  type="button"
                  aria-label="주소 검색"
                  onClick={() =>
                    setMessage(
                      '주소 검색 기능은 준비 중입니다. 주소를 직접 입력해 주세요.',
                    )
                  }>
                  {/* 돋보기 아이콘 */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
              </div>
              <div id="signup-address-help">
                <p className="signup-hint">주변 모임 탐색에 사용됩니다</p>
                {errors.address && (
                  <p className="signup-error">{errors.address}</p>
                )}
              </div>
              {form.address.trim() && (
                <div className="signup-input-row signup-address-detail">
                  <input
                    aria-label="상세주소 (선택)"
                    name="addressDetail"
                    value={form.addressDetail}
                    onChange={handleInputChange}
                    placeholder="상세주소를 입력하세요 (선택)"
                    autoComplete="address-line2"
                  />
                </div>
              )}
            </div>

            {/* 약관 동의 요소 만들기 */}
            <fieldset
              className="signup-agreements"
              aria-describedby="signup-agreement-error">
              <legend>약관 동의</legend>

              {/* 전체 동의 체크박스 */}
              <label className="signup-all">
                <input
                  type="checkbox"
                  checked={isAllAgreed}
                  onChange={handleAllAgreementsChange}
                />
                전체 동의
              </label>

              {/* map() 이용하여 terms 배열에서 각 객체들의 이름과 내용 가져오기*/}
              {terms.map(({ name, label }) => (
                <div className="signup-agreement-row" key={name}>
                  <label>
                    {/* 체크 박스 */}
                    <input
                      type="checkbox"
                      name={name}
                      checked={agreement[name]}
                      onChange={handleAgreementChange}
                      required={name !== 'marketing'}
                    />

                    {/* 내용 */}
                    {label}
                  </label>

                  {/* 더보기 버튼 (추후 추가) */}
                  <button
                    type="button"
                    aria-label={`${label} 내용 보기`}
                    onClick={() =>
                      setMessage(`${label} 내용은 준비 중입니다.`)
                    }>
                    ›
                  </button>
                </div>
              ))}

              <p id="signup-agreement-error" className="signup-error">
                {errors.agreement}
              </p>
            </fieldset>
          </div>
          {/* content 끝 */}

          {/* message 상태 메세지 출력됨 */}
          <footer className="signup-footer">
            <p className="signup-message" role="status">
              {message}
            </p>

            {/* 회원가입 버튼 */}
            <button className="login-submit signup-submit" type="submit">
              회원가입 완료
            </button>
          </footer>
        </form>
        <div className="login-home-indicator" aria-hidden="true" />
      </section>
    </main>
  );
}
