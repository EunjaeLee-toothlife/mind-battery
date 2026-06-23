/**
 * sct.js - [4단계] 문장완성검사 (SCT) 모듈
 */

const SCT_QUESTIONS = {
  quick: [
    "내가 보기에 어머니는...",
    "나의 아버지는...",
    "내 생각에 우리 가족은...",
    "내가 가장 두려워하는 것은...",
    "나의 가장 큰 결점은...",
    "남들에게 말 못할 비밀은...",
    "대개 사람들은...",
    "어렸을 때 나는...",
    "내가 바라는 미래는...",
    "내가 아는 여성들은...",
    "내가 아는 남성들은...",
    "나에게 가장 행복한 기억은...",
    "나의 앞날은...",
    "내가 실패했을 때 나는...",
    "나는 때때로...",
    "내 일생에서 가장 중요한 일은..."
  ],
  full: [
    "내 어머니는...",
    "나의 아버지는...",
    "우리 집은...",
    "어머니와 나는...",
    "아버지를 생각하면...",
    "내 가족이 나에 대해...",
    "내 부모님이 대개...",
    "가족들과 함께 있을 때 나는...",
    "대개 사람들은...",
    "남들에게 말 못할 비밀은...",
    "친구들은 나를...",
    "나의 대인관계에서 가장 큰 어려움은...",
    "내가 싫어하는 유형의 사람은...",
    "사람들이 나에 대해 알지 못하는 것은...",
    "내가 다른 사람을 대할 때...",
    "누군가 나에게 화를 내면...",
    "사람들과 어울릴 때 나는...",
    "내가 가장 믿을 수 있는 사람은...",
    "내가 아는 여성들은...",
    "내가 아는 남성들은...",
    "성(Sex)에 대해 생각하면...",
    "결혼 생활에 대해 나는...",
    "내가 사랑하는 사람은...",
    "나의 이성 관계는...",
    "성적인 욕구가 생기면 나는...",
    "사랑하는 사람과의 갈등이 생기면...",
    "내가 가장 두려워하는 것은...",
    "나의 가장 큰 결점은...",
    "어렸을 때 나는...",
    "내가 바라는 미래는...",
    "나에게 가장 행복한 기억은...",
    "나의 앞날은...",
    "내가 실패했을 때 나는...",
    "나는 때때로...",
    "내 일생에서 가장 중요한 일은...",
    "나의 장점은...",
    "내 기분이 우울할 때 나는...",
    "화가 날 때 내가 취하는 행동은...",
    "내가 가진 죄책감은...",
    "내 삶에서 가장 후회되는 순간은...",
    "나 자신을 생각하면...",
    "내가 인생에서 추구하는 가치는...",
    "남들과 비교할 때 나는...",
    "내가 가장 외롭다고 느낄 때는...",
    "만약 내가 다시 태어난다면..."
  ]
};

export function render(container, sessionData, mode) {
  const questions = SCT_QUESTIONS[mode];
  const data = sessionData.sct || {};

  let html = `
    <div style="max-width: 700px; margin: 0 auto;">
      <h2 style="font-size:1.3rem; margin-bottom:12px;"><i data-lucide="edit-3" style="vertical-align:middle; margin-right:8px; color:var(--primary);"></i>문장 완성 검사 (SCT)</h2>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:24px;">제시된 미완성 문장 뒷부분에 떠오르는 생각을 자유롭게 덧붙여서 완전한 문장으로 적어주세요.</p>
      <div class="sct-grid">
  `;

  questions.forEach((q, idx) => {
    const userVal = data[`sct_${idx}`] || '';
    html += `
      <div class="sct-row">
        <span class="sct-prefix">${idx + 1}. ${q}</span>
        <input type="text" class="form-control sct-input" data-index="${idx}" value="${userVal}" placeholder="여기에 문장을 이어서 완성해 주세요.">
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;
  lucide.createIcons();

  // 사용자 입력 이벤트 수동 바인딩
  container.querySelectorAll('.sct-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = e.target.getAttribute('data-index');
      data[`sct_${idx}`] = e.target.value;
      sessionData.sct = data;
    });
  });
}

export function capture(sessionData, mode) {
  const data = sessionData.sct || {};
  const inputs = document.querySelectorAll('.sct-input');
  inputs.forEach(input => {
    const idx = input.getAttribute('data-index');
    data[`sct_${idx}`] = input.value;
  });
  sessionData.sct = data;
}

export function validate(container, sessionData, mode) {
  const inputs = container.querySelectorAll('.sct-input');
  let unfilledCount = 0;
  inputs.forEach(input => {
    if (!input.value.trim()) unfilledCount++;
  });

  if (unfilledCount > 0) {
    alert(`문장완성검사 문항 중 완료되지 않은 항목이 ${unfilledCount}개 있습니다. 모든 문항을 성실하게 완성해 주세요.`);
    return false;
  }
  return true;
}
