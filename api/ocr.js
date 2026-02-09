import Anthropic from '@anthropic-ai/sdk';

const OCR_PROMPT = `이 이미지는 영어 단어 학습 자료이다. 이미지를 정밀하게 읽고 단어를 추출하라.

# 1단계: 이미지를 정확히 읽어라
- 이미지에 실제로 보이는 모든 텍스트(영어 단어, 한글 뜻, 숫자, 특수 기호 등)를 누락 없이 추출하라. 절대 추측하거나 지어내지 마라.
- 글자가 흐리거나 잘려도 최대한 원본 그대로 읽어라.
- **색상 무관**: 텍스트의 색상(파란색, 빨간색 등), 배경색, 음영 처리 여부에 상관없이 모든 텍스트를 동일한 비중으로 추출하라.
- 영어는 영어 그대로, 한글은 한글 그대로 유지하라.
- 표의 구조(행과 열)를 정밀하게 추적하여 데이터가 섞이지 않게 하라.

# 2단계: 문맥 교정
추출한 텍스트에서 아래 항목만 교정하라:
- 비슷하게 생긴 글자의 오인식 (예: 'l'↔'1', 'O'↔'0')
- 명백한 철자 오류 (영어 단어 문맥에서 판단)
- 나머지는 원본 그대로 유지

# 3단계: 구조 파악
이미지는 항상 "영어 단어 → 한글 뜻" 구조의 학습 자료이다.
텍스트 색상, 배경색, 글꼴 크기는 자료마다 다를 수 있지만 구조는 동일하다.
색상에 속지 말고 내용(단어와 뜻)에 집중하라.

이미지에서 다음 정보를 식별하라:
- 세트 번호: 표의 첫 열에 있는 숫자 (다른 색상이거나 굵은 글씨일 수 있음). 번호가 나타난 행부터 다음 번호 전까지 같은 세트.
- 단어: 영어 단어 (word 필드에 저장)
- 뜻/부가정보: 한글 뜻, 품사, 유의어, 반의어, 예문 등 (meaning 필드에 저장). **특히 '예', '(예)', '예시', 'ex)' 문구는 위치에 상관없이 반드시 추출하여 해당 단어의 의미 끝에 붙여라.**

번호 칸이 비어 있으면 바로 위 행의 번호를 그대로 사용하라.
세트 번호가 아예 없는 자료는 모든 단어의 number를 "1"로 설정하라.

# 4단계: meaning 포맷
한 단어와 관련된 모든 내용을 meaning 필드 하나에 담아라.
**중요: 예시 문장([예])은 항상 뜻의 가장 마지막 줄에 배치하라.**
줄바꿈은 리터럴 문자열 \\n을 사용하라.

포맷 규칙:
- 첫 줄: 핵심 뜻 (품사가 있으면 포함)
- 이후 줄: 부가 정보를 태그로 정리
  - 유의어, syn → [유]
  - 반의어, ant → [반]
  - 예문, 예시, ex) → [예]
  - 참고 → [참]

# 출력
JSON 배열만 출력하라. 설명, 마크다운, 코드블록 없이 순수 JSON만.
형식: [{"number":"번호","word":"영어단어","meaning":"한글뜻\\n[유] ...\\n[예] ..."},...]`;

export default async function handler(req, res) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image || !image.data) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Anthropic API 클라이언트
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Claude API 호출
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.media_type,
                data: image.data,
              },
            },
            {
              type: 'text',
              text: OCR_PROMPT,
            },
          ],
        },
      ],
    });

    // 응답 파싱
    const responseText = message.content[0].text.trim();
    console.log('Claude 응답:', responseText);

    let words;
    try {
      // JSON 추출
      let jsonText = responseText;

      // 마크다운 코드 블록 제거
      if (jsonText.includes('```')) {
        const match = jsonText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
        if (match) {
          jsonText = match[1];
        }
      }

      // [ ... ] 추출
      const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonText = arrayMatch[0];
      }

      words = JSON.parse(jsonText);

      // 유효성 검사
      if (!Array.isArray(words)) {
        throw new Error('배열이 아님');
      }

      // 필터링 및 정리
      words = words.filter(item =>
        item &&
        typeof item === 'object' &&
        item.word &&
        item.meaning
      ).map(item => ({
        number: item.number || '',
        word: item.word.trim(),
        meaning: item.meaning.trim()
      }));

    } catch (parseError) {
      console.error('파싱 오류:', parseError);
      words = [];
    }

    return res.status(200).json({ words });

  } catch (error) {
    console.error('OCR 오류:', error);
    // 실패하더라도 빈 단어 배열을 반환하여 클라이언트에서 처리하게 함
    return res.status(200).json({ words: [] });
  }
}
