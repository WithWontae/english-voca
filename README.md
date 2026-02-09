# 국어 단어암기 앱

고등학생을 위한 단어 암기 웹앱

## 주요 기능

- 📷 사진으로 단어 추가 (Claude AI OCR)
- 📊 번호별 자동 세트 그룹핑 (22번, 23번 등)
- 🔄 클래스카드 스타일 학습
- ✓ 암기 상태 표시
- 💾 로컬 저장
- 📱 PWA 지원

## Vercel 배포 방법

### 1. GitHub 저장소 생성
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/사용자명/vocabulary-app.git
git push -u origin main
```

### 2. Vercel 연결
1. https://vercel.com 접속
2. GitHub 연동
3. Import Project
4. vocabulary-app 저장소 선택

### 3. 환경 변수 설정
Vercel 프로젝트 → Settings → Environment Variables
- Name: `ANTHROPIC_API_KEY`
- Value: Claude API 키
- Environments: Production, Preview, Development 모두 체크

### 4. 배포
- 자동 배포 완료
- URL: https://vocabulary-app-xxx.vercel.app

## 파일 구조

```
vocabulary-app/
├── index.html          # 메인 HTML
├── style.css           # 스타일
├── app.js              # 클라이언트 로직
├── api/
│   └── ocr.js         # Vercel 서버리스 함수
├── package.json        # 의존성
├── vercel.json         # Vercel 설정
└── manifest.json       # PWA 설정
```

## 작동 원리

1. **사진 촬영** → HEIC 자동 변환
2. **Claude API** → 표 형식 텍스트 추출
3. **번호별 그룹핑** → 22번, 23번 자동 분리
4. **개별 저장** → 각 세트 독립 관리
5. **학습** → 클래스카드 스타일

## 로컬 테스트

```bash
# Vercel CLI 설치
npm i -g vercel

# 로컬 실행
vercel dev

# .env 파일 생성
echo "ANTHROPIC_API_KEY=your_key" > .env
```

## 업데이트

```bash
git add .
git commit -m "Update message"
git push
```

Vercel이 자동으로 재배포합니다.

## 주의사항

- ANTHROPIC_API_KEY는 Vercel 환경 변수에만 설정
- .env 파일은 절대 커밋하지 않기 (.gitignore 확인)
- 캐시 문제 시 Vercel에서 "Redeploy" (캐시 비활성화)
