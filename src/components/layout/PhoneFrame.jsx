// src/components/layout/PhoneFrame.jsx — 375×812 화면과 노치가 있는 아이폰 미리보기 프레임
import './PhoneFrame.css';

export default function PhoneFrame({ children }) {
  return (
    <div className="phone-preview">
      <div className="phone-frame">
        <div className="phone-screen">
          <div className="phone-app-content">{children}</div>
          <div className="phone-notch" aria-hidden="true">
            <span className="phone-speaker" />
            <span className="phone-camera" />
          </div>
          <div className="phone-home-indicator" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
