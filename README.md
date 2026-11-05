# highLevelMobileSW

React frontend project

## 프론트엔드

**모이자** 서비스의 React 기반 프론트엔드입니다. 모바일 형태의 UI로 로그인, 회원가입, 아이디 찾기, 비밀번호 찾기 화면을 제공합니다.

### 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| UI | React 19, React DOM 19 |
| 언어 / 스타일 | JavaScript (JSX), CSS |
| 개발 서버 / 빌드 | Vite 8, @vitejs/plugin-react |
| 코드 검사 | ESLint 10, React Hooks / React Refresh 플러그인 |
| 상태 관리 / 통신 | React Hooks, Fetch API |

### 로컬 실행

Node.js 22.13 이상인 22.x 또는 Node.js 24 이상과 npm이 필요합니다.

```bash
git clone https://github.com/Gomoph/highLevelMobileSW-Frontend.git
cd highLevelMobileSW-Frontend
npm ci
npm run dev
```

터미널에 표시되는 개발 서버 주소로 접속합니다. 기본 주소는 `http://localhost:5173`이며, 포트가 사용 중이면 달라질 수 있습니다.

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 배포용 파일을 `dist/`에 생성 |
| `npm run preview` | 빌드 결과를 로컬에서 미리보기 (`npm run build` 후 실행) |
| `npm run lint` | ESLint 코드 검사 |


### 폴더 구조
