import { useEffect, useState } from 'react';
import './Footer.css';

const ITEMS = [
  { id: 'mypage', label: '마이', message: '마이페이지는 준비 중입니다.' },
  { id: 'home', label: '홈', message: '' },
  { id: 'fav', label: '찜', message: '찜 목록은 준비 중입니다.' },
];

function FooterIcon({ name }) {
  if (name === 'mypage') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  }

  if (name === 'fav') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1 7.8 7.7 7.8-7.7 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>;
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2h-4v-9H9v9H5a2 2 0 0 1-2-2z"/></svg>;
}

export default function Footer({ activeTab = 'home' }) {
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timer = setTimeout(() => setToastMessage(''), 2000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  return (
    <>
      {toastMessage && <div role="status" className="footer-toast">{toastMessage}</div>}
      <nav className="app-footer glass-dock" aria-label="하단 메뉴">
        {ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`glass-dock-item${isActive ? ' glass-dock-item-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setToastMessage(item.message)}
            >
              <FooterIcon name={item.id} />
              <span className={isActive ? 'glass-dock-label-active' : 'glass-dock-label'}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
