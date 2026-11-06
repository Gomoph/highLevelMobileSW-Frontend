// src/App.jsx — 로그인 상태와 화면 전환 및 선택 장소를 관리하는 앱 컴포넌트
import { useState } from 'react';
import './App.css';
import LoginPage from './pages/auth/LoginPage.jsx';
import FindIdPage from './pages/auth/FindIdPage.jsx';
import FindPasswordPage from './pages/auth/FindPasswordPage.jsx';
import SignupPage from './pages/auth/SignupPage.jsx';
import BottomNavigation from './components/layout/BottomNavigation.jsx';
import HomePage from './pages/home/HomePage.jsx';
import CreateMeetingPage from './pages/meetings/CreateMeetingPage.jsx';
import MeetingDetail from './pages/meetings/MeetingDetail.jsx';

export default function App() {
  const [screen, setScreen] = useState('login');
  // 로그인 정보는 메모리에 보관하며 새로고침하면 초기화됩니다.
  const [loginInfo, setLoginInfo] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

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
        <BottomNavigation activeTab="home" />
      </>
    );
  }

  if (screen === 'detail' && loginInfo) {
    return (
      <>
        <MeetingDetail
          meeting={selectedMeeting}
          onBack={() => setScreen('home')}
        />
        <BottomNavigation activeTab="home" />
      </>
    );
  }

  if (screen === 'home' && loginInfo) {
    return (
      <>
        <HomePage
          userName={loginInfo.name}
          token={loginInfo.token}
          onCreateTap={() => setScreen('create')}
          onLocationSelect={setSelectedLocation}
          onMeetingSelect={(meeting) => {
            setSelectedMeeting(meeting);
            setScreen('detail');
          }}
        />
        <BottomNavigation activeTab="home" />
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
