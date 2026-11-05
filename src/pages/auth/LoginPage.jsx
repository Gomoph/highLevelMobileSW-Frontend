// src/pages/auth/LoginPage.jsx — 아이디·비밀번호 로그인 및 계정 관련 화면 이동

import { useState } from 'react';
import LoginInputField from '../../components/auth/LoginInputField.jsx';
import './Auth.css';

export default function LoginPage({
  onFindId,
  onFindPassword,
  onSignup,
  onLoginSuccess,
}) {
  const [keepLoggedIn, setKeepLoggedIn] = useState(false); // 로그인 유지 선택 여부이며 실제 세션 저장은 서버 연결 후 처리
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault(); // 브라우저가 페이지를 새로 고치는 기본 동작을 막습니다.
    if (isSubmitting) return;
    const form = event.currentTarget; // 현재 제출한 form 요소를 가져옴
    const formData = new FormData(form);
    const userId = formData.get('userId').trim();
    const password = formData.get('password'); // 비밀번호의 공백은 그대로 유지

    if (!userId) {
      // 공백만 입력한 아이디도 빈 아이디로 처리합니다.
      setMessage('아이디를 입력해 주세요.'); // 사용자에게 아이디 입력을 안내합니다.
      form.elements.namedItem('userId').focus(); // 아이디 입력창으로 커서를 옮깁니다.
      return;
    }

    if (!password) {
      setMessage('비밀번호를 입력해 주세요.');
      form.elements.namedItem('password').focus();
      return;
    }

    setIsSubmitting(true);
    setMessage('로그인 요청 중입니다.');

    try {
      // 아이디와 비밀번호를 JSON 요청 본문으로 전송
      const response = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      });

      if (response.status === 401) {
        setMessage('아이디 또는 비밀번호를 확인해 주세요.');
      } else if (!response.ok) {
        setMessage('로그인 요청에 실패했습니다. 다시 시도해 주세요.');
      } else {
        // 성공 응답에서 토큰과 사용자 이름을 확인
        const data = await response.json().catch(() => null);
        if (
          !data ||
          typeof data.token !== 'string' ||
          !data.token.trim() ||
          typeof data.name !== 'string'
        ) {
          setMessage('로그인 응답 형식을 확인해 주세요.');
          return;
        }

        onLoginSuccess({ token: data.token, name: data.name });
      }
    } catch {
      setMessage('서버와 연결할 수 없습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      {/* 데스크톱에서는 원본처럼 휴대전화 형태로 표시하는 영역입니다. */}
      <section className="login-phone" aria-label="모이자 로그인">
        <div className="login-status" aria-hidden="true">
          <span>9:41</span>
          <span>▮▮▮ · ▰</span>
        </div>
        {/* 로고와 서비스 이름을 묶는 영역입니다. */}
        <header className="login-brand">
          {/* 원본에 있는 회색 점선 로고 영역을 재현합니다. */}
          <div className="login-logo" aria-hidden="true">
            {/* 로고 아이콘 */}
            {/* 별도 이미지 없이 위치 핀 아이콘을 그립니다. */}
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#555"
              strokeWidth="2"
              strokeLinecap="round">
              {/* 핀의 외곽선입니다. */}
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
              {/* 핀 가운데의 작은 원입니다. */}
              <circle cx="12" cy="10" r="3" />
            </svg>{' '}
            {/* 위치 아이콘을 마칩니다. */}
          </div>{' '}
          {/* 서비스 이름을 페이지 제목으로 표시합니다. */}
          <h1>모이자</h1>
        </header>{' '}
        {/* 입력값을 제출하는 폼이며 입력을 수정하면 이전 안내를 지웁니다. */}
        <form
          className="login-form"
          onSubmit={handleSubmit}
          onChange={() => setMessage('')}>
          {/* 아이디 자동 완성을 지원하는 입력창입니다. */}
          <LoginInputField name="userId" label="아이디" autoComplete="username" />
          {/* 비밀번호를 가리고 기존 비밀번호 자동 완성을 지원합니다. */}
          <LoginInputField
            name="password"
            label="비밀번호"
            type="password"
            autoComplete="current-password"
          />
          {/* 로그인 유지와 계정 찾기 버튼을 한 줄로 배치합니다. */}
          <div className="login-options">
            {/* 체크박스 글자를 눌러도 선택할 수 있게 label로 묶습니다. */}
            <label className="login-remember">
              {/* 체크 여부가 바뀔 때 React 상태를 갱신합니다. */}
              <input
                type="checkbox"
                name="keepLoggedIn"
                checked={keepLoggedIn}
                onChange={(event) => setKeepLoggedIn(event.target.checked)}
              />
              {/* 체크박스의 설명입니다. */}
              <span>로그인 상태 유지</span>
            </label>{' '}
            {/* 체크박스 영역을 마칩니다. */}
            {/* 추후 계정 찾기 화면과 연결할 버튼 영역입니다. */}
            <div className="login-help">
              {/* type을 button으로 지정하여 폼 제출을 방지합니다. */}
              <button type="button" onClick={onFindId}>
                아이디 찾기
              </button>
              <button type="button" onClick={onFindPassword}>
                비밀번호 찾기
              </button>
            </div>{' '}
            {/* 계정 찾기 버튼 영역을 마칩니다. */}
          </div>{' '}
          {/* 로그인 옵션 영역을 마칩니다. */}
          {/* 제출 버튼은 HTML의 필수 입력 검사 후 handleSubmit을 실행합니다. */}
          <button
            className="login-submit"
            type="submit"
            disabled={isSubmitting}>
            {isSubmitting ? '요청 중...' : '로그인'}
          </button>
          {/* 안내가 바뀌면 화면 읽기 프로그램에도 자동으로 전달됩니다. */}
          <p className="login-message" role="status">
            {message}
          </p>
        </form>{' '}
        {/* 로그인 폼을 마칩니다. */}
        {/* 원본처럼 화면 아래에 계정 생성 안내를 배치합니다. */}
        <footer className="login-footer">
          {/* 계정이 없는 사용자를 위한 안내입니다. */}
          <span>계정이 없으신가요?</span>
          <button type="button" onClick={onSignup}>
            계정 생성
          </button>
        </footer>{' '}
        {/* 하단 안내를 마칩니다. */}
        {/* 시안의 휴대전화 홈 표시 막대입니다. */}
        <div className="login-home-indicator" aria-hidden="true" />
      </section>{' '}
      {/* 휴대전화 영역을 마칩니다. */}
    </main> // 페이지 영역을 마칩니다.
  );
}
