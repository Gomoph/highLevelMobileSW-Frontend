// src/App.jsx — 로그인 상태와 화면 전환 및 선택 장소를 관리하는 앱 컴포넌트
import { useEffect, useState } from 'react';
import './App.css';
import {
  addFavoriteMeeting,
  getFavoriteMeetings,
  removeFavoriteMeeting,
} from './api/favorites.js';
import LoginPage from './pages/auth/LoginPage.jsx';
import FindIdPage from './pages/auth/FindIdPage.jsx';
import FindPasswordPage from './pages/auth/FindPasswordPage.jsx';
import SignupPage from './pages/auth/SignupPage.jsx';
import BottomNavigation from './components/layout/BottomNavigation.jsx';
import HomePage from './pages/home/HomePage.jsx';
import CreateMeetingPage from './pages/meetings/CreateMeetingPage.jsx';
import MeetingDetail from './pages/meetings/MeetingDetail.jsx';
import MyPage from './pages/MyPage/MyPage.jsx';

export default function App() {
  const [screen, setScreen] = useState('login');
  // 로그인 정보는 메모리에 보관하며 새로고침하면 초기화됩니다.
  const [loginInfo, setLoginInfo] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [detailReturnScreen, setDetailReturnScreen] = useState('home');
  const [favoriteMeetings, setFavoriteMeetings] = useState([]);
  const [favoritesError, setFavoritesError] = useState('');

  useEffect(() => {
    const token = loginInfo?.token;
    if (!token) return undefined;

    let isCurrent = true;
    getFavoriteMeetings(token)
      .then((meetings) => {
        if (isCurrent) {
          setFavoriteMeetings(Array.isArray(meetings) ? meetings : []);
          setFavoritesError('');
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setFavoritesError(error instanceof Error ? error.message : '찜 목록을 불러오지 못했어요.');
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [loginInfo?.token]);

  const handleBottomNavigation = (tab) => {
    if (tab === 'home' || tab === 'mypage' || tab === 'fav') {
      setScreen(tab);
      return true;
    }

    return false;
  };

  const toggleFavorite = async (meeting) => {
    const token = loginInfo?.token;
    if (!token || meeting?.id == null) throw new Error('로그인 정보 또는 모임 정보가 없습니다.');

    const alreadySaved = favoriteMeetings.some((saved) => saved.id === meeting.id);
    setFavoritesError('');
    try {
      if (alreadySaved) {
        await removeFavoriteMeeting(token, meeting.id);
        setFavoriteMeetings((current) => current.filter((saved) => saved.id !== meeting.id));
      } else {
        await addFavoriteMeeting(token, meeting.id);
        setFavoriteMeetings((current) => current.some((saved) => saved.id === meeting.id)
          ? current
          : [meeting, ...current]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '찜 상태를 저장하지 못했어요.';
      setFavoritesError(message);
      throw error;
    }
  };

  // 로그인 페이지로 돌아가는 함수
  if (screen === 'findId') {
    return <FindIdPage onBack={() => setScreen('login')} />;
  }

  if (screen === 'findPassword') {
    return <FindPasswordPage onBack={() => setScreen('login')} />;
  }

  if (screen === 'signup') {
    return <SignupPage onBack={() => setScreen('login')} />;
  }

  if (screen === 'create' && loginInfo) {
    return (
      <>
        <CreateMeetingPage
          onBack={() => setScreen('home')}
          userName={loginInfo.name}
          token={loginInfo.token}
          selectedLocation={selectedLocation}
        />
        <BottomNavigation
          activeTab="home"
          onNavigate={handleBottomNavigation}
        />
      </>
    );
  }

  if (screen === 'mypage' && loginInfo) {
    return (
      <>
        <MyPage
          userName={loginInfo.name}
          token={loginInfo.token}
          savedCount={favoriteMeetings.length}
          onOpenSaved={() => setScreen('fav')}
          onNameChange={(name) => setLoginInfo((current) => ({ ...current, name }))}
          onLogout={() => {
            setLoginInfo(null);
            setFavoriteMeetings([]);
            setFavoritesError('');
            setScreen('login');
          }}
        />
        <BottomNavigation
          activeTab="mypage"
          onNavigate={handleBottomNavigation}
        />
      </>
    );
  }

  if (screen === 'detail' && loginInfo) {
    return (
      <>
        <MeetingDetail
          meeting={selectedMeeting}
          isFavorite={favoriteMeetings.some((meeting) => meeting.id === selectedMeeting?.id)}
          onToggleFavorite={() => toggleFavorite(selectedMeeting)}
          onBack={() => setScreen(detailReturnScreen)}
        />
      </>
    );
  }

  if ((screen === 'home' || screen === 'fav') && loginInfo) {
    return (
      <>
        <HomePage
          userName={loginInfo.name}
          token={loginInfo.token}
          onCreateTap={() => setScreen('create')}
          onLocationSelect={setSelectedLocation}
          onMeetingSelect={(meeting) => {
            setSelectedMeeting(meeting);
            setDetailReturnScreen(screen);
            setScreen('detail');
          }}
          favoritesOpen={screen === 'fav'}
          favoriteMeetings={favoriteMeetings}
          favoritesError={favoritesError}
          onCloseFavorites={() => setScreen('home')}
          onToggleFavorite={toggleFavorite}
        />
        <BottomNavigation
          activeTab={screen === 'fav' ? 'fav' : 'home'}
          onNavigate={handleBottomNavigation}
        />
      </>
    );
  }

  return (
    <LoginPage
      onLoginSuccess={(info) => {
        setLoginInfo(info);
        setScreen('home');
      }}
      onSignup={() => setScreen('signup')}
      onFindId={() => setScreen('findId')}
      onFindPassword={() => setScreen('findPassword')}
    />
  );
}
