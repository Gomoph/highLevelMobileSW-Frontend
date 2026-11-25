// src/App.jsx — 로그인 상태와 화면 전환 및 선택 장소를 관리하는 앱 컴포넌트
import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useRoutes } from 'react-router';
import './App.css';
import {
  addFavoriteMeeting,
  getFavoriteMeetings,
  removeFavoriteMeeting,
} from './api/favorites.js';
import { getMeetingById } from './api/meetings.js';
import LoginPage from './pages/auth/LoginPage.jsx';
import FindIdPage from './pages/auth/FindIdPage.jsx';
import FindPasswordPage from './pages/auth/FindPasswordPage.jsx';
import SignupPage from './pages/auth/SignupPage.jsx';
import PublicHomePage from './pages/home/PublicHomePage.jsx';
import BottomNavigation from './components/layout/BottomNavigation.jsx';
import HomePage from './pages/home/HomePage.jsx';
import CreateMeetingPage from './pages/meetings/CreateMeetingPage.jsx';
import MeetingDetail from './pages/meetings/MeetingDetail.jsx';
import MyPage from './pages/MyPage/MyPage.jsx';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [screen, setScreen] = useState('home');
  // 로그인 정보는 메모리에 보관하며 새로고침하면 초기화됩니다.
  const [loginInfo, setLoginInfo] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [detailReturnScreen, setDetailReturnScreen] = useState('home');
  const [favoriteMeetings, setFavoriteMeetings] = useState([]);
  const [favoritesError, setFavoritesError] = useState('');
  const sharedMeetingId = new URLSearchParams(location.search).get('meetingId');

  const handleLoginSuccess = async (info) => {
    setLoginInfo(info);
    if (sharedMeetingId) {
      try {
        const meeting = await getMeetingById(sharedMeetingId);
        setSelectedMeeting(meeting);
        setDetailReturnScreen('home');
        setScreen('detail');
        navigate('/app', { replace: true });
        return;
      } catch {
        // 링크의 모임이 삭제되었거나 접근할 수 없으면 홈으로 진입합니다.
      }
    }
    setScreen('home');
    navigate('/app', { replace: true });
  };

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

  const routePage = useRoutes([
    {
      path: '/',
      element: (
        <PublicHomePage
          isLoggedIn={Boolean(loginInfo)}
          userName={loginInfo?.name}
          onLogin={() => navigate({ pathname: '/login', search: location.search })}
          onSignup={() => navigate({ pathname: '/signup', search: location.search })}
          onProfile={() => {
            setScreen('mypage');
            navigate('/app');
          }}
        />
      ),
    },
    {
      path: '/login',
      element: (
        <LoginPage
          onBack={() => navigate({ pathname: '/', search: location.search })}
          onLoginSuccess={handleLoginSuccess}
          onSignup={() => navigate({ pathname: '/signup', search: location.search })}
          onFindId={() => navigate({ pathname: '/find-id', search: location.search })}
          onFindPassword={() => navigate({ pathname: '/find-password', search: location.search })}
        />
      ),
    },
    {
      path: '/signup',
      element: (
        <SignupPage
          onBack={() => navigate({ pathname: '/', search: location.search })}
          onSignupSuccess={() =>
            navigate({ pathname: '/login', search: location.search })
          }
        />
      ),
    },
    {
      path: '/find-id',
      element: (
        <FindIdPage
          onBack={() => navigate({ pathname: '/login', search: location.search })}
        />
      ),
    },
    {
      path: '/find-password',
      element: (
        <FindPasswordPage
          onBack={() => navigate({ pathname: '/login', search: location.search })}
        />
      ),
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ]);

  if (location.pathname !== '/app') return routePage;

  if (!loginInfo) {
    return <Navigate to="/login" replace />;
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
          onMeetingSelect={(meeting) => {
            setSelectedMeeting(meeting);
            setDetailReturnScreen('mypage');
            setScreen('detail');
          }}
          onNameChange={(name) => setLoginInfo((current) => ({ ...current, name }))}
          onLogout={() => {
            setLoginInfo(null);
            setFavoriteMeetings([]);
            setFavoritesError('');
            setScreen('home');
            navigate('/');
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
          token={loginInfo.token}
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

  return <Navigate to="/app" replace />;
}
