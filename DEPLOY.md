# Vercel 배포 가이드 🚀

## 1단계: Anthropic API Key 발급

1. https://console.anthropic.com 접속
2. 로그인 (없으면 회원가입)
3. Settings → API Keys
4. `Create Key` 클릭
5. API Key 복사 (한 번만 보여줌!)

💡 무료 크레딧: $5 (약 5,000장 OCR 가능)

---

## 2단계: Vercel 계정 생성

1. https://vercel.com 접속
2. `Sign Up` → **GitHub로 로그인** (추천)
3. Hobby Plan (무료) 선택

---

## 3단계: GitHub에 코드 올리기

### 방법 A: GitHub Desktop (쉬움)

1. GitHub Desktop 설치
2. `File` → `New Repository`
3. Name: `vocabulary-app`
4. 다운로드한 폴더 선택
5. `Publish repository` 클릭

### 방법 B: 웹 업로드

1. GitHub.com → New repository
2. Name: `vocabulary-app`
3. `uploading an existing file` 클릭
4. 모든 파일 드래그앤드롭 (아래 파일들 포함):
   - index.html
   - style.css
   - app.js
   - manifest.json
   - icon.svg
   - package.json
   - vercel.json
   - .gitignore
   - api/ocr.js (폴더째 업로드)

---

## 4단계: Vercel에 배포

1. Vercel 대시보드 접속
2. `Add New...` → `Project` 클릭
3. `Import Git Repository` → GitHub 연결
4. `vocabulary-app` 저장소 선택
5. `Import` 클릭

### 환경변수 설정 (중요!)

6. `Environment Variables` 섹션에서:
   - Name: `ANTHROPIC_API_KEY`
   - Value: [1단계에서 복사한 API Key 붙여넣기]
   - 환경: `Production`, `Preview`, `Development` 모두 체크
7. `Add` 클릭
8. `Deploy` 클릭

⏱️ 배포 완료까지 1-2분 소요

---

## 5단계: 완료! 🎉

배포 완료되면:
- URL: `https://vocabulary-app-xxx.vercel.app`
- iPhone Safari에서 접속
- 공유 버튼 → "홈 화면에 추가"

---

## 이후 업데이트 방법

GitHub에 코드를 push하면 **자동으로 Vercel에 배포**됩니다!

```bash
# 파일 수정 후
git add .
git commit -m "업데이트 내용"
git push
```

30초 후 자동 배포 완료! ✨

---

## 비용

- **Vercel**: 무료 (Hobby Plan)
- **Claude API**: 
  - 무료 크레딧: $5
  - 이후: 이미지 1장당 약 $0.001 (1,000장에 $1)
  - 한 달 100장 OCR: 약 $0.10

---

## 문제 해결

### "ANTHROPIC_API_KEY is not defined" 오류
→ Vercel 프로젝트 → Settings → Environment Variables에서 API Key 확인

### OCR이 작동 안 함
→ Vercel 함수 로그 확인: 프로젝트 → Deployments → 클릭 → Functions 탭

### 배포 실패
→ package.json이 저장소 루트에 있는지 확인

---

## 도움이 필요하면

Vercel 대시보드에서 실시간 로그 확인 가능!
