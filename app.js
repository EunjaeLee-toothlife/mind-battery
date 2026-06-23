/**
 * MIND-BATTERY - 전문 풀배터리 심리검사 시스템
 * 핵심 코어 로직 및 SPA 흐름 제어, IndexedDB 관리, 인터랙티브 검사 모듈
 */

// ==========================================================================
// 1. 글로벌 상태 및 상수 정의
// ==========================================================================
const APP_STATE = {
  activeView: 'dashboard-view',
  currentMode: null, // 'quick' | 'full'
  currentStepIndex: 0,
  activeSession: null, // 진행 중인 세션 데이터
  db: null // IndexedDB 인스턴스
};

// DB 이름 및 버전
const DB_NAME = 'MindBatteryDB';
const DB_VERSION = 1;

// 간이/정밀 검사 단계 정의
const TEST_STEPS_CONFIG = {
  quick: [
    { id: 'intake', title: '1단계: 기초 임상 정보' },
    { id: 'cognitive', title: '2단계: 간이 인지 기능 검사' },
    { id: 'survey', title: '3단계: 객관식 정서/성격 검사' },
    { id: 'sct', title: '4단계: 문장완성검사 (SCT)' },
    { id: 'htp', title: '5단계: 그림 투사 검사 (HTP)' }
  ],
  full: [
    { id: 'intake', title: '1단계: 종합 초기 면접지' },
    { id: 'cognitive', title: '2단계: 상세 인지 기능 검사 (WAIS)' },
    { id: 'survey', title: '3단계: 다면적 인성 및 기질 평가 (MMPI/TCI)' },
    { id: 'sct', title: '4단계: 심화 문장완성검사 (SCT)' },
    { id: 'htp', title: '5단계: 투사적 그림 검사 (HTP & KFD)' }
  ]
};

// 문장완성검사(SCT) 문항 데이터
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
    // 가족 영역
    "내 어머니는...",
    "나의 아버지는...",
    "우리 집은...",
    "어머니와 나는...",
    "아버지를 생각하면...",
    "내 가족이 나에 대해...",
    "내 부모님이 대개...",
    "가족들과 함께 있을 때 나는...",
    // 대인 관계 영역
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
    // 성(Sex) 및 연애 영역
    "내가 아는 여성들은...",
    "내가 아는 남성들은...",
    "성(Sex)에 대해 생각하면...",
    "결혼 생활에 대해 나는...",
    "내가 사랑하는 사람은...",
    "나의 이성 관계는...",
    "성적인 욕구가 생기면 나는...",
    "사랑하는 사람과의 갈등이 생기면...",
    // 자기 개념 및 정서 영역
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

// ==========================================================================
// 2. IndexedDB 연동 모듈
// ==========================================================================
function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function(e) {
      const db = e.target.result;
      // 완료된 검사 이력 저장소
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'id' });
      }
      // 진행 중인 임시 저장 세션
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'id' });
      }
    };

    request.onsuccess = function(e) {
      APP_STATE.db = e.target.result;
      document.getElementById('storage-status').innerHTML = '<i data-lucide="database"></i> 로컬 보안 활성';
      lucide.createIcons();
      resolve(APP_STATE.db);
    };

    request.onerror = function(e) {
      console.error('IndexedDB 로드 실패:', e.target.error);
      reject(e.target.error);
    };
  });
}

// 이력 저장
function saveHistory(data) {
  return new Promise((resolve, reject) => {
    const tx = APP_STATE.db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    store.put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// 이력 로드
function loadHistoryList() {
  return new Promise((resolve, reject) => {
    const tx = APP_STATE.db.transaction('history', 'readonly');
    const store = tx.objectStore('history');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 이력 단건 조회
function getHistoryItem(id) {
  return new Promise((resolve, reject) => {
    const tx = APP_STATE.db.transaction('history', 'readonly');
    const store = tx.objectStore('history');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 이력 삭제
function deleteHistoryItem(id) {
  return new Promise((resolve, reject) => {
    const tx = APP_STATE.db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// 임시 세션 저장
function saveSession(data) {
  return new Promise((resolve, reject) => {
    const tx = APP_STATE.db.transaction('sessions', 'readwrite');
    const store = tx.objectStore('sessions');
    store.put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// 임시 세션 로드
function loadSession(id) {
  return new Promise((resolve, reject) => {
    const tx = APP_STATE.db.transaction('sessions', 'readonly');
    const store = tx.objectStore('sessions');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 임시 세션 삭제
function deleteSession(id) {
  return new Promise((resolve, reject) => {
    const tx = APP_STATE.db.transaction('sessions', 'readwrite');
    const store = tx.objectStore('sessions');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ==========================================================================
// 3. SPA 뷰 전환 모듈
// ==========================================================================
function switchView(viewId) {
  const currentView = document.getElementById(APP_STATE.activeView);
  const targetView = document.getElementById(viewId);

  if (currentView) {
    currentView.classList.remove('active');
  }

  // 약간의 시간차를 두어 부드러운 애니메이션 효과 구현
  setTimeout(() => {
    if (currentView) currentView.style.display = 'none';
    targetView.style.display = 'block';
    
    setTimeout(() => {
      targetView.classList.add('active');
      APP_STATE.activeView = viewId;
      window.scrollTo(0, 0);
    }, 50);
  }, 300);
}

// ==========================================================================
// 4. 대시보드 및 초기화 로직
// ==========================================================================
async function renderHistoryList() {
  const listContainer = document.getElementById('history-list');
  try {
    const list = await loadHistoryList();
    // 최신 순 정렬
    list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (list.length === 0) {
      listContainer.innerHTML = `
        <tr class="empty-row">
          <td colspan="5">저장된 검사 이력이 없습니다. 새로운 검사를 시작해 보세요.</td>
        </tr>
      `;
      return;
    }

    listContainer.innerHTML = '';
    list.forEach(item => {
      const dateStr = new Date(item.timestamp).toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      });
      const typeStr = item.mode === 'quick' ? '간이 스크리닝 (30분)' : '정밀 풀배터리 (2시간)';
      const typeClass = item.mode === 'quick' ? 'badge' : 'badge premium';
      const statusBadge = item.isCompleted 
        ? '<span class="status-indicator completed" style="color: var(--secondary); font-weight:600;"><i data-lucide="check-circle" style="width:14px; vertical-align:middle;"></i> 완료</span>' 
        : `<span class="status-indicator progress" style="color: var(--warning); font-weight:600;"><i data-lucide="play-circle" style="width:14px; vertical-align:middle;"></i> 진행중 (${item.stepIndex + 1}/${TEST_STEPS_CONFIG[item.mode].length}단계)</span>`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${dateStr}</td>
        <td><span class="${typeClass}">${typeStr}</span></td>
        <td>${item.intake?.name || '익명'}</td>
        <td>${statusBadge}</td>
        <td>
          <div style="display: flex; gap: 8px;">
            ${item.isCompleted 
              ? `<button class="btn btn-xs btn-outline btn-view-result" data-id="${item.id}"><i data-lucide="external-link"></i> 코드 보기</button>` 
              : `<button class="btn btn-xs btn-primary btn-resume" data-id="${item.id}"><i data-lucide="play"></i> 이어하기</button>`}
            <button class="btn btn-xs btn-danger btn-delete-history" data-id="${item.id}" style="padding: 6px;"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
          </div>
        </td>
      `;
      listContainer.appendChild(tr);
    });

    lucide.createIcons();
    attachHistoryActionListeners();
  } catch (err) {
    console.error('이력 목록 로드 중 오류:', err);
  }
}

function attachHistoryActionListeners() {
  // 이어하기 클릭
  document.querySelectorAll('.btn-resume').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = btn.getAttribute('data-id');
      const session = await loadSession(id);
      if (session) {
        resumeTestSession(session);
      }
    });
  });

  // 코드 보기 클릭
  document.querySelectorAll('.btn-view-result').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = btn.getAttribute('data-id');
      const item = await getHistoryItem(id);
      if (item && item.secureCode) {
        showSecureResultView(item.secureCode);
      }
    });
  });

  // 삭제 클릭
  document.querySelectorAll('.btn-delete-history').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = btn.getAttribute('data-id');
      if (confirm('해당 검사 이력을 로컬 데이터베이스에서 완전히 삭제하시겠습니까? (삭제된 정보는 복구할 수 없습니다.)')) {
        await deleteHistoryItem(id);
        await deleteSession(id);
        showToast('성공적으로 삭제되었습니다.');
        renderHistoryList();
      }
    });
  });
}

// 토스트 메시지 출력
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.querySelector('.toast-message').textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// ==========================================================================
// 5. 검사 세션 진행 및 라이프사이클 관리
// ==========================================================================
function startNewTestSession(mode) {
  const sessionId = 'session_' + Date.now();
  APP_STATE.currentMode = mode;
  APP_STATE.currentStepIndex = 0;
  APP_STATE.activeSession = {
    id: sessionId,
    mode: mode,
    stepIndex: 0,
    timestamp: new Date().toISOString(),
    isCompleted: false,
    intake: {},
    cognitive: {},
    survey: {},
    sct: {},
    htp: {}
  };

  // 인트로 화면 데이터 갱신
  const introModeBadge = document.getElementById('intro-mode-badge');
  const introTitle = document.getElementById('intro-title');
  const consentCheckbox = document.getElementById('consent-checkbox');
  const btnIntroStart = document.getElementById('btn-intro-start');

  consentCheckbox.checked = false;
  btnIntroStart.disabled = true;

  if (mode === 'quick') {
    introModeBadge.textContent = '간이 스크리닝';
    introModeBadge.className = 'badge';
    introTitle.textContent = '30분 간이 스크리닝 검사 시작 동의';
  } else {
    introModeBadge.textContent = '정밀 풀배터리';
    introModeBadge.className = 'badge premium';
    introTitle.textContent = '2시간 정밀 풀배터리 검사 시작 동의';
  }

  switchView('intro-view');
}

function resumeTestSession(session) {
  APP_STATE.currentMode = session.mode;
  APP_STATE.currentStepIndex = session.stepIndex;
  APP_STATE.activeSession = session;

  renderActiveTestStep();
  switchView('test-view');
}

// 실시간 임시저장
async function autoSaveCurrentSession() {
  if (!APP_STATE.activeSession) return;
  
  // 현재 화면에서 입력된 값을 액티브 세션 구조에 저장
  captureCurrentStepInput();
  
  APP_STATE.activeSession.stepIndex = APP_STATE.currentStepIndex;
  APP_STATE.activeSession.timestamp = new Date().toISOString();

  // IndexedDB에 임시 세션과 완성 이력 데이터 동시 갱신
  await saveSession(APP_STATE.activeSession);
  await saveHistory(APP_STATE.activeSession);
  
  showToast('검사 내용이 브라우저에 임시 저장되었습니다.');
  renderHistoryList();
}

// ==========================================================================
// 6. 단계별 검사 화면 동적 렌더러
// ==========================================================================
function renderActiveTestStep() {
  const steps = TEST_STEPS_CONFIG[APP_STATE.currentMode];
  const step = steps[APP_STATE.currentStepIndex];

  // 헤더 및 프로그레스 갱신
  document.getElementById('active-test-type').textContent = 
    APP_STATE.currentMode === 'quick' ? '간이 스크리닝 검사' : '정밀 풀배터리 검사';
  document.getElementById('active-step-title').textContent = step.title;

  const progressPercent = Math.round((APP_STATE.currentStepIndex / steps.length) * 100);
  document.getElementById('progress-percentage').textContent = `${progressPercent}%`;
  document.getElementById('progress-bar-fill').style.width = `${progressPercent}%`;

  // 인디케이터 렌더링
  const indicatorsContainer = document.getElementById('step-indicators');
  indicatorsContainer.innerHTML = '';
  steps.forEach((s, idx) => {
    const div = document.createElement('div');
    div.className = 'indicator';
    if (idx === APP_STATE.currentStepIndex) {
      div.classList.add('active');
    } else if (idx < APP_STATE.currentStepIndex) {
      div.classList.add('completed');
    }
    indicatorsContainer.appendChild(div);
  });

  // 이전/다음 버튼 제어
  document.getElementById('btn-test-prev').style.visibility = 
    APP_STATE.currentStepIndex === 0 ? 'hidden' : 'visible';
  
  const nextBtn = document.getElementById('btn-test-next');
  if (APP_STATE.currentStepIndex === steps.length - 1) {
    nextBtn.innerHTML = '검사 완료 <i data-lucide="check"></i>';
  } else {
    nextBtn.innerHTML = '다음 단계 <i data-lucide="chevron-right"></i>';
  }
  lucide.createIcons();

  // 컨텐츠 그리기
  const stepContainer = document.getElementById('step-container');
  stepContainer.innerHTML = '';

  switch (step.id) {
    case 'intake':
      renderIntakeForm(stepContainer);
      break;
    case 'cognitive':
      renderCognitiveTest(stepContainer);
      break;
    case 'survey':
      renderSurveyTest(stepContainer);
      break;
    case 'sct':
      renderSctTest(stepContainer);
      break;
    case 'htp':
      renderHtpTest(stepContainer);
      break;
  }
}

// --------------------------------------------------------------------------
// [1단계] 초기 면접지/인적사항 폼
// --------------------------------------------------------------------------
function renderIntakeForm(container) {
  const isFull = APP_STATE.currentMode === 'full';
  const data = APP_STATE.activeSession.intake || {};

  let html = `
    <div style="max-width: 650px; margin: 0 auto;">
      <h2 style="margin-bottom: 24px; font-size:1.4rem;"><i data-lucide="user" style="vertical-align:middle; margin-right:8px; color:var(--primary);"></i>기본 인적사항 및 초기 정보</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="form-group">
          <label>성명 <span class="required">*</span></label>
          <input type="text" class="form-control" id="intake-name" value="${data.name || ''}" placeholder="이름을 입력하세요">
        </div>
        <div class="form-group">
          <label>연령 (세) <span class="required">*</span></label>
          <input type="number" class="form-control" id="intake-age" value="${data.age || ''}" placeholder="만 나이 입력">
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="form-group">
          <label>성별 <span class="required">*</span></label>
          <select class="form-control" id="intake-gender">
            <option value="">선택하세요</option>
            <option value="남성" ${data.gender === '남성' ? 'selected' : ''}>남성</option>
            <option value="여성" ${data.gender === '여성' ? 'selected' : ''}>여성</option>
          </select>
        </div>
        <div class="form-group">
          <label>직업 또는 학업</label>
          <input type="text" class="form-control" id="intake-job" value="${data.job || ''}" placeholder="예: 대학생, 회사원">
        </div>
      </div>
      <div class="form-group">
        <label>주요 호소 문제 (현재 가장 겪고 있는 심리적 어려움) <span class="required">*</span></label>
        <textarea class="form-control" id="intake-complaint" placeholder="현재 겪고 계신 불안, 우울, 대인관계 스트레스 등에 대해 구체적으로 기록해 주세요.">${data.complaint || ''}</textarea>
      </div>
  `;

  // 정밀 검사일 때만 가족력, 성장사 등 심화 정보 폼 추가 렌더링
  if (isFull) {
    html += `
      <div class="form-group">
        <label>성장 과정 및 가족 관계 특이사항</label>
        <textarea class="form-control" id="intake-family-history" placeholder="유년기 성장 배경, 부모님 및 형제자매와의 관계 등 중요하다고 생각되는 사항을 기술해 주세요.">${data.familyHistory || ''}</textarea>
      </div>
      <div class="form-group">
        <label>과거 정신과적 이력 및 신체 병력</label>
        <textarea class="form-control" id="intake-medical-history" placeholder="정신과 상담/약물 복용 이력, 큰 수술이나 질병 등의 정보가 있다면 기재해 주세요.">${data.medicalHistory || ''}</textarea>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="form-group">
          <label>수면 상태 및 주간 수면 시간</label>
          <input type="text" class="form-control" id="intake-sleep" value="${data.sleep || ''}" placeholder="예: 불면증 있음, 평균 5시간">
        </div>
        <div class="form-group">
          <label>식욕 및 식습관 변화</label>
          <input type="text" class="form-control" id="intake-appetite" value="${data.appetite || ''}" placeholder="예: 최근 식욕 감퇴, 과식 등">
        </div>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
  lucide.createIcons();
}

// --------------------------------------------------------------------------
// [2단계] 간이/상세 인지 검사 (WAIS)
// --------------------------------------------------------------------------
let cognitiveState = {
  currentSubTest: 'working_memory', // 'working_memory' | 'verbal' | 'spatial'
  wmRound: 1,
  wmScore: 0,
  wmDigits: '',
  wmInputActive: false,
  spatialSelected: null
};

function renderCognitiveTest(container) {
  // 인지검사의 서브테스트들을 렌더링
  cognitiveState.currentSubTest = 'working_memory';
  cognitiveState.wmRound = 1;
  cognitiveState.wmScore = 0;
  
  runSubCognitiveTest(container);
}

function runSubCognitiveTest(container) {
  container.innerHTML = '';
  
  if (cognitiveState.currentSubTest === 'working_memory') {
    renderWorkingMemory(container);
  } else if (cognitiveState.currentSubTest === 'verbal') {
    renderVerbalComprehension(container);
  } else if (cognitiveState.currentSubTest === 'spatial') {
    renderSpatialReasoning(container);
  }
}

// 2-1. 작업 기억 테스트 (숫자 외우기)
function renderWorkingMemory(container) {
  const isFull = APP_STATE.currentMode === 'full';
  const totalRounds = isFull ? 8 : 3;
  const data = APP_STATE.activeSession.cognitive || {};
  
  // 라운드별 설정 (자릿수 및 역순 유무)
  // 간이: 3자리 순방향, 4자리 순방향, 5자리 순방향 (총 3라운드)
  // 정밀: 3,4,5,6자리 순방향(4라운드) + 3,4,5,6자리 역순(4라운드)
  const isBackward = isFull && cognitiveState.wmRound > 4;
  const currentDigitsCount = isBackward 
    ? (cognitiveState.wmRound - 2) // 역순: 5라운드(3자리) ~ 8라운드(6자리)
    : (cognitiveState.wmRound + 2); // 순방향: 1라운드(3자리) ~ 4라운드(6자리)

  container.innerHTML = `
    <div class="digit-memory-container">
      <h2 style="font-size:1.3rem; margin-bottom:12px;">작업 기억력 테스트 (숫자 따라 외우기)</h2>
      <div class="digit-instruction" id="wm-instruction">
        라운드 ${cognitiveState.wmRound} / ${totalRounds}<br>
        <strong>[${isBackward ? '역순' : '순방향'}]</strong> 화면에 나타나는 숫자의 순서를 기억하여 ${isBackward ? '거꾸로' : '그대로'} 적어주세요.
      </div>
      
      <!-- 숫자가 반짝이는 대형 영역 -->
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

  // 난수 시퀀스 생성
  let numSeq = [];
  for (let i = 0; i < currentDigitsCount; i++) {
    numSeq.push(Math.floor(Math.random() * 9) + 1); // 1~9 사이 난수
  }
  cognitiveState.wmDigits = numSeq.join('');

  btnStart.addEventListener('click', () => {
    btnStart.style.display = 'none';
    let idx = 0;
    
    display.textContent = '...';
    
    // 0.8초 간격으로 플래시 표시
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

    const isCorrect = userVal === targetAnswer;
    if (isCorrect) {
      cognitiveState.wmScore += currentDigitsCount * 10;
    }

    if (cognitiveState.wmRound < totalRounds) {
      // 다음 라운드 진행
      cognitiveState.wmRound++;
      runSubCognitiveTest(container);
    } else {
      // 작업 기억 테스트 종료 -> 언어 이해 테스트로
      data.workingMemoryScore = cognitiveState.wmScore;
      APP_STATE.activeSession.cognitive = data;
      
      cognitiveState.currentSubTest = 'verbal';
      runSubCognitiveTest(container);
    }
  });

  // Enter키 이벤트
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnSubmit.click();
    }
  });
}

// 2-2. 언어 이해 테스트 (공통성 찾기)
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

function renderVerbalComprehension(container) {
  const mode = APP_STATE.currentMode;
  const questions = VERBAL_QUESTIONS[mode];
  const data = APP_STATE.activeSession.cognitive?.verbalAnswers || Array(questions.length).fill('');

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
      <button class="btn btn-primary btn-block" id="btn-verbal-submit" style="margin-top: 20px;">인지 검사 최종 완료</button>
    </div>
  `;

  container.innerHTML = html;
  lucide.createIcons();

  container.querySelector('#btn-verbal-submit').addEventListener('click', () => {
    const inputs = container.querySelectorAll('.verbal-answer-input');
    const answers = [];
    inputs.forEach(input => {
      answers.push(input.value.trim());
    });

    // 데이터 저장
    const cogData = APP_STATE.activeSession.cognitive || {};
    cogData.verbalAnswers = answers;
    APP_STATE.activeSession.cognitive = cogData;

    if (mode === 'full') {
      // 정밀 검사인 경우 지각 추론(도형 퍼즐) 추가 단계 진행
      cognitiveState.currentSubTest = 'spatial';
      runSubCognitiveTest(container);
    } else {
      // 간이 검사는 인지 단계 종료 -> 다음 대단계로 이동
      moveNextStep();
    }
  });
}

// 2-3. 지각 추론 테스트 (도형 유추 퍼즐 - 정밀 검사용)
const SPATIAL_PUZZLES = [
  {
    // 문제 1: 크기 변화 규칙 (작음 -> 중간 -> 큼)
    matrix: [
      `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="15" fill="none" stroke="#3b82f6" stroke-width="4"/></svg>`,
      `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="25" fill="none" stroke="#3b82f6" stroke-width="4"/></svg>`,
      `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="none" stroke="#3b82f6" stroke-width="4"/></svg>`,
      
      `<svg viewBox="0 0 100 100"><rect x="35" y="35" width="30" height="30" fill="none" stroke="#10b981" stroke-width="4"/></svg>`,
      `<svg viewBox="0 0 100 100"><rect x="25" y="25" width="50" height="50" fill="none" stroke="#10b981" stroke-width="4"/></svg>`,
      `<svg viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70" fill="none" stroke="#10b981" stroke-width="4"/></svg>`,
      
      `<svg viewBox="0 0 100 100"><polygon points="50,35 65,65 35,65" fill="none" stroke="#8b5cf6" stroke-width="4"/></svg>`,
      `<svg viewBox="0 0 100 100"><polygon points="50,25 75,75 25,75" fill="none" stroke="#8b5cf6" stroke-width="4"/></svg>`,
      null // 빈칸
    ],
    options: [
      // 0: 정답 (큰 삼각형)
      `<svg viewBox="0 0 100 100"><polygon points="50,15 85,85 15,85" fill="none" stroke="#8b5cf6" stroke-width="4"/></svg>`,
      // 1: 오답 (원)
      `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="none" stroke="#8b5cf6" stroke-width="4"/></svg>`,
      // 2: 오답 (작은 삼각형)
      `<svg viewBox="0 0 100 100"><polygon points="50,35 65,65 35,65" fill="none" stroke="#8b5cf6" stroke-width="4"/></svg>`,
      // 3: 오답 (역삼각형)
      `<svg viewBox="0 0 100 100"><polygon points="50,85 85,15 15,15" fill="none" stroke="#8b5cf6" stroke-width="4"/></svg>`
    ],
    correctAnswerIdx: 0
  },
  {
    // 문제 2: 각도 회전 규칙 (시계방향 45도씩)
    matrix: [
      `<svg viewBox="0 0 100 100"><line x1="50" y1="10" x2="50" y2="90" stroke="#f1f5f9" stroke-width="6"/></svg>`, // |
      `<svg viewBox="0 0 100 100"><line x1="15" y1="15" x2="85" y2="85" stroke="#f1f5f9" stroke-width="6"/></svg>`, // \
      `<svg viewBox="0 0 100 100"><line x1="10" y1="50" x2="90" y2="50" stroke="#f1f5f9" stroke-width="6"/></svg>`, // -
      
      `<svg viewBox="0 0 100 100"><rect x="47" y="10" width="6" height="80" transform="rotate(45 50 50)" fill="#3b82f6"/></svg>`,
      `<svg viewBox="0 0 100 100"><rect x="47" y="10" width="6" height="80" transform="rotate(90 50 50)" fill="#3b82f6"/></svg>`,
      `<svg viewBox="0 0 100 100"><rect x="47" y="10" width="6" height="80" transform="rotate(135 50 50)" fill="#3b82f6"/></svg>`,
      
      `<svg viewBox="0 0 100 100"><line x1="10" y1="50" x2="90" y2="50" stroke="#10b981" stroke-width="6"/><circle cx="90" cy="50" r="6" fill="#10b981"/></svg>`, // 0도
      `<svg viewBox="0 0 100 100"><line x1="50" y1="50" x2="85" y2="85" stroke="#10b981" stroke-width="6"/><circle cx="85" cy="85" r="6" fill="#10b981"/></svg>`, // 45도
      null // 빈칸 (90도 회전 예상)
    ],
    options: [
      // 0: 오답
      `<svg viewBox="0 0 100 100"><line x1="50" y1="50" x2="15" y2="85" stroke="#10b981" stroke-width="6"/><circle cx="15" cy="85" r="6" fill="#10b981"/></svg>`,
      // 1: 정답 (아래 수직선)
      `<svg viewBox="0 0 100 100"><line x1="50" y1="50" x2="50" y2="90" stroke="#10b981" stroke-width="6"/><circle cx="50" cy="90" r="6" fill="#10b981"/></svg>`,
      // 2: 오답 (수평선)
      `<svg viewBox="0 0 100 100"><line x1="10" y1="50" x2="90" y2="50" stroke="#10b981" stroke-width="6"/></svg>`,
      // 3: 오답 (원 없음)
      `<svg viewBox="0 0 100 100"><line x1="50" y1="50" x2="50" y2="90" stroke="#10b981" stroke-width="6"/></svg>`
    ],
    correctAnswerIdx: 1
  }
];

function renderSpatialReasoning(container) {
  // 정밀 검사 전용: 도형 퍼즐 렌더링
  const currentPuzzleIdx = cognitiveState.wmRound - 1; // 변수 재활용
  const puzzle = SPATIAL_PUZZLES[0]; // 프로토타입으로 첫번째 제공 (더 구현 가능)

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
    const cogData = APP_STATE.activeSession.cognitive || {};
    cogData.puzzleAnswerIdx = cognitiveState.spatialSelected;
    cogData.puzzleCorrect = (cognitiveState.spatialSelected === puzzle.correctAnswerIdx);
    
    APP_STATE.activeSession.cognitive = cogData;
    moveNextStep();
  });
}

// --------------------------------------------------------------------------
// [3단계] 객관식 정서/성격/기질 설문지 (MMPI/TCI)
// --------------------------------------------------------------------------
// 설문 데이터 빌드 (간이는 30문항, 정밀은 120+70 = 190문항)
function generateSurveyQuestions(mode) {
  if (mode === 'quick') {
    const list = [];
    // 우울증 척도 (1~10)
    for(let i=1; i<=10; i++) {
      list.push({ id: `q_dep_${i}`, text: `[정서 평가] 최근 2주 동안, 나는 평소보다 더 쉽게 기운이 가라앉고 우울해지거나 희망이 없다고 느꼈다.`, scale: 'depression' });
    }
    // 불안 척도 (11~20)
    for(let i=1; i<=10; i++) {
      list.push({ id: `q_anx_${i}`, text: `[정서 평가] 평소보다 걱정이 지나치고 제어가 되지 않거나 안절부절못하는 경우가 많았다.`, scale: 'anxiety' });
    }
    // 기질 척도 (21~30)
    for(let i=1; i<=10; i++) {
      list.push({ id: `q_tci_${i}`, text: `[성향 평가] 새로운 상황에 직면했을 때, 나는 보통 흥분과 호기심보다는 두려움과 회피 반응이 앞선다.`, scale: 'tci' });
    }
    return list;
  } else {
    // 2시간 정밀 검사용 190문항 데이터셋 설계
    const list = [];
    const categories = [
      { prefix: '우울/기분조절', scale: 'MMPI_D' },
      { prefix: '불안/공포', scale: 'MMPI_Pt' },
      { prefix: '강박/인지왜곡', scale: 'MMPI_Hs' },
      { prefix: '사회적 민감성', scale: 'TCI_RD' },
      { prefix: '위험 회피', scale: 'TCI_HA' }
    ];

    const questionsTemplates = [
      "일상생활에서 사소한 일에도 주의가 쉽게 산만해지거나 집중하기가 매우 어렵다.",
      "매사에 의욕이 없고 평소 즐기던 일조차 귀찮고 재미없게 느껴진다.",
      "스스로에 대해 실망하거나 내가 가족을 실망시켰다는 죄책감이 종종 든다.",
      "가끔씩 알 수 없는 공포심이 몰려와 심장이 뛰고 숨쉬기 곤란해질 때가 있다.",
      "새로운 일에 도전하는 것보다 익숙하고 안전한 방식을 고수하는 것이 마음이 편하다.",
      "타인의 나에 대한 거절이나 비판에 유난히 예민하고 쉽게 상처받는 편이다.",
      "어떤 일을 처리할 때 완벽하게 정돈되지 않으면 몹시 불안하고 짜증이 난다.",
      "나를 둘러싼 환경이나 세상이 왠지 모르게 비현실적이거나 낯설게 느껴진다.",
      "주변 사람들의 기분 변화나 감정을 아주 빠르고 섬세하게 파악하곤 한다.",
      "미래에 대해 낙관하기보다 최악의 시나리오를 먼저 머릿속으로 그리게 된다."
    ];

    for (let i = 1; i <= 190; i++) {
      const cat = categories[(i - 1) % categories.length];
      const template = questionsTemplates[(i - 1) % questionsTemplates.length];
      list.push({
        id: `q_full_${i}`,
        text: `[${cat.prefix}] ${i}번. 나는 ${template}`,
        scale: cat.scale
      });
    }
    return list;
  }
}

let surveyState = {
  questions: [],
  currentPage: 0,
  pageSize: 10,
  answers: {} // { questionId: value }
};

function renderSurveyTest(container) {
  surveyState.questions = generateSurveyQuestions(APP_STATE.currentMode);
  surveyState.currentPage = 0;
  // 기존에 저장된 데이터가 있으면 불러옴
  surveyState.answers = APP_STATE.activeSession.survey || {};

  renderSurveyPage(container);
}

function renderSurveyPage(container) {
  const startIdx = surveyState.currentPage * surveyState.pageSize;
  const endIdx = Math.min(startIdx + surveyState.pageSize, surveyState.questions.length);
  const pageQuestions = surveyState.questions.slice(startIdx, endIdx);
  const totalPages = Math.ceil(surveyState.questions.length / surveyState.pageSize);

  let html = `
    <div class="survey-paging-container">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:12px;">
        <h2 style="font-size:1.3rem;"><i data-lucide="check-square" style="vertical-align:middle; margin-right:8px; color:var(--primary);"></i>정서 및 성격 검사</h2>
        <span style="font-size:0.9rem; color:var(--text-muted);">페이지 ${surveyState.currentPage + 1} / ${totalPages}</span>
      </div>
  `;

  pageQuestions.forEach((q, idx) => {
    const actualNum = startIdx + idx + 1;
    const answeredVal = surveyState.answers[q.id];

    html += `
      <div class="survey-item">
        <div class="survey-question">
          <span class="question-num">${actualNum}.</span>
          <p>${q.text}</p>
        </div>
        <div class="survey-choices-row">
          ${[
            { val: 0, label: '전혀 아니다' },
            { val: 1, label: '약간 아니다' },
            { val: 2, label: '보통이다' },
            { val: 3, label: '약간 그렇다' },
            { val: 4, label: '매우 그렇다' }
          ].map(choice => `
            <label class="choice-option">
              <input type="radio" name="radio_${q.id}" value="${choice.val}" data-qid="${q.id}" ${answeredVal == choice.val ? 'checked' : ''}>
              <span class="choice-label">${choice.label}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  });

  html += `
      <div style="display:flex; justify-content:space-between; margin-top:20px;">
        <button class="btn btn-outline" id="btn-survey-prev-page" ${surveyState.currentPage === 0 ? 'disabled' : ''}>이전 10문항</button>
        <button class="btn btn-primary" id="btn-survey-next-page">
          ${surveyState.currentPage === totalPages - 1 ? '정서검사 완료' : '다음 10문항'}
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;
  lucide.createIcons();

  // 이벤트 연결
  container.querySelectorAll('.choice-option input').forEach(input => {
    input.addEventListener('change', (e) => {
      const qid = e.target.getAttribute('data-qid');
      surveyState.answers[qid] = parseInt(e.target.value, 10);
      // 세션 임시 상태 갱신
      APP_STATE.activeSession.survey = surveyState.answers;
    });
  });

  container.querySelector('#btn-survey-prev-page').addEventListener('click', () => {
    if (surveyState.currentPage > 0) {
      surveyState.currentPage--;
      renderSurveyPage(container);
    }
  });

  container.querySelector('#btn-survey-next-page').addEventListener('click', () => {
    // 현재 페이지 모든 문항에 답변을 했는지 확인
    let unansweredCount = 0;
    pageQuestions.forEach(q => {
      if (surveyState.answers[q.id] === undefined) {
        unansweredCount++;
      }
    });

    if (unansweredCount > 0) {
      alert(`현재 페이지의 ${unansweredCount}개 문항에 답변이 작성되지 않았습니다. 모두 완료한 후 다음으로 진행할 수 있습니다.`);
      return;
    }

    if (surveyState.currentPage < totalPages - 1) {
      surveyState.currentPage++;
      renderSurveyPage(container);
    } else {
      // 설문 최종 완료 -> 다음 단계로
      moveNextStep();
    }
  });
}

// --------------------------------------------------------------------------
// [4단계] 문장완성검사 (SCT)
// --------------------------------------------------------------------------
function renderSctTest(container) {
  const mode = APP_STATE.currentMode;
  const questions = SCT_QUESTIONS[mode];
  const data = APP_STATE.activeSession.sct || {};

  // SCT 문항도 분량이 많으므로 한 화면에 다 보여주는 것보단 8문항씩 구분 렌더링
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

  // 값 바뀔 때마다 실시간 백업
  container.querySelectorAll('.sct-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = e.target.getAttribute('data-index');
      data[`sct_${idx}`] = e.target.value;
      APP_STATE.activeSession.sct = data;
    });
  });
}

// --------------------------------------------------------------------------
// [5단계] 투사 그림 검사 (HTP & KFD)
// --------------------------------------------------------------------------
let htpState = {
  currentDrawType: 'house', // 'house' | 'tree' | 'person_male' | 'person_female' | 'family'
  drawTypes: [], // 모드별 순서
  images: {}, // { drawType: base64Data }
  pdiAnswers: {} // { drawType_questionKey: value }
};

const HTP_CONFIGS = {
  quick: [
    { key: 'house', label: '집 (House)', pdi: ["Q1. 이 집은 튼튼하고 굳건합니까?", "Q2. 이 집의 분위기는 따뜻합니까, 차갑습니까?", "Q3. 이 집 안에 살고 있는 사람은 누구입니까?"] },
    { key: 'tree', label: '나무 (Tree)', pdi: ["Q1. 이 나무는 살아있습니까, 죽어있습니까?", "Q2. 이 나무는 몇 살 정도 되었습니까?", "Q3. 이 나무의 기분은 어떻습니까?"] },
    { key: 'person', label: '사람 (Person)', pdi: ["Q1. 이 사람은 남자입니까, 여자입니까?", "Q2. 이 사람은 몇 살 정도 되었습니까?", "Q3. 이 사람은 지금 무엇을 하고 있습니까?"] }
  ],
  full: [
    { key: 'house', label: '집 (House)', pdi: ["Q1. 이 집은 튼튼합니까? 집의 분위기는 어떤가요?", "Q2. 이 집 안에는 누가 살고 있으며, 무엇을 하나요?", "Q3. 이 집에 더 필요한 문이나 창문이 있습니까?"] },
    { key: 'tree', label: '나무 (Tree)', pdi: ["Q1. 이 나무는 살아있나요? 건강 상태는 어떻습니까?", "Q2. 나이는 몇 살 정도이며, 지금 어떤 날씨 속에 있나요?", "Q3. 이 나무에 어울리는 열매나 낙엽이 있습니까?"] },
    { key: 'person_male', label: '남자 (Male Person)', pdi: ["Q1. 이 사람의 나이는 몇 살이며 직업은 무엇인가요?", "Q2. 지금 이 남자는 어떤 기분이고, 무슨 생각을 하나요?", "Q3. 이 사람은 행복해 보이나요? 그 이유는 무엇인가요?"] },
    { key: 'person_female', label: '여자 (Female Person)', pdi: ["Q1. 이 사람의 나이는 몇 살이며 지금 무엇을 하고 있나요?", "Q2. 이 여성의 고민거리나 걱정은 무엇일까요?", "Q3. 이 여성에게 가장 필요한 것은 무엇인가요?"] },
    { key: 'family', label: '동적 가족화 (KFD)', pdi: ["Q1. 이 그림 속 인물들은 각각 누구입니까?", "Q2. 가족들은 각자 무엇을 하고 있습니까?", "Q3. 그림 그릴 때의 기분이나 분위기는 어땠나요?"] }
  ]
};

let drawingContext = null;
let isDrawing = false;
let brushColor = '#000000';
let brushSize = 3;
let isEraser = false;

function renderHtpTest(container) {
  const mode = APP_STATE.currentMode;
  htpState.drawTypes = HTP_CONFIGS[mode];
  htpState.currentDrawType = htpState.drawTypes[0].key;
  
  // 저장된 내용 복원
  const htpData = APP_STATE.activeSession.htp || {};
  htpState.images = htpData.images || {};
  htpState.pdiAnswers = htpData.pdiAnswers || {};

  renderActiveDrawingStep(container);
}

function renderActiveDrawingStep(container) {
  const currentDraw = htpState.drawTypes.find(d => d.key === htpState.currentDrawType);
  const currentDrawIdx = htpState.drawTypes.findIndex(d => d.key === htpState.currentDrawType);
  const totalDrawSteps = htpState.drawTypes.length;

  container.innerHTML = `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:12px; margin-bottom:24px;">
        <h2 style="font-size:1.3rem;"><i data-lucide="palette" style="vertical-align:middle; margin-right:8px; color:var(--primary);"></i>그림 투사 검사: ${currentDraw.label}</h2>
        <span style="font-size:0.9rem; color:var(--text-muted);">단계 ${currentDrawIdx + 1} / ${totalDrawSteps}</span>
      </div>

      <div class="htp-container">
        <!-- 그림 그리기 구역 -->
        <div class="drawing-zone">
          <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:4px;">직접 캔버스에 마우스나 손가락으로 그림을 그리거나, 종이에 그린 스캔본 파일을 아래로 업로드해 주세요.</p>
          
          <!-- 캔버스 구조 -->
          <div class="canvas-wrapper">
            <canvas class="drawing-canvas" id="canvas-paint"></canvas>
          </div>

          <!-- 툴바 -->
          <div class="canvas-toolbar">
            <div class="tool-group">
              <button class="tool-btn active" id="btn-tool-brush" title="브러시"><i data-lucide="pencil"></i></button>
              <button class="tool-btn" id="btn-tool-eraser" title="지우개"><i data-lucide="eraser"></i></button>
              <button class="tool-btn" id="btn-tool-clear" title="초기화"><i data-lucide="rotate-ccw"></i></button>
            </div>
            
            <div class="tool-group">
              <span style="font-size:0.8rem; color:var(--text-muted);">색상:</span>
              <div class="brush-color color-black selected" data-color="#000000"></div>
              <div class="brush-color color-red" data-color="#ef4444"></div>
              <div class="brush-color color-blue" data-color="#3b82f6"></div>
            </div>

            <div class="tool-group">
              <span style="font-size:0.8rem; color:var(--text-muted);">굵기:</span>
              <input type="range" class="brush-slider" id="brush-size" min="1" max="15" value="${brushSize}">
            </div>
          </div>

          <!-- 파일 업로더 -->
          <div class="uploader-zone" id="upload-zone">
            <i data-lucide="image"></i>
            <span>종이에 그린 파일 가져오기 (JPG, PNG)</span>
            <input type="file" id="file-input" accept="image/*" style="display: none;">
            <img class="upload-preview" id="preview-image" alt="미리보기">
          </div>
        </div>

        <!-- 사후 면담 질문 구역 (PDI) -->
        <div class="pdi-panel">
          <h3>그림에 대한 사후 질문</h3>
          <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:12px;">그린 그림을 보며 상담사가 묻는 질문에 생각나는 대로 답변을 입력해 주십시오.</p>
          
          ${currentDraw.pdi.map((qText, qIdx) => {
            const answerKey = `${currentDraw.key}_pdi_${qIdx}`;
            const answerVal = htpState.pdiAnswers[answerKey] || '';
            return `
              <div class="form-group">
                <label>${qText}</label>
                <textarea class="form-control pdi-answer-input" data-key="${answerKey}" placeholder="생각을 작성해 주세요.">${answerVal}</textarea>
              </div>
            `;
          }).join('')}

          <div style="display:flex; justify-content:space-between; margin-top: auto; padding-top:20px;">
            <button class="btn btn-outline" id="btn-htp-prev" ${currentDrawIdx === 0 ? 'disabled' : ''}>이전 그림으로</button>
            <button class="btn btn-primary" id="btn-htp-next">
              ${currentDrawIdx === totalDrawSteps - 1 ? '종합 리포트 생성하기' : '다음 그림으로'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();
  initCanvasDrawing();
  attachHtpListeners(container, currentDrawIdx, totalDrawSteps);

  // 이전에 저장된 그림 이미지가 있으면 캔버스에 복원
  const savedImg = htpState.images[currentDraw.key];
  if (savedImg) {
    const img = new Image();
    img.src = savedImg;
    img.onload = () => {
      drawingContext.clearRect(0, 0, 800, 600);
      drawingContext.drawImage(img, 0, 0, 800, 600);
    };
  }
}

// HTP 캔버스 마우스/터치 드로잉 기능 초기화
function initCanvasDrawing() {
  const canvas = document.getElementById('canvas-paint');
  drawingContext = canvas.getContext('2d');

  // 내부 그리드 크기 고정 (4:3 비율)
  canvas.width = 800;
  canvas.height = 600;

  // 기본 설정
  drawingContext.lineCap = 'round';
  drawingContext.lineJoin = 'round';
  drawingContext.strokeStyle = brushColor;
  drawingContext.lineWidth = brushSize;

  // 화이트 캔버스 설정
  drawingContext.fillStyle = '#ffffff';
  drawingContext.fillRect(0, 0, canvas.width, canvas.height);

  // 그리기 함수들
  function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches.length > 0) {
      // 터치 디바이스 지원
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else {
      // 마우스
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  }

  function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const coords = getCoordinates(e);
    drawingContext.beginPath();
    drawingContext.moveTo(coords.x, coords.y);
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    drawingContext.lineTo(coords.x, coords.y);
    drawingContext.stroke();
  }

  function stopDrawing() {
    isDrawing = false;
  }

  // 데스크탑 마우스 이벤트
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  // 모바일 터치 이벤트
  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);
}

// HTP 화면 인터랙션 연결
function attachHtpListeners(container, currentDrawIdx, totalDrawSteps) {
  const canvas = document.getElementById('canvas-paint');
  const btnBrush = document.getElementById('btn-tool-brush');
  const btnEraser = document.getElementById('btn-tool-eraser');
  const btnClear = document.getElementById('btn-tool-clear');
  const sizeSlider = document.getElementById('brush-size');
  
  // 브러시 / 지우개 토글
  btnBrush.addEventListener('click', () => {
    isEraser = false;
    btnBrush.classList.add('active');
    btnEraser.classList.remove('active');
    drawingContext.strokeStyle = brushColor;
    drawingContext.lineWidth = brushSize;
  });

  btnEraser.addEventListener('click', () => {
    isEraser = true;
    btnEraser.classList.add('active');
    btnBrush.classList.remove('active');
    drawingContext.strokeStyle = '#ffffff'; // 지우개는 흰색
    drawingContext.lineWidth = brushSize * 3; // 지우개는 좀 더 굵게
  });

  // 초기화
  btnClear.addEventListener('click', () => {
    if (confirm('캔버스를 초기화하고 처음부터 다시 그리겠습니까?')) {
      drawingContext.fillStyle = '#ffffff';
      drawingContext.fillRect(0, 0, canvas.width, canvas.height);
    }
  });

  // 색상 변경
  container.querySelectorAll('.brush-color').forEach(elem => {
    elem.addEventListener('click', (e) => {
      container.querySelectorAll('.brush-color').forEach(el => el.classList.remove('selected'));
      elem.classList.add('selected');
      brushColor = elem.getAttribute('data-color');
      
      // 브러시 툴 활성화 상태로 유도
      isEraser = false;
      btnBrush.classList.add('active');
      btnEraser.classList.remove('active');
      drawingContext.strokeStyle = brushColor;
      drawingContext.lineWidth = brushSize;
    });
  });

  // 굵기 슬라이더
  sizeSlider.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value, 10);
    drawingContext.lineWidth = isEraser ? brushSize * 3 : brushSize;
  });

  // 파일 업로드 처리
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  const previewImg = document.getElementById('preview-image');

  uploadZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        previewImg.src = evt.target.result;
        previewImg.style.display = 'block';
        
        // 캔버스 크기 규격에 맞추어 그림 그리기
        const img = new Image();
        img.src = evt.target.result;
        img.onload = () => {
          drawingContext.clearRect(0, 0, 800, 600);
          // 비율에 맞게 화이트 배경에 피팅
          drawingContext.fillStyle = '#ffffff';
          drawingContext.fillRect(0, 0, 800, 600);
          
          const ratio = Math.min(800 / img.width, 600 / img.height);
          const newWidth = img.width * ratio;
          const newHeight = img.height * ratio;
          const x = (800 - newWidth) / 2;
          const y = (600 - newHeight) / 2;

          drawingContext.drawImage(img, x, y, newWidth, newHeight);
        };
      };
      reader.readAsDataURL(file);
    }
  });

  // 사후 질문 입력값 변경시 실시간 캐시 갱신
  container.querySelectorAll('.pdi-answer-input').forEach(textarea => {
    textarea.addEventListener('input', (e) => {
      const key = e.target.getAttribute('data-key');
      htpState.pdiAnswers[key] = e.target.value;
      // 세션 갱신
      APP_STATE.activeSession.htp = {
        images: htpState.images,
        pdiAnswers: htpState.pdiAnswers
      };
    });
  });

  // 그림 단계 네비게이션
  const btnPrev = container.querySelector('#btn-htp-prev');
  const btnNext = container.querySelector('#btn-htp-next');

  btnPrev.addEventListener('click', () => {
    // 현재 그림 캔버스 저장
    const currentKey = htpState.drawTypes[currentDrawIdx].key;
    htpState.images[currentKey] = canvas.toDataURL('image/png');
    APP_STATE.activeSession.htp.images = htpState.images;

    htpState.currentDrawType = htpState.drawTypes[currentDrawIdx - 1].key;
    renderActiveDrawingStep(container);
  });

  btnNext.addEventListener('click', () => {
    // 1. PDI 질문 답변 검사
    const pdiInputs = container.querySelectorAll('.pdi-answer-input');
    let allPdiFilled = true;
    pdiInputs.forEach(textarea => {
      if (!textarea.value.trim()) allPdiFilled = false;
    });

    if (!allPdiFilled) {
      alert("현재 그림에 대한 사후 질문(PDI)에 모두 답해 주세요.");
      return;
    }

    // 2. 캔버스 드로잉/업로드 확인
    if (isCanvasBlank(canvas)) {
      alert("그림이 그려지지 않았거나 파일이 업로드되지 않았습니다. 캔버스에 직접 그리거나 종이에 그린 파일(JPG/PNG)을 아래 영역을 통해 업로드해 주세요.");
      return;
    }

    // 캔버스 저장
    const currentKey = htpState.drawTypes[currentDrawIdx].key;
    htpState.images[currentKey] = canvas.toDataURL('image/png');
    APP_STATE.activeSession.htp.images = htpState.images;

    if (currentDrawIdx < totalDrawSteps - 1) {
      htpState.currentDrawType = htpState.drawTypes[currentDrawIdx + 1].key;
      renderActiveDrawingStep(container);
    } else {
      // 투사그림 검사 최종 완료 -> 대단계를 검사 완료 처리
      moveNextStep();
    }
  });
}

// --------------------------------------------------------------------------
// 화면 입력값 강제 취합 함수 (임시 저장 및 다음 이직 시)
// --------------------------------------------------------------------------
function captureCurrentStepInput() {
  const step = TEST_STEPS_CONFIG[APP_STATE.currentMode][APP_STATE.currentStepIndex];
  
  if (step.id === 'intake') {
    const intake = APP_STATE.activeSession.intake || {};
    const nameInput = document.getElementById('intake-name');
    const ageInput = document.getElementById('intake-age');
    const genderSelect = document.getElementById('intake-gender');
    const jobInput = document.getElementById('intake-job');
    const complaintInput = document.getElementById('intake-complaint');

    if (nameInput) intake.name = nameInput.value.trim();
    if (ageInput) intake.age = parseInt(ageInput.value, 10);
    if (genderSelect) intake.gender = genderSelect.value;
    if (jobInput) intake.job = jobInput.value.trim();
    if (complaintInput) intake.complaint = complaintInput.value.trim();

    if (APP_STATE.currentMode === 'full') {
      const familyInput = document.getElementById('intake-family-history');
      const medicalInput = document.getElementById('intake-medical-history');
      const sleepInput = document.getElementById('intake-sleep');
      const appetiteInput = document.getElementById('intake-appetite');

      if (familyInput) intake.familyHistory = familyInput.value.trim();
      if (medicalInput) intake.medicalHistory = medicalInput.value.trim();
      if (sleepInput) intake.sleep = sleepInput.value.trim();
      if (appetiteInput) intake.appetite = appetiteInput.value.trim();
    }
    
    APP_STATE.activeSession.intake = intake;
  }
}

// 캔버스가 빈 흰색 단색인지 검사하는 헬퍼 함수
function isCanvasBlank(canvas) {
  const context = canvas.getContext('2d');
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  
  // 초기화 시 흰색(255, 255, 255)으로 채웠으므로, 
  // 흰색이 아닌 픽셀(즉, 사용자가 검은색이나 빨간색, 파란색 펜으로 칠한 픽셀)이 있는지 확인
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] !== 255 || data[i+1] !== 255 || data[i+2] !== 255) {
      return false; // 드로잉이 존재함
    }
  }
  return true; // 아무것도 그려지지 않음 (완벽한 흰색)
}

// 각 대단계별 이동 시 입력 밸리데이션 검사
function validateCurrentStep() {
  const steps = TEST_STEPS_CONFIG[APP_STATE.currentMode];
  const step = steps[APP_STATE.currentStepIndex];

  if (step.id === 'intake') {
    const name = document.getElementById('intake-name')?.value.trim();
    const age = document.getElementById('intake-age')?.value.trim();
    const gender = document.getElementById('intake-gender')?.value;
    const complaint = document.getElementById('intake-complaint')?.value.trim();

    if (!name || !age || !gender || !complaint) {
      alert("성명, 연령, 성별, 주요 호소 문제는 필수 입력 사항입니다.");
      return false;
    }
  }
  
  if (step.id === 'cognitive') {
    // 인지검사는 내부적으로 서브 단계 제어
    if (cognitiveState.currentSubTest === 'working_memory') {
      if (APP_STATE.activeSession.cognitive?.workingMemoryScore === undefined) {
        alert("작업 기억력 테스트를 진행하고 완료해 주세요.");
        return false;
      }
    } else if (cognitiveState.currentSubTest === 'verbal') {
      const inputs = document.querySelectorAll('.verbal-answer-input');
      let allFilled = true;
      inputs.forEach(input => {
        if (!input.value.trim()) allFilled = false;
      });
      if (!allFilled) {
        alert("모든 언어 이해 문항에 대해 답변을 작성해 주세요.");
        return false;
      }
    } else if (cognitiveState.currentSubTest === 'spatial') {
      if (APP_STATE.activeSession.cognitive?.puzzleAnswerIdx === undefined) {
        alert("도형 유추 퍼즐 문제를 풀고 완료해 주세요.");
        return false;
      }
    }
  }

  if (step.id === 'sct') {
    const inputs = document.querySelectorAll('.sct-input');
    let unfilledCount = 0;
    inputs.forEach(input => {
      if (!input.value.trim()) unfilledCount++;
    });
    if (unfilledCount > 0) {
      alert(`문장완성검사 문항 중 완료되지 않은 항목이 ${unfilledCount}개 있습니다. 모든 문항을 성실하게 완성해 주세요.`);
      return false;
    }
  }

  return true;
}

// ==========================================================================
// 7. 네비게이션 및 세션 완료 흐름
// ==========================================================================
function moveNextStep() {
  captureCurrentStepInput();
  if (!validateCurrentStep()) return; // 밸리데이션 통과하지 못하면 진행 차단
  
  const steps = TEST_STEPS_CONFIG[APP_STATE.currentMode];
  
  if (APP_STATE.currentStepIndex < steps.length - 1) {
    APP_STATE.currentStepIndex++;
    renderActiveTestStep();
    autoSaveCurrentSession(); // 자동 저장
  } else {
    // 모든 검사 대단계를 종료함
    finishAndGenerateSecureCode();
  }
}

function movePrevStep() {
  captureCurrentStepInput();
  if (APP_STATE.currentStepIndex > 0) {
    APP_STATE.currentStepIndex--;
    renderActiveTestStep();
  }
}

// ==========================================================================
// 8. 데이터 난독화 및 AI 프롬프트 완성 모듈
// ==========================================================================
async function finishAndGenerateSecureCode() {
  try {
    APP_STATE.activeSession.isCompleted = true;
    APP_STATE.activeSession.completedAt = new Date().toISOString();

    // 1. 결과 난독화 텍스트 생성
    const rawData = {
      mode: APP_STATE.activeSession.mode,
      intake: APP_STATE.activeSession.intake,
      cognitive: APP_STATE.activeSession.cognitive,
      survey: APP_STATE.activeSession.survey,
      sct: APP_STATE.activeSession.sct,
      htp: {
        pdiAnswers: APP_STATE.activeSession.htp.pdiAnswers,
        // 드로잉 데이터 포함 (용량을 효율화하기 위해 용량이 큰 Base64는 그대로 내비두되 난독화 영역에 잘 편입되도록 함)
        images: htpState.images 
      }
    };

    const secureBlockStr = buildSecurePayload(rawData);

    // 2. 최종 DB에 저장
    APP_STATE.activeSession.secureCode = secureBlockStr;
    await saveHistory(APP_STATE.activeSession);
    await deleteSession(APP_STATE.activeSession.id); // 완료된 임시 세션은 제거

    // 3. UI 갱신 및 결과 뷰 렌더링
    showSecureResultView(secureBlockStr);
    renderHistoryList();
  } catch (err) {
    console.error('검사 마감 처리 오류:', err);
    alert('검사 결과를 임시 데이터베이스에 보관하지 못했습니다.');
  }
}

// 난독화 알고리즘 (Base64 인코딩 -> 문자열 역순 -> 노이즈 패턴 삽입)
function buildSecurePayload(rawData) {
  const jsonStr = JSON.stringify(rawData);
  // 1. 유니코드 세이프 Base64 인코딩
  const base64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, function(match, p1) {
    return String.fromCharCode('0x' + p1);
  }));

  // 2. 문자열 역순 정렬
  const reversed = base64.split('').reverse().join('');

  // 3. 노이즈 삽입 (15글자 간격으로 'MB'를 패턴으로 섞어 일반 파싱 차단)
  let noiseEncoded = "";
  for (let i = 0; i < reversed.length; i++) {
    noiseEncoded += reversed[i];
    if (i > 0 && i % 15 === 0) {
      noiseEncoded += "MB";
    }
  }

  // 4. 모드에 맞는 시스템 프로토콜 및 복호화 프롬프트 바인딩
  const isFull = rawData.mode === 'full';
  const roleText = isFull 
    ? "국가 공인 정신건강임상심리사 1급 전문가이자 임상심리 학술 자문단" 
    : "임상 스크리닝 및 정신건강 예방 상담 전문가";
    
  const diagnosticInstruction = isFull 
    ? `
    당신의 작업 범위는 다음과 같습니다:
    1. [초기 인물 프로파일 분석]: 기초 인적사항 및 호소 문제, 성장 이력을 통한 전반적인 환경과 스트레스 요인 요약.
    2. [인지 기능 평가 (Brief Cognitive Profile)]: 작업기억(숫자 외우기) 점수, 언어 추론 답변의 논리성, 지각 도형 추론의 정확성을 토대로 피검사자의 현재 지적 기능 수준 및 정서적 간섭에 의한 인지력 억제 가능성 분석.
    3. [다면적 인성(MMPI) 및 TCI 기질 분석]: 입력된 객관식 점수 분포를 기반으로 척도 프로파일을 역산하여 주요 임상 척도(우울, 불안, 관계예민성 등) 점수 범위 예측 및 기질(자극추구, 위험회피 등)과의 연결성 정밀 해석.
    4. [투사검사 정밀 판독 (SCT & HTP)]: 
       - 문장완성검사 45개 반응을 통해 피검사자의 무의식적 자아상, 부모와의 애착 갈등, 성(性)적 갈등 및 대인관계적 갈등 패턴을 범주화하여 해석.
       - HTP(그림검사)의 PDI 답변 및 설명(제공된 그림 상태 묘사)을 기반으로 자아 경계의 통합도, 환경적 압박 및 내재된 욕구의 투사를 판독.
    5. [종합 임상적 소견 및 DSM-5 기준 분류]: 전반적인 결과를 종합하여 감별 진단이 필요한 영역(예: 주요 우울 장애, 범불안 장애, 성격 특성 등)을 유추하고 임상 소견 정리.
    6. [구체적 치료적 제언]: 향후 권장되는 상담 접근 방법, 인지행동 치료 기법, 상담 시 라포 형성을 위한 팁 제공.
    `
    : `
    당신의 작업 범위는 다음과 같습니다:
    1. [전반적인 기분 및 정서적 곤경 스크리닝]: 우울, 불안, 스트레스 지표의 간이 척도 분석을 바탕으로 현재의 위험수준(정상-경도-중등도-심각) 분류.
    2. [인지적 작업 효율성]: 작업기억 및 언어 퀴즈 결과를 통해 스트레스가 현재 일상적인 집중력과 뇌 효율에 미치고 있는 영향 평가.
    3. [SCT/HTP 핵심 무의식적 스트레스]: 그림의 느낌 설명과 문장 완성 문항을 대조하여 직관적으로 보이는 방어성, 핵심 불안 근원 파악.
    4. [피드백 및 대처 전략 제언]: 피검사자가 일상에서 즉각 시도해볼 수 있는 셀프 감정 조절 및 스트레스 환기 솔루션 가이드 제공.
    `;

  const securePayload = `=== MIND-BATTERY CLINICAL DATA SECURE BLOCK ===
[DECODING PROTOCOL GUIDE]
본 검사지는 피검사자의 오독 방지를 위해 특수 보안 포맷으로 직렬화되어 있습니다.
귀하는 다음 디코딩 절차를 프로그래밍적으로 또는 논리적으로 수행하여 원본 임상 raw 데이터를 완전히 복구하십시오:
1. 아래 "RawData" 텍스트 블록 전체에서 15글자 간격으로 삽입된 노이즈 플래그 "MB"를 모두 검색하여 영구 삭제하십시오.
2. 노이즈 문자가 제거된 텍스트 전체를 역순(Reverse)으로 뒤집으십시오.
3. 뒤집힌 문자열을 UTF-8 세이프 Base64 디코딩을 수행하여 JSON 데이터를 복구하십시오.

[DIAGNOSTIC MISSION]
- 귀하는 ${roleText}입니다.
- 복구된 환자의 임상 원자료(Raw Data)를 한글로 온전히 판독한 후 전문가 수준의 상세 종합 심리평가 보고서(Psychological Evaluation Report)를 작성하십시오.
${diagnosticInstruction}

[RawData]
${noiseEncoded}
=== END OF SECURE BLOCK ===`;

  return securePayload;
}

// 복사한 결과 화면 표시
function showSecureResultView(secureCode) {
  document.getElementById('secure-code-output').value = secureCode;
  switchView('result-view');
}

// 복사 기능
function copySecureCodeToClipboard() {
  const textarea = document.getElementById('secure-code-output');
  textarea.select();
  document.execCommand('copy');
  showToast('AI 보안 분석 코드가 클립보드에 복사되었습니다.');
}

// 텍스트 파일 다운로드
function downloadSecureCodeAsTxt() {
  const code = document.getElementById('secure-code-output').value;
  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `MIND_BATTERY_REPORT_${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(a);
  a.click();
  
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('텍스트 파일이 성공적으로 다운로드되었습니다.');
}

// ==========================================================================
// 9. 이벤트 바인딩 및 부팅
// ==========================================================================
window.addEventListener('DOMContentLoaded', async () => {
  // DB 부팅
  await initDatabase();
  await renderHistoryList();

  // 대시보드 검사시작 버튼 바인딩
  document.getElementById('btn-start-quick').addEventListener('click', () => {
    startNewTestSession('quick');
  });

  document.getElementById('btn-start-full').addEventListener('click', () => {
    startNewTestSession('full');
  });

  // 로고 클릭시 대시보드 리턴
  document.getElementById('header-logo').addEventListener('click', () => {
    if (APP_STATE.activeView === 'test-view') {
      if (confirm('현재 진행중인 검사가 있습니다. 대시보드로 돌아가시겠습니까? (현재까지 작성된 내용은 임시 저장됩니다.)')) {
        autoSaveCurrentSession();
        switchView('dashboard-view');
      }
    } else {
      switchView('dashboard-view');
    }
  });

  // 동의서 화면 버튼 바인딩
  const consentCheckbox = document.getElementById('consent-checkbox');
  const btnIntroStart = document.getElementById('btn-intro-start');
  
  consentCheckbox.addEventListener('change', (e) => {
    btnIntroStart.disabled = !e.target.checked;
  });

  document.getElementById('btn-intro-back').addEventListener('click', () => {
    switchView('dashboard-view');
  });

  btnIntroStart.addEventListener('click', () => {
    renderActiveTestStep();
    switchView('test-view');
  });

  // 검사 진행 화면 버튼 바인딩
  document.getElementById('btn-test-prev').addEventListener('click', movePrevStep);
  document.getElementById('btn-test-next').addEventListener('click', moveNextStep);
  
  document.getElementById('btn-test-save').addEventListener('click', () => {
    autoSaveCurrentSession();
    showToast('수동 임시 저장이 완료되었습니다.');
  });
  
  document.getElementById('btn-test-pause').addEventListener('click', () => {
    autoSaveCurrentSession();
    switchView('dashboard-view');
  });

  // 결과 화면 버튼 바인딩
  document.getElementById('btn-copy-code').addEventListener('click', copySecureCodeToClipboard);
  document.getElementById('btn-download-txt').addEventListener('click', downloadSecureCodeAsTxt);
  document.getElementById('btn-result-finish').addEventListener('click', () => {
    switchView('dashboard-view');
    renderHistoryList();
  });
});
