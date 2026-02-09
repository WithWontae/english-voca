# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 언어 규칙

모든 응답과 커밋 메시지, 코드 주석은 한국어로 작성할 것.

## 프로젝트 개요

영어 단어 암기 웹앱. 단어표 사진을 촬영하면 Claude AI가 OCR로 단어를 추출하고, 드래그 커버 방식의 학습 카드로 암기할 수 있다. 세트 내보내기/가져오기(JSON) 지원.

## 개발 명령어

```bash
# 의존성 설치
npm install

# 로컬 실행 (Vercel CLI 필요)
npm i -g vercel
vercel dev

# 환경 변수 — 프로젝트 루트에 .env 파일 생성
ANTHROPIC_API_KEY=your_key_here
```

빌드, 테스트, 린터 없음. 정적 파일 + 서버리스 함수로 배포.

## 아키텍처

**정적 SPA + Vercel Serverless Function** — 프레임워크 없음, 빌드 파이프라인 없음.

### 클라이언트 (브라우저)
- `index.html` — 단일 HTML, CSS 클래스 `.active`로 3개 화면 전환: 메인(`#menuScreen`), OCR(`#ocrScreen`), 학습(`#studyScreen`)
- `app.js` — 전체 클라이언트 로직. 전역 `AppState` 객체가 `wordSets`, `currentSet`, `currentSetIndex`, `currentIndex` 관리. `localStorage` 키 `englishVocaData`에 저장
- `style.css` — 모바일 우선, CSS 커스텀 프로퍼티 테마, 드래그 커버 카드 UI
- `manifest.json` — PWA 매니페스트

### 서버
- `api/ocr.js` — Vercel 서버리스 함수. base64 이미지를 POST로 받아 Claude API(`claude-sonnet-4-5-20250929`)에 영어 OCR 프롬프트로 호출, JSON 파싱 후 `{ words: [{number, word, meaning}, ...] }` 반환

### 데이터 흐름
1. 사진 업로드 → HEIC 자동 변환 → base64 인코딩
2. `POST /api/ocr` → Claude vision이 단어표 추출
3. 번호별 그룹핑(`groupByNumber()`) → 세트 저장
4. `AppState.wordSets` → localStorage 영속화
5. 학습 화면: 드래그 커버로 뜻 공개/숨기기, 아는 단어/학습중 상태 관리
6. 세트 전체 학습 완료 시 축하 오버레이 → 다음 미완료 세트 이동

### 핵심 설계
- DB 없음 — 브라우저 localStorage만 사용 (기기 간 동기화 없음)
- 인증 없음 — 서버리스 함수가 `ANTHROPIC_API_KEY` 환경 변수 사용
- OCR 응답의 `number` 필드는 세트 그룹핑 식별자 (예: "22", "23")
- 내보내기/가져오기: JSON 파일로 세트 데이터 백업 및 복원
