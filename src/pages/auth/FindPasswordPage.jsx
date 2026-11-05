// src/pages/auth/FindPasswordPage.jsx — 비밀번호 찾기 폼과 계정·본인 정보 입력 검증

import { useState } from 'react';
import './Auth.css';
import './AccountRecovery.css';

export default function FindPasswordPage({ onBack }) {
  const [message, setMessage] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    for (const [field, label] of [
      ['userId', '아이디'],
      ['name', '이름'],
    ]) {
      if (!data.get(field).trim()) {
        setMessage(`${label}를 입력해 주세요.`);
        form.elements.namedItem(field).focus();
        return;
      }
    }

    const phone = data.get('phone').replace(/[\s-]/g, '');
    if (!/^0\d{8,10}$/.test(phone)) {
      setMessage('전화번호를 확인해 주세요.');
      form.elements.namedItem('phone').focus();
      return;
    }

    setMessage('본인 확인 기능은 준비 중입니다.');
  }

  return (
    <main className="login-page">
      <section
        className="login-phone find-id-phone"
        aria-labelledby="find-password-title">
        <div className="login-status" aria-hidden="true">
          <span>9:41</span>
          <span>▮▮▮ · ▰</span>
        </div>
        <header className="find-id-header">
          <button
            className="find-id-back"
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
          <h1 id="find-password-title">비밀번호 찾기</h1>
        </header>
        <div className="find-id-content">
          <div className="find-id-intro">
            <div className="find-id-icon" aria-hidden="true">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <p>
              가입 시 등록한 정보를 입력하면
              <br />
              비밀번호를 재설정할 수 있습니다.
            </p>
          </div>
          <form onSubmit={handleSubmit} onChange={() => setMessage('')}>
            <div className="find-id-fields">
              <label className="find-id-field">
                <span>
                  아이디{' '}
                  <span className="find-id-required" aria-hidden="true">
                    *
                  </span>
                </span>
                <input
                  name="userId"
                  autoComplete="username"
                  placeholder="가입 시 사용한 아이디를 입력하세요"
                  required
                />
              </label>
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
              본인 확인
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
