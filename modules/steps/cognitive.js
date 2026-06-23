/**
 * cognitive.js - [2단계] 인지기능검사 (작업 기억, 언어 유추, 도형 행렬 퍼즐) 모듈
 */

let cognitiveState = {
  currentSubTest: 'working_memory',
  wmRound: 1,
  wmScore: 0,
  wmDigits: '',
  wmInputActive: false,
  spatialSelected: null
};

const VERBAL_QUESTIONS = {
  quick: [
    { q: "Q1. '사과'와 '바나나'의 공통점은 무엇인가요?", a: "" },
    { q: "Q2. '웃음'과 '눈물'의 공통점은 무엇인가요?", a: "" }
  ],
  full: [
    { q: "Q1. '사과'와 '바나나'의 공통점은 무엇인가요?", a: "" },
    { q: "Q2. '웃음'과 '눈물'의 공통점은 무엇인가요?", a: "" },
    { q: "Q3. '개'와 '고양이'의 공통점은 무엇인가요?", a: "" },
    { q: "Q4. '지도'와 '나침반'의 공통점은 무엇인가요?", a: "" },
    { q: "Q5. '자유'와 '정의'의 공통점은 무엇인가요?", a: "" }
  ]
};

const SPATIAL_PUZZLES = [
  {
    matrix: [
      `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="15" fill="none" stroke="#3b82f6" stroke-width="4"/></svg>`,
      `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="25" fill="none" stroke="#3b82f6" stroke-width="4"/></svg>`,
      `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="none" stroke="#3b82f6" stroke-width="4"/></svg>`,
      `<svg viewBox="0 0 100 100"><rect x="35" y="35" width="30" height="30" fill="none" stroke="#10b981" stroke-width="4"/></svg>`,
      `<svg viewBox="0 0 100 100"><rect x="25" y="25" width="50" height="50" fill="none" stroke="#10b981" stroke-width="4"/></svg>`,
      `<svg viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70" fill="none" stroke="#10b981" stroke-width="4"/></svg>`,
      `<svg viewBox="0 0 100 100"><polygon points="50,35 65,65 35,65" fill="none" stroke="#8b5cf6" stroke-width="4"/></svg>`,
      `<svg viewBox="0 0 100 100"><polygon points="50,25 75,75 25,75" fill="none" stroke="#8b5cf6" stroke-width="4"/></svg>`,
      null
    ],
    options: [
      `<svg viewBox="0 0 100 100"><polygon points="50,15 85,85 15,85" fill="none" stroke="#8b5cf6" stroke-width="4"/></svg>`,
      `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="none" stroke="#8b5cf6" stroke-width="4"/></svg>`,
      `<svg viewBox="0 0 100 100"><polygon points="50,35 65,65 35,65" fill="none" stroke="#8b5cf6" stroke-width="4"/></svg>`,
      `<svg viewBox="0 0 100 100"><polygon points="50,85 85,15 15,15" fill="none" stroke="#8b5cf6" stroke-width="4"/></svg>`
    ],
    correctAnswerIdx: 0
  },
  {
    matrix: [
      `<svg viewBox="0 0 100 100"><line x1="50" y1="10" x2="50" y2="90" stroke="#f1f5f9" stroke-width="6"/></svg>`,
      `<svg viewBox="0 0 100 100"><line x1="15" y1="15" x2="85" y2="85" stroke="#f1f5f9" stroke-width="6"/></svg>`,
      `<svg viewBox="0 0 100 100"><line x1="10" y1="50" x2="90" y2="50" stroke="#f1f5f9" stroke-width="6"/></svg>`,
      `<svg viewBox="0 0 100 100"><rect x="47" y="10" width="6" height="80" transform="rotate(45 50 50)" fill="#3b82f6"/></svg>`,
      `<svg viewBox="0 0 100 100"><rect x="47" y="10" width="6" height="80" transform="rotate(90 50 50)" fill="#3b82f6"/></svg>`,
      `<svg viewBox="0 0 100 100"><rect x="47" y="10" width="6" height="80" transform="rotate(135 50 50)" fill="#3b82f6"/></svg>`,
      `<svg viewBox="0 0 100 100"><line x1="10" y1="50" x2="90" y2="50" stroke="#10b981" stroke-width="6"/><circle cx="90" cy="50" r="6" fill="#10b981"/></svg>`,
      `<svg viewBox="0 0 100 100"><line x1="50" y1="50" x2="85" y2="85" stroke="#10b981" stroke-width="6"/><circle cx="85" cy="85" r="6" fill="#10b981"/></svg>`,
      null
    ],
    options: [
      `<svg viewBox="0 0 100 100"><line x1="50" y1="50" x2="15" y2="85" stroke="#10b981" stroke-width="6"/><circle cx="15" cy="85" r="6" fill="#10b981"/></svg>`,
      `<svg viewBox="0 0 100 100"><line x1="50" y1="50" x2="50" y2="90" stroke="#10b981" stroke-width="6"/><circle cx="50" cy="90" r="6" fill="#10b981"/></svg>`,
      `<svg viewBox="0 0 100 100"><line x1="10" y1="50" x2="90" y2="50" stroke="#10b981" stroke-width="6"/></svg>`,
      `<svg viewBox="0 0 100 100"><line x1="50" y1="50" x2="50" y2="90" stroke="#10b981" stroke-width="6"/></svg>`
    ],
    correctAnswerIdx: 1
  }
];

export function render(container, sessionData, mode, onComplete) {
  cognitiveState.currentSubTest = 'working_memory';
  cognitiveState.wmRound = 1;
  cognitiveState.wmScore = 0;
  
  runSubCognitiveTest(container, sessionData, mode, onComplete);
}

function runSubCognitiveTest(container, sessionData, mode, onComplete) {
  container.innerHTML = '';
  
  if (cognitiveState.currentSubTest === 'working_memory') {
    renderWorkingMemory(container, sessionData, mode, onComplete);
  } else if (cognitiveState.currentSubTest === 'verbal') {
    renderVerbalComprehension(container, sessionData, mode, onComplete);
  } else if (cognitiveState.currentSubTest === 'spatial') {
    renderSpatialReasoning(container, sessionData, mode, onComplete);
  }
}

function renderWorkingMemory(container, sessionData, mode, onComplete) {
  const isFull = mode === 'full';
  const totalRounds = isFull ? 8 : 3;
  const data = sessionData.cognitive || {};
  
  const isBackward = isFull && cognitiveState.wmRound > 4;
  const currentDigitsCount = isBackward 
    ? (cognitiveState.wmRound - 2) 
    : (cognitiveState.wmRound + 2);

  container.innerHTML = `
    <div class="digit-memory-container">
      <h2 style="font-size:1.3rem; margin-bottom:12px;">작업 기억력 테스트 (숫자 따라 외우기)</h2>
      <div class="digit-instruction" id="wm-instruction">
        라운드 ${cognitiveState.wmRound} / ${totalRounds}<br>
        <strong>[${isBackward ? '역순' : '순방향'}]</strong> 화면에 나타나는 숫자의 순서를 기억하여 ${isBackward ? '거꾸로' : '그대로'} 적어주세요.
      </div>
      <div class="digit-display" id="wm-display">준비</div>
      <div class="digit-input-box" id="wm-input-area" style="display: none; margin-top:20px;">
        <input type="text" class="form-control" id="wm-input" placeholder="여기에 숫자를 입력하세요" style="text-align: center; font-size: 1.5rem; font-weight:700; letter-spacing: 2px;">
        <button class="btn btn-primary btn-block" id="btn-wm-submit" style="margin-top: 15px;">제출</button>
      </div>
      <button class="btn btn-secondary" id="btn-wm-start" style="margin-top: 20px;">테스트 시작</button>
    </div>
  `;

  const btnStart = container.querySelector('#btn-wm-start');
  const btnSubmit = container.querySelector('#btn-wm-submit');
  const display = container.querySelector('#wm-display');
  const inputArea = container.querySelector('#wm-input-area');
  const input = container.querySelector('#wm-input');

  let numSeq = [];
  for (let i = 0; i < currentDigitsCount; i++) {
    numSeq.push(Math.floor(Math.random() * 9) + 1);
  }
  cognitiveState.wmDigits = numSeq.join('');

  btnStart.addEventListener('click', () => {
    btnStart.style.display = 'none';
    let idx = 0;
    display.textContent = '...';
    
    const interval = setInterval(() => {
      if (idx < numSeq.length) {
        display.textContent = numSeq[idx];
        idx++;
      } else {
        clearInterval(interval);
        display.textContent = '?';
        inputArea.style.display = 'block';
        input.focus();
        cognitiveState.wmInputActive = true;
      }
    }, 900);
  });

  btnSubmit.addEventListener('click', () => {
    const userVal = input.value.trim();
    if (!userVal) return;

    let targetAnswer = cognitiveState.wmDigits;
    if (isBackward) {
      targetAnswer = targetAnswer.split('').reverse().join('');
    }

    if (userVal === targetAnswer) {
      cognitiveState.wmScore += currentDigitsCount * 10;
    }

    if (cognitiveState.wmRound < totalRounds) {
      cognitiveState.wmRound++;
      runSubCognitiveTest(container, sessionData, mode, onComplete);
    } else {
      data.workingMemoryScore = cognitiveState.wmScore;
      sessionData.cognitive = data;
      
      cognitiveState.currentSubTest = 'verbal';
      runSubCognitiveTest(container, sessionData, mode, onComplete);
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnSubmit.click();
    }
  });
}

function renderVerbalComprehension(container, sessionData, mode, onComplete) {
  const questions = VERBAL_QUESTIONS[mode];
  const data = sessionData.cognitive?.verbalAnswers || Array(questions.length).fill('');

  let html = `
    <div style="max-width: 650px; margin: 0 auto;">
      <h2 style="font-size:1.3rem; margin-bottom:12px;"><i data-lucide="languages" style="vertical-align:middle; margin-right:8px; color:var(--primary);"></i>언어 이해력 테스트 (공통성 유추)</h2>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:24px;">제시된 두 단어 사이의 추상적인 공통점이나 관계를 한 문장으로 간단히 기술해 주세요.</p>
  `;

  questions.forEach((item, idx) => {
    html += `
      <div class="form-group">
        <label>${item.q}</label>
        <input type="text" class="form-control verbal-answer-input" data-index="${idx}" value="${data[idx] || ''}" placeholder="이유나 공통점을 적어주세요.">
      </div>
    `;
  });

  html += `
      <button class="btn btn-primary btn-block" id="btn-verbal-submit" style="margin-top: 20px;">
        ${mode === 'full' ? '지각 추론 검사로 이동' : '인지 검사 완료'}
      </button>
    </div>
  `;

  container.innerHTML = html;
  lucide.createIcons();

  container.querySelector('#btn-verbal-submit').addEventListener('click', () => {
    const inputs = container.querySelectorAll('.verbal-answer-input');
    const answers = [];
    let allFilled = true;
    inputs.forEach(input => {
      const val = input.value.trim();
      answers.push(val);
      if (!val) allFilled = false;
    });

    if (!allFilled) {
      alert("모든 언어 이해 문항에 대해 답변을 작성해 주세요.");
      return;
    }

    const cogData = sessionData.cognitive || {};
    cogData.verbalAnswers = answers;
    sessionData.cognitive = cogData;

    if (mode === 'full') {
      cognitiveState.currentSubTest = 'spatial';
      runSubCognitiveTest(container, sessionData, mode, onComplete);
    } else {
      if (onComplete) onComplete();
    }
  });
}

function renderSpatialReasoning(container, sessionData, mode, onComplete) {
  const puzzle = SPATIAL_PUZZLES[0];

  container.innerHTML = `
    <div class="pattern-puzzle-container">
      <h2 style="font-size:1.3rem;"><i data-lucide="shapes" style="vertical-align:middle; margin-right:8px; color:var(--primary);"></i>지각 추론력 테스트 (도형 유추 퍼즐)</h2>
      <p style="color:var(--text-muted); font-size:0.9rem; text-align:center;">3x3 매트릭스의 마지막 빈칸에 들어갈 가장 알맞은 규칙의 도형을 아래에서 선택해 주세요.</p>
      
      <div class="puzzle-grid-3x3">
        ${puzzle.matrix.map((cell, idx) => {
          if (cell === null) return `<div class="puzzle-cell cell-empty">?</div>`;
          return `<div class="puzzle-cell">${cell}</div>`;
        }).join('')}
      </div>

      <div class="puzzle-options">
        ${puzzle.options.map((opt, idx) => `
          <div class="option-cell" data-index="${idx}">${opt}</div>
        `).join('')}
      </div>

      <button class="btn btn-primary" id="btn-spatial-submit" style="width: 250px; margin-top:20px;" disabled>정밀 인지검사 완료</button>
    </div>
  `;
  lucide.createIcons();

  const options = container.querySelectorAll('.option-cell');
  const submitBtn = container.querySelector('#btn-spatial-submit');

  options.forEach(opt => {
    opt.addEventListener('click', () => {
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      cognitiveState.spatialSelected = parseInt(opt.getAttribute('data-index'), 10);
      submitBtn.disabled = false;
    });
  });

  submitBtn.addEventListener('click', () => {
    const cogData = sessionData.cognitive || {};
    cogData.puzzleAnswerIdx = cognitiveState.spatialSelected;
    cogData.puzzleCorrect = (cognitiveState.spatialSelected === puzzle.correctAnswerIdx);
    
    sessionData.cognitive = cogData;
    if (onComplete) onComplete();
  });
}

export function capture(sessionData, mode) {
  // 인지검사는 각 하위 파트가 진행될 때 직접 sessionData.cognitive를 갱신합니다.
}

export function validate(container, sessionData, mode) {
  // 대단계 이동 시 최종 상태 유효성 검사
  if (cognitiveState.currentSubTest === 'working_memory') {
    if (sessionData.cognitive?.workingMemoryScore === undefined) {
      alert("작업 기억력 테스트를 진행하고 완료해 주세요.");
      return false;
    }
  } else if (cognitiveState.currentSubTest === 'verbal') {
    const inputs = container.querySelectorAll('.verbal-answer-input');
    let allFilled = true;
    inputs.forEach(input => {
      if (!input.value.trim()) allFilled = false;
    });
    if (!allFilled) {
      alert("모든 언어 이해 문항에 대해 답변을 작성해 주세요.");
      return false;
    }
  } else if (cognitiveState.currentSubTest === 'spatial') {
    if (sessionData.cognitive?.puzzleAnswerIdx === undefined) {
      alert("도형 유추 퍼즐 문제를 풀고 완료해 주세요.");
      return false;
    }
  }
  return true;
}
