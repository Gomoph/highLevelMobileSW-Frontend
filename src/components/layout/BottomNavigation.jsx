// src/components/layout/BottomNavigation.jsx — 주요 메뉴의 하단 탐색과 선택 상태 표시
import { useEffect, useState } from 'react';
import { FiHeart, FiHome, FiUser } from 'react-icons/fi';
import './BottomNavigation.css';

const ITEMS = [
  { id: 'mypage', label: '마이', message: '마이페이지는 준비 중입니다.' },
  { id: 'home', label: '홈', message: '' },
  { id: 'fav', label: '찜', message: '찜 목록은 준비 중입니다.' },
];

const FOOTER_ICONS = { mypage: FiUser, home: FiHome, fav: FiHeart };

function FooterIcon({ name }) {
  const Icon = FOOTER_ICONS[name];
  return <Icon aria-hidden="true" />;
}

export default function BottomNavigation({ activeTab = 'home', onNavigate }) {
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
              onClick={() => {
                const wasHandled = onNavigate?.(item.id);
                if (!wasHandled) setToastMessage(item.message);
              }}
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
