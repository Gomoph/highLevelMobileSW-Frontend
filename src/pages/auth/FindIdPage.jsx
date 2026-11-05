// src/pages/auth/FindIdPage.jsx — 아이디 찾기 폼과 이름·전화번호 입력 검증

import { useState } from 'react';
import './Auth.css';
import './AccountRecovery.css';

export default function FindIdPage({ onBack }) {
  const [message, setMessage] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    if (!data.get('name').trim()) {
      setMessage('가입 시 등록한 이름을 입력해 주세요.');
      form.elements.namedItem('name').focus();
      return;
    }

    const phone = data.get('phone').replace(/[\s-]/g, '');
    if (!/^0\d{8,10}$/.test(phone)) {
      setMessage('전화번호를 확인해 주세요.');
      form.elements.namedItem('phone').focus();
      return;
    }

    setMessage('아이디 조회 기능은 준비 중입니다.');
  }

  return (
    <main className="login-page">
      <section
        className="login-phone find-id-phone"
        aria-labelledby="find-id-title">
        <div className="login-status" aria-hidden="true">
          <span>9:41</span>
          <span>▮▮▮ · ▰</span>
        </div>
        <header className="find-id-header">
          {/* 기존 화면으로 돌아가는 버튼 */}
          <button
            className="find-id-back"
            type="button"
            onClick={onBack}
            aria-label="로그인 화면으로 돌아가기">
            {/* 왼쪽 화살표 버튼 */}
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
          <h1 id="find-id-title">아이디 찾기</h1>
        </header>
        <div className="find-id-content">
          <div className="find-id-intro">
            <div className="find-id-icon" aria-hidden="true">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p>
              가입 시 등록한 이름과 전화번호를
              <br />
              입력하면 아이디를 확인할 수 있습니다.
            </p>
          </div>
          <form onSubmit={handleSubmit} onChange={() => setMessage('')}>
            <div className="find-id-fields">
              <label className="find-id-field">
                <span>
                  이름{' '}
                  <span className="find-id-required" aria-hidden="true">
                    *
                  </span>
                </span>
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="가입 시 등록한 이름을 입력하세요"
                  required
                />
              </label>
              <label className="find-id-field">
                <span>
                  전화번호{' '}
                  <span className="find-id-required" aria-hidden="true">
                    *
                  </span>
                </span>
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="010-0000-0000"
                  required
                />
              </label>
            </div>
            <button className="login-submit find-id-submit" type="submit">
              아이디 찾기
            </button>
            <p className="login-message" role="status">
              {message}
            </p>
          </form>
        </div>
        <div className="login-home-indicator" aria-hidden="true" />
      </section>
    </main>
  );
}
