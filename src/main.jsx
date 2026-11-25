// src/main.jsx — React 앱을 루트 DOM에 마운트하는 진입점
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';
import App from './App.jsx';
import PhoneFrame from './components/layout/PhoneFrame.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PhoneFrame>
        <App />
      </PhoneFrame>
    </BrowserRouter>
  </StrictMode>,
);
