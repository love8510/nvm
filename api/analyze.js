export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.' });

  const { stats, totalChecks, totalPersons, period } = req.body || {};
  if (!stats || !Array.isArray(stats)) return res.status(400).json({ error: 'stats 데이터가 필요합니다.' });

  const top = stats.slice(0, 15);
  const lines = top.map((s, i) =>
    `${i + 1}. [${s.section}] ${s.label}\n   위험 응답: ${s.dangerCount}/${s.total}건 (${s.percentage}%)`
  ).join('\n');

  const prompt = `당신은 재가 노인 낙상예방 전문가입니다.
아래는 ${period || '전체 기간'} 동안 ${totalPersons || '?'}명의 어르신, 총 ${totalChecks || '?'}건의 가정환경 낙상위험도 점검 결과에서
가장 많이 "위험(아니오)" 응답이 나온 항목 상위 목록입니다.

${lines}

다음 내용을 분석해주세요:
1. 가장 위험한 구역과 핵심 위험 요인 요약
2. 어르신들에게 가장 필요한 복지 서비스·지원 (구체적으로 3~5가지)
3. 우선 개입이 필요한 항목과 실천 가능한 개선 방안
4. 종합 위험도 평가 및 프로그램 권고사항

전문적이고 실용적으로, 한국어로 답변해주세요.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 2000,
        thinking: { type: 'adaptive' },
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: 'Claude API 오류: ' + err });
    }

    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '';
    return res.status(200).json({ analysis: text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
