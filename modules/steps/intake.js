/**
 * intake.js - [1단계] 초기 면접지 폼 렌더링 및 유효성 검사 모듈
 */

export function render(container, sessionData, mode) {
  const isFull = mode === 'full';
  const data = sessionData.intake || {};

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
}

export function capture(sessionData, mode) {
  const intake = sessionData.intake || {};
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

  if (mode === 'full') {
    const familyInput = document.getElementById('intake-family-history');
    const medicalInput = document.getElementById('intake-medical-history');
    const sleepInput = document.getElementById('intake-sleep');
    const appetiteInput = document.getElementById('intake-appetite');

    if (familyInput) intake.familyHistory = familyInput.value.trim();
    if (medicalInput) intake.medicalHistory = medicalInput.value.trim();
    if (sleepInput) intake.sleep = sleepInput.value.trim();
    if (appetiteInput) intake.appetite = appetiteInput.value.trim();
  }
  
  sessionData.intake = intake;
}

export function validate(container) {
  const name = document.getElementById('intake-name')?.value.trim();
  const age = document.getElementById('intake-age')?.value.trim();
  const gender = document.getElementById('intake-gender')?.value;
  const complaint = document.getElementById('intake-complaint')?.value.trim();

  if (!name || !age || !gender || !complaint) {
    alert("성명, 연령, 성별, 주요 호소 문제는 필수 입력 사항입니다.");
    return false;
  }
  return true;
}
