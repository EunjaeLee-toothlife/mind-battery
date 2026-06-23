/**
 * app.js - 메인 오케스트레이터 및 SPA 라우팅 코어 모듈 (ES6 Modules)
 */

import * as db from './modules/db.js';
import * as utils from './modules/utils.js';

// 각 검사 단계 모듈 동적 로드
import * as intakeStep from './modules/steps/intake.js';
import * as cognitiveStep from './modules/steps/cognitive.js';
import * as surveyStep from './modules/steps/survey.js';
import * as sctStep from './modules/steps/sct.js';
import * as htpStep from './modules/steps/htp.js';

// 글로벌 상태 정의
const APP_STATE = {
  activeView: 'dashboard-view',
  currentMode: null, // 'quick' | 'full'
  currentStepIndex: 0,
  activeSession: null
};

// 단계 배치 맵
const STEP_MODULES = {
  intake: intakeStep,
  cognitive: cognitiveStep,
  survey: surveyStep,
  sct: sctStep,
  htp: htpStep
};

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

// --------------------------------------------------------------------------
// SPA 뷰 전환 함수
// --------------------------------------------------------------------------
function switchView(viewId) {
  const currentView = document.getElementById(APP_STATE.activeView);
  const targetView = document.getElementById(viewId);

  if (currentView) {
    currentView.classList.remove('active');
  }

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

// --------------------------------------------------------------------------
// 대시보드 과거 이력 렌더러
// --------------------------------------------------------------------------
async function renderHistoryList() {
  const listContainer = document.getElementById('history-list');
  try {
    const list = await db.loadHistoryList();
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
  document.querySelectorAll('.btn-resume').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const session = await db.loadSession(id);
      if (session) {
        resumeTestSession(session);
      }
    });
  });

  document.querySelectorAll('.btn-view-result').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const item = await db.getHistoryItem(id);
      if (item && item.secureCode) {
        showSecureResultView(item.secureCode);
      }
    });
  });

  document.querySelectorAll('.btn-delete-history').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('해당 검사 이력을 로컬 데이터베이스에서 완전히 삭제하시겠습니까?')) {
        await db.deleteHistoryItem(id);
        await db.deleteSession(id);
        utils.showToast('성공적으로 삭제되었습니다.');
        renderHistoryList();
      }
    });
  });
}

// --------------------------------------------------------------------------
// 세션 생성 및 제어 흐름
// --------------------------------------------------------------------------
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

async function autoSaveCurrentSession() {
  if (!APP_STATE.activeSession) return;
  
  captureCurrentStepInput();
  
  APP_STATE.activeSession.stepIndex = APP_STATE.currentStepIndex;
  APP_STATE.activeSession.timestamp = new Date().toISOString();

  await db.saveSession(APP_STATE.activeSession);
  await db.saveHistory(APP_STATE.activeSession);
  
  utils.showToast('검사 내용이 브라우저에 임시 저장되었습니다.');
  renderHistoryList();
}

// --------------------------------------------------------------------------
// 단계별 동적 화면 제어
// --------------------------------------------------------------------------
function renderActiveTestStep() {
  const steps = TEST_STEPS_CONFIG[APP_STATE.currentMode];
  const step = steps[APP_STATE.currentStepIndex];

  document.getElementById('active-test-type').textContent = 
    APP_STATE.currentMode === 'quick' ? '간이 스크리닝 검사' : '정밀 풀배터리 검사';
  document.getElementById('active-step-title').textContent = step.title;

  const progressPercent = Math.round((APP_STATE.currentStepIndex / steps.length) * 100);
  document.getElementById('progress-percentage').textContent = `${progressPercent}%`;
  document.getElementById('progress-bar-fill').style.width = `${progressPercent}%`;

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

  document.getElementById('btn-test-prev').style.visibility = 
    APP_STATE.currentStepIndex === 0 ? 'hidden' : 'visible';
  
  const nextBtn = document.getElementById('btn-test-next');
  if (APP_STATE.currentStepIndex === steps.length - 1) {
    nextBtn.innerHTML = '검사 완료 <i data-lucide="check"></i>';
  } else {
    nextBtn.innerHTML = '다음 단계 <i data-lucide="chevron-right"></i>';
  }
  lucide.createIcons();

  const stepContainer = document.getElementById('step-container');
  stepContainer.innerHTML = '';

  // 각 모듈의 렌더링 호출
  const stepModule = STEP_MODULES[step.id];
  if (stepModule) {
    stepModule.render(stepContainer, APP_STATE.activeSession, APP_STATE.currentMode, () => {
      // 내부적으로 완료(SCT 완료나 인지 완료 등) 신호를 주면 다음 단계 전진
      moveNextStep();
    });
  }
}

function captureCurrentStepInput() {
  const steps = TEST_STEPS_CONFIG[APP_STATE.currentMode];
  const step = steps[APP_STATE.currentStepIndex];
  const stepModule = STEP_MODULES[step.id];
  
  if (stepModule && stepModule.capture) {
    stepModule.capture(APP_STATE.activeSession, APP_STATE.currentMode);
  }
}

function validateCurrentStep() {
  const steps = TEST_STEPS_CONFIG[APP_STATE.currentMode];
  const step = steps[APP_STATE.currentStepIndex];
  const stepModule = STEP_MODULES[step.id];
  
  const stepContainer = document.getElementById('step-container');
  if (stepModule && stepModule.validate) {
    return stepModule.validate(stepContainer, APP_STATE.activeSession, APP_STATE.currentMode);
  }
  return true;
}

function moveNextStep() {
  captureCurrentStepInput();
  if (!validateCurrentStep()) return;
  
  const steps = TEST_STEPS_CONFIG[APP_STATE.currentMode];
  
  if (APP_STATE.currentStepIndex < steps.length - 1) {
    APP_STATE.currentStepIndex++;
    renderActiveTestStep();
    autoSaveCurrentSession();
  } else {
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

// --------------------------------------------------------------------------
// 검사 마감 및 결과 출력
// --------------------------------------------------------------------------
async function finishAndGenerateSecureCode() {
  try {
    APP_STATE.activeSession.isCompleted = true;
    APP_STATE.activeSession.completedAt = new Date().toISOString();

    const rawData = {
      mode: APP_STATE.activeSession.mode,
      intake: APP_STATE.activeSession.intake,
      cognitive: APP_STATE.activeSession.cognitive,
      survey: APP_STATE.activeSession.survey,
      sct: APP_STATE.activeSession.sct,
      htp: APP_STATE.activeSession.htp
    };

    const secureBlockStr = utils.buildSecurePayload(rawData);

    APP_STATE.activeSession.secureCode = secureBlockStr;
    await db.saveHistory(APP_STATE.activeSession);
    await db.deleteSession(APP_STATE.activeSession.id);

    showSecureResultView(secureBlockStr);
    renderHistoryList();
  } catch (err) {
    console.error('검사 마감 처리 오류:', err);
    alert('검사 결과를 임시 데이터베이스에 보관하지 못했습니다.');
  }
}

function showSecureResultView(secureCode) {
  document.getElementById('secure-code-output').value = secureCode;
  switchView('result-view');
}

// ==========================================================================
// 엔트리 초기화 및 전역 바인딩
// ==========================================================================
window.addEventListener('DOMContentLoaded', async () => {
  // DB 로드
  await db.initDatabase((isActive) => {
    if (isActive) {
      document.getElementById('storage-status').innerHTML = '<i data-lucide="database"></i> 로컬 보안 활성';
      lucide.createIcons();
    }
  });
  await renderHistoryList();

  // 대시보드 검사시작 버튼 바인딩
  document.getElementById('btn-start-quick').addEventListener('click', () => {
    startNewTestSession('quick');
  });

  document.getElementById('btn-start-full').addEventListener('click', () => {
    startNewTestSession('full');
  });

  // 로고 클릭시 리턴
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

  // 동의서 화면 동의 토글
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

  // 공통 네비게이션 제어
  document.getElementById('btn-test-prev').addEventListener('click', movePrevStep);
  document.getElementById('btn-test-next').addEventListener('click', moveNextStep);
  
  document.getElementById('btn-test-save').addEventListener('click', () => {
    autoSaveCurrentSession();
    utils.showToast('수동 임시 저장이 완료되었습니다.');
  });
  
  document.getElementById('btn-test-pause').addEventListener('click', () => {
    autoSaveCurrentSession();
    switchView('dashboard-view');
  });

  // 결과 제어 버튼 바인딩
  document.getElementById('btn-copy-code').addEventListener('click', () => {
    const code = document.getElementById('secure-code-output').value;
    utils.copyToClipboard(code, 'AI 보안 분석 코드가 클립보드에 복사되었습니다.');
  });
  
  document.getElementById('btn-download-txt').addEventListener('click', () => {
    const code = document.getElementById('secure-code-output').value;
    const filename = `MIND_BATTERY_REPORT_${new Date().toISOString().slice(0,10)}.txt`;
    utils.downloadAsTxt(filename, code, '텍스트 파일이 성공적으로 다운로드되었습니다.');
  });

  document.getElementById('btn-result-finish').addEventListener('click', () => {
    switchView('dashboard-view');
    renderHistoryList();
  });
});
