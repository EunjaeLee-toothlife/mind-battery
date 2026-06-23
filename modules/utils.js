/**
 * utils.js - 공통 난독화 알고리즘 및 UI 편의성 유틸리티 모듈
 */

// 데이터 난독화 알고리즘 (Base64 인코딩 -> 문자열 역순 -> 노이즈 패턴 삽입)
export function buildSecurePayload(rawData) {
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
    2. [기초 인지 탐색 (Brief Cognitive Profile)]: 작업기억(숫자 게임) 점수, 언어 추론 게임 답변의 논리성, 지각 도형 추론의 정확성을 토대로 피검사자의 현재 인지 활동 성향 및 정서적 긴장/간섭에 따른 일시적 주의력 억제 가능성 탐색. (공식 지능검사가 아닌 참고용 워밍업 게임으로 다룸)
    3. [정서성 및 성격 특성 스크리닝 (surveyScores 기반)]: pre-calculated된 정서성 지표(우울성, 불안성, 신체화 경향)와 성격/기질 특성(자극추구형, 위험회피형, 사회적친화형, 자기조절력) 및 무성의 답변 지표(CarelessIndex)를 바탕으로 현재 겪고 있는 심리적 불안정성의 프로파일 및 개인의 대처 양식을 해석.
       - 주의: CarelessIndex가 4점 이상일 경우, 피검사자가 질문을 일관성 없이(무성의하게) 답변했거나 방어적인 응답 왜곡을 취했을 가능성이 높으므로 해석 시 신뢰도가 낮음을 반드시 소견에 기재해 주십시오.
    4. [투사검사 판독 (SCT & HTP)]: 
       - 문장완성검사(SCT) 반응을 통해 피검사자의 무의식적 자아상, 부모와의 관계, 대인관계적 갈등 패턴을 해석. (성적 문항 등 일부 누락된 문항이 있을 경우, 해석을 무리하게 유추하지 말고 누락 사실만 언급하십시오)
       - HTP(그림검사)의 PDI 답변 및 행동 메타데이터(strokeCount, eraserCount, clearCount, duration)를 기반으로 내재된 정서적 욕구를 판독.
    5. [종합 임상적 소견 및 스크리닝 결론]: 전반적인 결과를 종합하여 감별 진단이 필요한 영역(예: 주요 우울 경향, 불안 경향 등)을 스크리닝 소견으로 정리하되, "본 검사는 정신과적 의학적 진단이 아니며, 참고용 자료"임을 반드시 보고서 하단에 기재하십시오.
    6. [구체적 치료적 제언]: 향후 권장되는 상담 접근 방법, 인지행동 치료 기법, 상담 시 라포 형성을 위한 팁 제공.
    `
    : `
    당신의 작업 범위는 다음과 같습니다:
    1. [전반적인 기분 및 정서적 곤경 스크리닝]: 우울, 불안 지표의 간이 척도 분석을 바탕으로 현재의 위험수준(정상-경도-중등도-심각) 분류.
    2. [인지적 작업 효율성]: 작업기억 및 언어 퀴즈 결과를 통해 스트레스가 현재 일상적인 집중력에 미치고 있는 영향 평가.
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

// 토스트 메시지 출력
export function showToast(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.querySelector('.toast-message').textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }
}

async function createGzipBlob(text) {
  if (!window.CompressionStream) {
    throw new Error('CompressionStream is not supported.');
  }

  const stream = new Blob([text], { type: 'text/plain;charset=utf-8' })
    .stream()
    .pipeThrough(new CompressionStream('gzip'));
  return new Response(stream).blob();
}

// gzip 압축 파일 다운로드
export async function downloadAsGzip(filename, text, successMessage) {
  try {
    const blob = await createGzipBlob(text);
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (successMessage) {
      showToast(successMessage);
    }
  } catch (err) {
    console.error('압축 파일 다운로드 실패:', err);
    alert('압축 파일 저장에 실패했습니다. Safari 또는 Chrome에서 다시 시도해 주세요.');
  }
}

// 모바일 공유 시트로 gzip 파일 공유
export async function shareAsGzip(filename, text) {
  try {
    if (!navigator.share || !window.File) {
      alert('현재 브라우저는 파일 공유를 지원하지 않습니다. 압축 파일 저장을 사용해 주세요.');
      return;
    }

    const blob = await createGzipBlob(text);
    const file = new File([blob], filename, { type: 'application/gzip' });
    const shareData = {
      title: 'MIND-BATTERY 결과 파일',
      text: '압축된 검사 결과 파일입니다.',
      files: [file]
    };

    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
      alert('현재 브라우저는 압축 파일 공유를 지원하지 않습니다. 압축 파일 저장을 사용해 주세요.');
      return;
    }

    await navigator.share(shareData);
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.error('압축 파일 공유 실패:', err);
    alert('파일 공유에 실패했습니다. 압축 파일 저장을 사용해 주세요.');
  }
}
