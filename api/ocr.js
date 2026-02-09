import Anthropic from '@anthropic-ai/sdk';

const OCR_PROMPT = `이 이미지는 영어 단어 및 표현 학습 자료이다. 이미지를 정밀하게 읽고 데이터를 추출하라.

# 1단계: 정밀 추출
- 이미지의 표 구조(번호, 영어, 한글)를 완벽하게 파악하라.
- **영어(ENG)**: 단어뿐만 아니라 'revolve around', 'courtly love'와 같은 구(phrase)도 포함된다. 보이는 그대로 추출하라.
- **한글(KOR)**: 핵심 뜻, 한자(한자), 괄호 안의 보충 설명 등을 누락 없이 모두 추출하라.
  - 예: '의태(擬態)', '환초(環礁), 환상 산호섬', '색대칭 (햇빛에 노출된 부분은...)' 등 모든 텍스트를 포함하라.
- **번호**: 표의 맨 왼쪽 숫자를 추출하라.

# 2단계: 데이터 정제 및 교정
- 오타 교정: 문맥상 명백한 오인식(예: '1'↔'l', '0'↔'O')만 교정하라.
- 불필요한 공백 제거: 단어 앞뒤의 불필요한 공백은 제거하되, 뜻 내부의 공백은 유지하라.
- 줄바꿈 처리: 한 칸에 여러 줄이 있는 경우, 자연스럽게 이어지도록 처리하되 의미상 분리가 필요하면 \\n을 사용하라.

# 3단계: 구조화 (JSON 포맷)
이미지의 데이터를 아래 규칙에 따라 JSON 배열로 변환하라.

- **number**: 모든 데이터에 대해 "1"로 설정하라. (이미지 하나를 하나의 세트로 처리)
- **word**: "번호. 영어단어" 형식으로 작성하라. (예: "1. countershading", "2. phrase")
- **meaning**: 한글 뜻 전체. 아래의 우선순위로 구성하라:
  1. 핵심 뜻 (한자 포함)
  2. 괄호 안의 설명이나 보충 정보 (그대로 유지)
  3. 만약 '예문'이나 '예)' 등이 있다면 줄바꿈(\\n) 후 [예] 태그로 시작하여 기입

# 출력 규칙
- 오직 JSON 배열만 출력하라. (설명, 마크다운 코드 블록 등 일체 제외)
- 형식: [{"number":"1","word":"1. countershading","meaning":"색대칭 (햇빛에 노출된 부분은 어두운 색, 그늘진 부분은 밝은 색이 되는 현상)"}, ...]`;

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
