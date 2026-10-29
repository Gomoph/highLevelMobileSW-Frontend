import { useState } from 'react';
import './App.css';
import Login from './pages/Login.jsx';
import FindId from './pages/FindId.jsx';
import FindPassword from './pages/FindPassword.jsx';
import Signup from './pages/Signup.jsx';
import Footer from './components/Footer.jsx';
import Home from './components/home/Home.jsx';
import CreateMeeting from './components/home/CreateMeeting.jsx';

export default function App() {
  const [screen, setScreen] = useState('login');
  // 로그인 정보는 메모리에 보관하며 새로고침하면 초기화됩니다.
  const [loginInfo, setLoginInfo] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // 로그인 페이지로 돌아가는 함수
  if (screen === 'findId') {
    return <FindId onBack={() => setScreen('login')} />;
  }

  if (screen === 'findPassword') {
    return <FindPassword onBack={() => setScreen('login')} />;
  }

  if (screen === 'signup') {
    return <Signup onBack={() => setScreen('login')} />;
  }

  if (screen === 'create' && loginInfo) {
    return <><CreateMeeting onBack={() => setScreen('home')} userName={loginInfo.name} token={loginInfo.token} selectedLocation={selectedLocation} /><Footer activeTab="home" /></>;
  }

  if (screen === 'home' && loginInfo) {
    return <><Home userName={loginInfo.name} onCreateTap={() => setScreen('create')} onLocationSelect={setSelectedLocation} /><Footer activeTab="home" /></>;
  }

  return (
    <Login
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
