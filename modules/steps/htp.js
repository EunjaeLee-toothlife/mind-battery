/**
 * htp.js - [5단계] 그림검사 (HTP/KFD) 캔버스 드로잉, 업로드 및 PDI 질문 모듈
 */

let htpState = {
  currentDrawType: 'house',
  drawTypes: [],
  images: {},
  pdiAnswers: {},
  metadata: {}
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

export function render(container, sessionData, mode, onComplete) {
  htpState.drawTypes = HTP_CONFIGS[mode];
  htpState.currentDrawType = htpState.drawTypes[0].key;
  
  const htpData = sessionData.htp || {};
  htpState.images = htpData.images || {};
  htpState.pdiAnswers = htpData.pdiAnswers || {};
  htpState.metadata = htpData.metadata || {};

  // 행동 관찰 메타데이터 초기 구조 주입 및 그리기 시작 시간 기록
  if (!htpState.metadata[htpState.currentDrawType]) {
    htpState.metadata[htpState.currentDrawType] = { strokeCount: 0, eraserCount: 0, clearCount: 0, duration: 0 };
  }
  htpState.metadata[htpState.currentDrawType].startTime = Date.now();

  renderActiveDrawingStep(container, sessionData, mode, onComplete);
}

function renderActiveDrawingStep(container, sessionData, mode, onComplete) {
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
        <div class="drawing-zone">
          <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:4px;">직접 캔버스에 마우스나 손가락으로 그림을 그리거나, 종이에 그린 스캔본 파일을 아래로 업로드해 주세요.</p>
          <div class="canvas-wrapper">
            <canvas class="drawing-canvas" id="canvas-paint"></canvas>
          </div>
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
          <div class="uploader-zone" id="upload-zone">
            <i data-lucide="image"></i>
            <span>종이에 그린 파일 가져오기 (JPG, PNG)</span>
            <input type="file" id="file-input" accept="image/*" style="display: none;">
            <img class="upload-preview" id="preview-image" alt="미리보기">
          </div>
        </div>

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
  attachHtpListeners(container, sessionData, mode, currentDrawIdx, totalDrawSteps, onComplete);

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

function initCanvasDrawing() {
  const canvas = document.getElementById('canvas-paint');
  drawingContext = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 600;

  drawingContext.lineCap = 'round';
  drawingContext.lineJoin = 'round';
  drawingContext.strokeStyle = brushColor;
  drawingContext.lineWidth = brushSize;

  drawingContext.fillStyle = '#ffffff';
  drawingContext.fillRect(0, 0, canvas.width, canvas.height);

  function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else {
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

    // 행동 관찰: 선 긋기(획수) 카운트 증가
    const currentKey = htpState.currentDrawType;
    if (htpState.metadata[currentKey]) {
      htpState.metadata[currentKey].strokeCount++;
    }
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

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);
}

function attachHtpListeners(container, sessionData, mode, currentDrawIdx, totalDrawSteps, onComplete) {
  const canvas = document.getElementById('canvas-paint');
  const btnBrush = document.getElementById('btn-tool-brush');
  const btnEraser = document.getElementById('btn-tool-eraser');
  const btnClear = document.getElementById('btn-tool-clear');
  const sizeSlider = document.getElementById('brush-size');
  
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
    drawingContext.strokeStyle = '#ffffff';
    drawingContext.lineWidth = brushSize * 3;

    // 행동 관찰: 지우개 선택 카운트 증가
    const currentKey = htpState.currentDrawType;
    if (htpState.metadata[currentKey]) {
      htpState.metadata[currentKey].eraserCount++;
    }
  });

  btnClear.addEventListener('click', () => {
    if (confirm('캔버스를 초기화하고 처음부터 다시 그리겠습니까?')) {
      drawingContext.fillStyle = '#ffffff';
      drawingContext.fillRect(0, 0, canvas.width, canvas.height);

      // 행동 관찰: 캔버스 초기화 카운트 증가
      const currentKey = htpState.currentDrawType;
      if (htpState.metadata[currentKey]) {
        htpState.metadata[currentKey].clearCount++;
      }
    }
  });

  container.querySelectorAll('.brush-color').forEach(elem => {
    elem.addEventListener('click', () => {
      container.querySelectorAll('.brush-color').forEach(el => el.classList.remove('selected'));
      elem.classList.add('selected');
      brushColor = elem.getAttribute('data-color');
      
      isEraser = false;
      btnBrush.classList.add('active');
      btnEraser.classList.remove('active');
      drawingContext.strokeStyle = brushColor;
      drawingContext.lineWidth = brushSize;
    });
  });

  sizeSlider.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value, 10);
    drawingContext.lineWidth = isEraser ? brushSize * 3 : brushSize;
  });

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
        
        const img = new Image();
        img.src = evt.target.result;
        img.onload = () => {
          drawingContext.clearRect(0, 0, 800, 600);
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

  container.querySelectorAll('.pdi-answer-input').forEach(textarea => {
    textarea.addEventListener('input', (e) => {
      const key = e.target.getAttribute('data-key');
      htpState.pdiAnswers[key] = e.target.value;
      sessionData.htp = {
        images: htpState.images,
        pdiAnswers: htpState.pdiAnswers
      };
    });
  });

  const btnPrev = container.querySelector('#btn-htp-prev');
  const btnNext = container.querySelector('#btn-htp-next');

  // 현재 그림 체류 시간 누적 및 타이머 초기화 함수
  function stopTimerAndAccumulate(key) {
    if (htpState.metadata[key] && htpState.metadata[key].startTime) {
      const elapsed = Math.round((Date.now() - htpState.metadata[key].startTime) / 1000);
      htpState.metadata[key].duration += elapsed;
      htpState.metadata[key].startTime = 0;
    }
  }

  btnPrev.addEventListener('click', () => {
    const currentKey = htpState.drawTypes[currentDrawIdx].key;
    stopTimerAndAccumulate(currentKey);

    htpState.images[currentKey] = canvas.toDataURL('image/png');
    sessionData.htp.images = htpState.images;
    sessionData.htp.metadata = htpState.metadata;

    htpState.currentDrawType = htpState.drawTypes[currentDrawIdx - 1].key;

    // 이전 그림 시작 타이머 작동
    const prevKey = htpState.currentDrawType;
    if (!htpState.metadata[prevKey]) {
      htpState.metadata[prevKey] = { strokeCount: 0, eraserCount: 0, clearCount: 0, duration: 0 };
    }
    htpState.metadata[prevKey].startTime = Date.now();

    renderActiveDrawingStep(container, sessionData, mode, onComplete);
  });

  btnNext.addEventListener('click', () => {
    const pdiInputs = container.querySelectorAll('.pdi-answer-input');
    let allPdiFilled = true;
    pdiInputs.forEach(textarea => {
      if (!textarea.value.trim()) allPdiFilled = false;
    });

    if (!allPdiFilled) {
      alert("현재 그림에 대한 사후 질문(PDI)에 모두 답해 주세요.");
      return;
    }

    if (isCanvasBlank(canvas)) {
      alert("그림이 그려지지 않았거나 파일이 업로드되지 않았습니다. 캔버스에 직접 그리거나 종이에 그린 파일(JPG/PNG)을 아래 영역을 통해 업로드해 주세요.");
      return;
    }

    const currentKey = htpState.drawTypes[currentDrawIdx].key;
    stopTimerAndAccumulate(currentKey);

    htpState.images[currentKey] = canvas.toDataURL('image/png');
    sessionData.htp.images = htpState.images;
    sessionData.htp.metadata = htpState.metadata;

    if (currentDrawIdx < totalDrawSteps - 1) {
      htpState.currentDrawType = htpState.drawTypes[currentDrawIdx + 1].key;

      // 다음 그림 시작 타이머 작동
      const nextKey = htpState.currentDrawType;
      if (!htpState.metadata[nextKey]) {
        htpState.metadata[nextKey] = { strokeCount: 0, eraserCount: 0, clearCount: 0, duration: 0 };
      }
      htpState.metadata[nextKey].startTime = Date.now();

      renderActiveDrawingStep(container, sessionData, mode, onComplete);
    } else {
      if (onComplete) onComplete();
    }
  });
}

function isCanvasBlank(canvas) {
  const context = canvas.getContext('2d');
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] !== 255 || data[i+1] !== 255 || data[i+2] !== 255) {
      return false;
    }
  }
  return true;
}

export function capture(sessionData, mode) {
  const canvas = document.getElementById('canvas-paint');
  if (canvas) {
    const currentKey = htpState.currentDrawType;
    htpState.images[currentKey] = canvas.toDataURL('image/png');
    sessionData.htp = {
      images: htpState.images,
      pdiAnswers: htpState.pdiAnswers,
      metadata: htpState.metadata
    };
  }
}

export function validate(container, sessionData, mode) {
  // 마지막 그림의 유효성을 검사합니다.
  const currentDrawIdx = htpState.drawTypes.findIndex(d => d.key === htpState.currentDrawType);
  const totalDrawSteps = htpState.drawTypes.length;

  if (currentDrawIdx < totalDrawSteps - 1) {
    alert("모든 그림 그리기와 사후 질문을 끝마치셔야 보고서를 완성할 수 있습니다.");
    return false;
  }

  const pdiInputs = container.querySelectorAll('.pdi-answer-input');
  let allPdiFilled = true;
  pdiInputs.forEach(textarea => {
    if (!textarea.value.trim()) allPdiFilled = false;
  });

  if (!allPdiFilled) {
    alert("현재 그림에 대한 사후 질문(PDI)에 모두 답해 주세요.");
    return false;
  }

  const canvas = document.getElementById('canvas-paint');
  if (canvas && isCanvasBlank(canvas)) {
    alert("그림이 그려지지 않았거나 파일이 업로드되지 않았습니다.");
    return false;
  }

  return true;
}
