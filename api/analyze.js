export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.' });

  const { stats, sectionStats, totalChecks, totalPersons, period } = req.body || {};
  if (!stats || !Array.isArray(stats)) return res.status(400).json({ error: 'stats 데이터가 필요합니다.' });

  // 영역별 위험률 요약
  const sectionLines = (sectionStats || [])
    .map((s, i) => `  ${i + 1}위. ${s.section}: 위험률 ${s.percentage}% (${s.dangerCount}/${s.totalAnswered}건)`)
    .join('\n');

  // 문항별 상위 항목
  const itemLines = stats.slice(0, 15).map((s, i) =>
    `  ${i + 1}. [${s.section}] ${s.label}\n     위험 응답: ${s.dangerCount}/${s.total}건 (${s.percentage}%)`
  ).join('\n');

  const worstSection = sectionStats?.[0]?.section || '알 수 없음';
  const worstPct = sectionStats?.[0]?.percentage || 0;

  const prompt = `당신은 재가 노인 낙상예방 전문 복지사입니다.
아래는 ${period || '전체 기간'} 동안 ${totalPersons || '?'}명의 어르신, 총 ${totalChecks || '?'}건의 가정환경 낙상위험도 점검 데이터입니다.

【영역별 위험률 순위】
${sectionLines || '  데이터 없음'}

【위험 항목 빈도 상위 15건】
${itemLines}

위 데이터를 분석하여 아래 형식으로 실무에서 바로 활용할 수 있는 보완 보고서를 작성해주세요.

---

## 1. 종합 위험도 요약
(전체 점검 결과에서 드러난 핵심 위험 패턴을 2~3문장으로 요약)

## 2. 최우선 개선 영역: ${worstSection} (위험률 ${worstPct}%)
(이 영역이 가장 심각한 이유와 어르신들에게 미치는 구체적인 낙상 위험 설명)

### 즉시 개선 가능한 조치 (비용·시간 최소)
- (구체적인 조치 3가지 이상)

### 중장기 환경 개선 방안
- (구체적인 방안 3가지 이상, 지원 가능한 복지 서비스 연계 포함)

## 3. 2~3순위 위험 영역 보완 방안
(다음으로 심각한 영역들에 대해 각각 핵심 조치 2~3가지씩)

## 4. 대상자별 개입 우선순위 기준
(어떤 어르신을 먼저 개입해야 하는지 판단 기준 제시)

## 5. 담당자 실행 체크리스트
(이번 달 안에 담당 복지사가 실천할 수 있는 항목 5가지, 체크박스 형식)

---
전문적이고 따뜻한 어조로, 실무자가 바로 활용할 수 있게 구체적으로 작성해주세요. 한국어로만 답변하세요.`;

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
