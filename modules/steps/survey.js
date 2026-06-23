/**
 * survey.js - [3단계] 객관식 정서/성격/기질 설문(MMPI/TCI) 모듈
 */

let surveyState = {
  questions: [],
  currentPage: 0,
  pageSize: 10,
  answers: {}
};

// 고유 척도 질문지 데이터 제네레이터
function generateSurveyQuestions(mode) {
  if (mode === 'quick') {
    const quickTexts = [
      "매사에 흥미가 없고 즐거움을 느끼기 어렵다.",
      "기분이 가라앉거나 우울하고 희망이 없다고 느낀다.",
      "잠들기가 어렵거나 자주 깨며, 혹은 잠을 너무 많이 잔다.",
      "평소보다 쉽게 피로를 느끼고 활력이 없다.",
      "입맛이 너무 없거나 반대로 과식을 하게 된다.",
      "내 자신이 실패자처럼 느껴지거나 가족을 실망시켰다고 생각한다.",
      "신문 읽기나 TV 시청 등 일상적인 일에 집중하기가 어렵다.",
      "말이나 행동이 평소보다 너무 느려졌거나 반대로 초조해서 안절부절못한다.",
      "가끔 모든 것을 끝내고 싶다는 극단적인 생각이 든다.",
      "내 미래에 대해 긍정적인 기대보다 절망감이 앞선다.",
      "긴장을 늦추기 어렵고 늘 초조하거나 안절부절못한다.",
      "걱정하는 것을 멈추거나 조절하기가 어렵다.",
      "여러 가지 일에 대해 지나치게 걱정을 많이 한다.",
      "편안하게 마음을 가라앉히기가 몹시 힘들다.",
      "가만히 앉아 있기 힘들 정도로 몸이 들뜨고 불안하다.",
      "쉽게 짜증이 나거나 예민해진다.",
      "마치 끔찍한 일이 일어날 것 같은 두려움을 느낀다.",
      "가슴이 두근거리거나 손발이 떨리는 신체적 불안 반응이 있다.",
      "사람들이 많이 모인 곳에 가면 식은땀이 나거나 숨이 막힌다.",
      "이유 없이 가슴이 답답하고 소화가 안 되며 긴장된다.",
      "새로운 곳이나 낯선 사람을 만나는 자리를 즐기는 편이다.",
      "미래의 위험이나 실패 가능성에 대해 미리 대비하고 조심한다.",
      "타인의 칭찬이나 인정에 쉽게 마음이 움직이고 따뜻한 편이다.",
      "한 번 시작한 일은 끝까지 끈기 있게 밀어붙인다.",
      "내 행동의 결과는 다른 누구도 아닌 전적으로 내 책임이다.",
      "도움이 필요한 타인을 보면 조건 없이 돕고 싶어진다.",
      "우주나 대자연의 질서 속에서 내 존재의 신비로움을 느끼곤 한다.",
      "새로운 아이디어나 자극적인 활동에 호기심이 매우 많다.",
      "규칙이나 절차가 확실하지 않은 불확실한 상황을 몹시 싫어한다.",
      "타인과 깊은 정서적 교감을 나누는 것에 보람을 느낀다."
    ];

    return quickTexts.map((txt, idx) => {
      let scale = 'Depression';
      if (idx >= 10 && idx < 20) scale = 'Anxiety';
      else if (idx >= 20) scale = 'Personality';
      return { id: `q_quick_${idx + 1}`, text: txt, scale: scale };
    });
  } else {
    const fullTexts = [
      "나는 신체적인 통증이나 질병에 대해 늘 남들보다 지나치게 걱정한다.",
      "자주 두통이나 어지러움을 느끼며 원인을 잘 모르겠다.",
      "가슴이 답답하고 숨쉬기 곤란해지는 증상이 종종 있다.",
      "소화가 잘 안 되거나 위장에 탈이 자주 나는 편이다.",
      "몸의 특정 부위가 마비되거나 굳어지는 느낌을 받은 적이 있다.",
      "건강을 해칠까 봐 일상생활의 활동을 과도하게 제한한다.",
      "사소한 몸의 변화에도 암 등 중병에 걸린 것은 아닐까 두려워한다.",
      "목이나 어깨 근육이 늘 뭉쳐 있고 뻐근한 통증이 있다.",
      "자고 일어나도 몸이 개운하지 않고 무겁게 가라앉는다.",
      "병원 검사에서 이상이 없다고 해도 건강에 대한 의심이 가시지 않는다.",
      "심장이 지나치게 빨리 뛰거나 불규칙하게 뛴다고 자주 느낀다.",
      "환절기나 스트레스 시기에 쉽게 신체적 컨디션이 무너진다.",
      "만성적인 관절통이나 요통으로 일상에서 큰 지장을 받는다.",
      "손발이 자주 저리거나 차갑게 굳어 통제하기 어렵다.",
      "가벼운 감기 증상에도 몸이 부서질 듯 아프고 심각하게 앓는다.",
      "조금만 움직여도 땀이 비정상적으로 많이 나거나 진이 빠진다.",
      "내 몸의 기능이 이전보다 급격하게 쇠퇴하고 있는 것 같다.",
      "잠을 청할 때 몸 곳곳에 통증이 느껴져 뒤척이게 된다.",
      "약을 과도하게 챙겨 먹거나 건강 보조식품에 의존하는 편이다.",
      "신체적 컨디션에 따라 내 하루 기분이 전적으로 좌우된다.",
      "피부가 너무 가렵거나 따끔거려 신경 쓰일 때가 많다.",
      "종종 목에 무언가 걸린 듯 답답한 느낌이 가시지 않는다.",
      "눈이 쉽게 피로해지거나 침침해지는 증상이 잦다.",
      "신체 건강에 대한 염려 때문에 밤에 잠을 설친다.",
      "몸에 열이 솟구치거나 반대로 오한이 드는 불규칙한 증상이 있다.",
      "치과나 병원에 주기적으로 가야 마음이 놓인다.",
      "조금만 피곤해도 잇몸이 붓거나 입안이 헐어 고생한다.",
      "목소리가 갑자기 잘 안 나오거나 쉬는 경우가 종종 있다.",
      "등이나 척추 쪽에 찌르는 듯한 불편감을 자주 호소한다.",
      "주변의 온도가 너무 덥거나 춥게 느껴져 환경 적응이 어렵다.",
      "삶의 모든 의욕이 꺾였고 어떤 일에도 전혀 재미를 느끼지 못한다.",
      "기분이 깊은 심연 속으로 가라앉아 헤어 나오지 못할 것 같다.",
      "이유 없이 눈물이 나거나 울컥하는 마음이 쏟아져 나온다.",
      "내가 살아있는 것이 주변 사람들에게 짐이 되는 것 같다.",
      "매사에 부정적이고 세상이 온통 잿빛으로 보인다.",
      "내가 일생 동안 실패자였으며 앞으로도 나아지지 않을 것 같다.",
      "스스로에 대한 실망감이 너무 크고 자존감이 완전히 바닥이다.",
      "아무도 나를 돕거나 이해해 줄 수 없을 것이라는 깊은 외로움이 든다.",
      "차라리 아침에 눈을 뜨지 않았으면 좋겠다고 상상한다.",
      "마치 내 몸의 에너지가 완전히 고갈되어 방전된 기분이다.",
      "과거의 실수나 잘못들이 머릿속에서 반복해서 재생되며 나를 괴롭힌다.",
      "주변의 즐거운 대화나 상황이 나에게는 아무런 자극이 되지 못한다.",
      "사소한 결정조차 내리기 힘들 정도로 우유부단해졌다.",
      "남들과 비교해 내 삶이 초라하고 보잘것없게 느껴진다.",
      "가족이나 친구들을 만나는 것조차 버겁고 피하게 된다.",
      "현재 내가 겪는 고통은 끝이 보이지 않는 긴 터널 같다.",
      "하루의 절반 이상을 침대 누워 무기력하게 보낸다.",
      "작은 문제에도 크게 좌절하고 주저앉고 싶어진다.",
      "사람들이 나를 차갑게 대하거나 싫어하는 것 같아 위축된다.",
      "마음속 깊은 곳에 억눌린 슬픔이 늘 자리 잡고 있다.",
      "일의 성과나 칭찬을 받아도 기쁘지 않고 허무하기만 하다.",
      "매사에 의심이 늘었고 다른 이들의 선의를 믿기 어렵다.",
      "내가 추구하던 인생의 목표들이 무의미하게 느껴진다.",
      "외출을 하는 것조차 큰 에너지를 써야 하는 고통이다.",
      "주변 상황이 좋아져도 나는 결코 행복해질 수 없을 것 같다.",
      "누군가 내 상태를 아는 것이 두려워 애써 밝은 척 포장한다.",
      "쉽게 감정이 동요하며 사소한 말 한마디에도 깊은 절망을 느낀다.",
      "기억력이 감퇴하여 최근에 나눴던 대화조차 가물가물하다.",
      "내가 살아온 인생 전체가 잘못된 선택들로 가득 차 있다.",
      "더 이상 내 감정을 통제하기 어려운 상태인 것 같다.",
      "늘 마음속에 막연한 나쁜 일이 일어날 것 같은 예감이 감돈다.",
      "한 번 꽂힌 생각이 머릿속을 맴돌며 떨쳐낼 수 없다.",
      "어떤 일을 하기 전에 수십 번씩 확인하고 재점검해야 안심한다.",
      "문이나 가스 밸브를 잠갔는지 확인하러 다시 집으로 돌아간 적이 많다.",
      "사소한 일에도 심장이 덜컥 내려앉거나 크게 깜짝 놀란다.",
      "매사에 완벽하게 준비되지 않으면 계획을 시작조차 하지 못한다.",
      "생각이 너무 복잡하여 꼬리에 꼬리를 물고 이어지느라 잠을 설친다.",
      "남들의 시선이나 평가에 극도로 신경 쓰여 행동이 부자연스럽다.",
      "주변 사물이 항상 제 자리에 똑바로 정렬되어 있어야 직성이 풀린다.",
      "결정을 내린 후에도 내가 실수를 저지른 것은 아닐까 밤새 고민한다.",
      "불결한 환경이나 바이러스에 오염될까 봐 유난히 청결에 집착한다.",
      "갑작스러운 일정 변경이나 불확실한 상황에 처하면 몹시 당황한다.",
      "마음속으로 숫자를 세거나 특정 행동을 반복해야 나쁜 일을 막을 것 같다.",
      "사소한 물건이나 쓰레기조차 버리지 못하고 방안에 쌓아둔다.",
      "타인에게 실수를 하거나 상처를 주었을까 봐 불안에 전전긍긍한다.",
      "내가 감정을 주체하지 못하고 폭발해 버릴까 봐 늘 긴장한다.",
      "어두운 곳이나 막힌 공간에 들어가면 호흡이 곤란해지는 두려움이 있다.",
      "누군가 나를 지켜보고 있는 듯한 찝찝한 긴장감이 늘 든다.",
      "아무 일도 일어나지 않는 평화로운 순간조차 불안이 엄습한다.",
      "남들이 보기에 별것 아닌 문제에 온 신경을 집중하며 시간을 낭비한다.",
      "과거에 겪었던 심한 정신적 충격이나 사고가 시도 때도 없이 기억난다.",
      "특정 행동(손씻기, 쓸고 닦기 등)을 지나치게 오래 반복하느라 일상에 방해를 받는다.",
      "불합리하거나 이상한 생각이 머릿속에 강제로 떠올라 나를 괴롭힌다.",
      "내 미래가 완전히 실패로 돌아갈 것 같다는 불안에 시달린다.",
      "긴장 상황에서 목덜미가 뻐근해지거나 어깨에 강한 통증이 온다.",
      "말실수를 할까 봐 낯선 이와의 대화를 가급적 피하려 한다.",
      "스스로 설정한 엄격한 기준을 맞추지 못하면 몹시 자책한다.",
      "위험 요소가 조금이라도 있는 도전은 가급적 시도하지 않는다.",
      "내가 아끼는 소중한 것을 잃어버리거나 손상될까 봐 극도로 예민하다.",
      "안절부절못하며 손톱을 뜯거나 다리를 심하게 떠는 습관이 있다.",
      "나는 새로운 곳에 여행을 가거나 낯선 환경에 노출되는 것이 너무 즐겁다.",
      "상황에 대처할 때 최악의 위험 상황을 먼저 가정하고 철저하게 설계한다.",
      "타인의 조그만 슬픔이나 곤경을 보면 내 일처럼 눈물이 나고 안타깝다.",
      "한 번 마음먹은 일은 아무리 힘들어도 포기하지 않고 끈질기게 완수한다.",
      "나는 내 미래와 운명을 스스로 개척하고 바꿀 힘이 있다고 믿는다.",
      "나와 아무 관련이 없는 낯선 사람의 부탁도 거절하기 힘들어 기꺼이 들어준다.",
      "우주의 거대한 신비나 자연의 섭리를 생각하면 깊은 경외감이 든다.",
      "매사 자극적이고 모험적인 일보다 안전하고 조용히 휴식하는 것을 좋아한다.",
      "낯선 음식을 맛보거나 안 해본 스포츠를 도전하는 데 거부감이 없다.",
      "인생에 규칙과 명확한 가이드라인이 부재하면 큰 혼란을 느낀다.",
      "주변의 친구들이 나를 칭찬하고 인정해 줄 때 엄청난 성취감을 느낀다.",
      "체력이 다하거나 한계에 봉착하더라도 쉽게 좌절하지 않고 밀어붙인다.",
      "나의 실망스러운 환경이나 현실은 전적으로 내 행동들의 결과물이다.",
      "동물이나 식물을 돌보는 것에 큰 기쁨을 느끼고 마음이 따뜻해진다.",
      "가끔 현실 세계를 초월한 무언가와 교감하는 듯한 신비로운 경험을 한다.",
      "새로운 아이디어가 번뜩이면 즉흥적으로 실행에 옮기는 편이다.",
      "어떤 결정을 내릴 때 오랫동안 의심하고 다른 사람의 조언을 끊임없이 구한다.",
      "사람들 사이에서 겉돌거나 차갑게 단절되었다고 느낄 때 몹시 고통스럽다.",
      "내가 노력해도 바꿀 수 없는 일에 에너지를 낭비하지 않고 수용한다.",
      "나를 희생하더라도 가족이나 속한 공동체의 평화를 지키는 것이 보람차다.",
      "나는 보이지 않는 영적인 가치나 종교적 믿음이 내 삶에서 매우 중요하다.",
      "계획된 정기 일정보다 즉흥적으로 당일 약속을 잡는 것을 선호한다.",
      "작은 실수로 전체 프로젝트가 실패할까 봐 사전에 검수를 극도로 꼼꼼하게 한다.",
      "사람들과 소통하는 것보다 혼자 책을 읽거나 생각에 잠기는 고독한 시간이 더 편하다.",
      "누구의 눈치도 보지 않고 내 소신과 주관에 따라 독립적으로 행동한다.",
      "내가 피해를 보더라도 남의 짐을 대신 짊어지는 이타적인 행동을 자주 한다.",
      "아름다운 예술 작품이나 자연경관을 보면 압도되는 감동을 느낀다.",
      "일상생활이 지나치게 단조롭고 지루하면 큰 스트레스를 받는다.",
      "처음 가는 공간에서는 길을 잃을까 봐 지도나 내비게이션을 계속 확인한다.",
      "친구들과 깊은 속마음이나 대인관계 고민을 공유하는 것에 장벽이 없다.",
      "어려운 환경에서도 내가 성실히 임하면 상황을 통제할 수 있다고 확신한다.",
      "이해관계가 다른 타인과 갈등이 생기면 먼저 양보하고 타협점을 찾는다.",
      "이 세상의 모든 존재가 눈에 보이지 않는 끈으로 하나로 연결되어 있다고 믿는다.",
      "변화가 잦은 직종보다 체계가 잡히고 변동이 없는 직장이 훨씬 좋다.",
      "건강 진단 결과가 나오기까지 심각한 걱정에 휩싸여 다른 일을 하지 못한다.",
      "누군가에게 아쉬운 소리를 하거나 도움을 요청하는 것이 몹시 수치스럽다.",
      "스스로 정한 단기 목표를 달성하지 못하면 심한 우울감을 느낀다.",
      "사회적 규칙보다 개인의 양심과 도덕성이 더 상위에 있는 가치라고 생각한다.",
      "시간이 날 때마다 봉사활동을 하거나 도움이 필요한 곳에 기부하려 노력한다.",
      "우연한 행운이나 운명의 신비로운 일치를 깊이 신뢰하는 편이다.",
      "남들과 다른 튀는 옷을 입거나 독특한 행동을 하는 것에 부담이 없다.",
      "비행기 탑승이나 높은 곳에 오르는 것에 대해 극심한 공포심을 가진다.",
      "사람들이 나를 어색해하거나 거부하는 신호를 본능적으로 몹시 빠르게 감지한다.",
      "한 번 시작한 독서나 공부는 반드시 끝 페이지까지 읽어야 후련하다.",
      "내가 한 실수를 솔직하게 인정하고 그 대가를 달게 받을 준비가 되어 있다.",
      "내가 조금 더 노력하면 세상의 고통을 조금이나마 덜 수 있다고 생각한다.",
      "명상이나 요가 등을 통해 마음의 평화를 찾으려 애쓴다.",
      "지루하고 반복적인 문서 작업이나 공부는 오랜 시간 동안 견디기 힘들다.",
      "낯선 사람에게 먼저 말을 걸거나 길을 물어보는 것이 몹시 부끄럽다.",
      "대화 중 내 실수를 누군가 지적하면 온종일 머릿속에 맴돌며 반추한다.",
      "내 단점을 잘 알고 있으며, 이를 극복하기 위해 매일 노력하고 있다.",
      "이기적이거나 남을 배려하지 않는 사람을 보면 참을 수 없는 분노가 든다.",
      "때로 나 자신을 잊고 어떤 창작 활동이나 자연의 신비 속에 완전히 몰입한다.",
      "주식 투자나 복권 구매 등 위험성이 있지만 큰 보상이 따르는 기회를 좋아한다.",
      "중요한 시험 전날에는 몹시 긴장하여 밤을 새우거나 배탈이 난다.",
      "사람들이 모인 자리에서 분위기를 띄우거나 활기차게 주도하는 편이다.",
      "과제가 복잡하고 해결책이 안 보여도 일단 끈기 있게 계속 탐색한다.",
      "타인에게 의존하기보다 내 삶의 방향성은 전적으로 내가 통제해야 한다.",
      "세상을 혼자 살 수 없으므로 이웃이나 동료와 늘 끈끈하게 상생해야 한다.",
      "기적이 실제로 일어난다고 믿으며 초자연적인 경험을 겪어본 적이 있다.",
      "익숙한 길로만 다니며 위험하거나 거리가 더 먼 새로운 길은 시도하지 않는다.",
      "타인의 부탁을 거절할 때 큰 죄책감을 느끼고 미안해한다.",
      "스스로의 내면적 신념과 외적 행동이 늘 일치하도록 단속한다.",
      "소외당하는 사람을 보면 따뜻한 말 한마디라도 꼭 건네고 위로한다.",
      "내 영혼의 깊이가 깊어지는 것에 관심이 많고 평온함을 원한다.",
      "사소한 돈을 절약하기 위해 먼 거리를 기꺼이 걸어가는 짠돌이 기질이 있다.",
      "내가 큰 병에 걸렸을 때의 외로움과 고통에 대해 종종 상상해 본다.",
      "나를 싫어하는 사람의 비위를 맞추거나 잘 보이려 노력하지 않는다.",
      "아무리 귀찮아도 운동이나 자기 관리를 계획대로 실행하는 자제력이 있다.",
      "약자를 보호하고 정의를 지키기 위해서라면 다수의 의견에 맞설 용기가 있다.",
      "나의 자아를 완전히 내려놓고 인류나 자연의 일부로 동화되는 평온을 느낀다.",
      "안정된 대기업이나 공무원보다 자율성이 보장되는 창업이나 프리랜서가 어울린다.",
      "안전벨트 착용이나 속도제한 규정을 매우 엄격하게 지킨다.",
      "집단 내에서 내 주장이 받아들여지지 않아도 쉽게 상처받지 않고 수용한다.",
      "매일 해야 하는 귀찮은 루틴 업무도 높은 집중력과 끈기로 잘 소화한다.",
      "남의 탓을 하기보다 내가 변화하여 상황을 긍정적으로 해결하려 한다.",
      "서로 미워하는 사람들을 중재하고 화해하도록 돕는 역할에 보람을 느낀다.",
      "때로 종교적인 깨달음이나 내면의 강한 통찰을 통해 행동이 뒤바뀐다.",
      "흥미로운 취미 생활을 발견하면 비용이나 시간을 대책 없이 투자하곤 한다.",
      "지진이나 기상이변 등 대자연의 재앙에 대해 남들보다 강한 공포를 느낀다.",
      "나에 대한 험담이나 뜬소문에 대해 신경 쓰지 않고 무던하게 대처한다.",
      "한 번 포기하기로 선언한 일은 미련을 두지 않고 깔끔하게 잊어버린다.",
      "남의 시선을 의식하지 않고 내 내면의 기준에 충족되는 삶을 산다.",
      "내가 가진 전문적인 재능이나 지식을 사회에 나누는 활동을 적극 수행한다.",
      "가끔 거울 속에 비친 내 영혼의 모습이나 자아의 본질에 대해 깊이 탐색한다.",
      "새로운 물건을 쇼핑하거나 소비할 때 가장 살아있는 흥분을 느낀다.",
      "내 노후 생활이나 먼 미래의 질병에 대해 젊을 때부터 진지하게 준비한다.",
      "처음 보는 사람과도 10분 이상 스스럼없이 즐거운 대화를 이어나갈 수 있다.",
      "학업이나 일의 마감 기한이 닥쳐도 침착하게 순서를 정해 깔끔하게 끝낸다.",
      "내 인생의 주인공은 전적으로 나 자신이며 내 선택에 책임을 진다.",
      "아무리 싫은 상대라도 인격을 존중하고 친절하게 대하려 극도로 애쓴다.",
      "우리가 눈으로 보지 못하는 사후세계나 영혼의 실체를 굳게 믿는다.",
      "평범하고 상식적인 직관보다 예술적 영감과 내면의 필(feel)이 더 중요하게 느껴진다.",
      "가장 친한 친구와 갈등이 생기더라도 정면 돌파하며 풀어나가는 용기가 있다.",
      "나를 둘러싼 삶의 질서와 환경을 매일 감사하게 수용하는 마음가짐이 있다.",
      "가끔 온종일 명상하며 내 생각의 흐름을 조용히 관찰하는 활동을 한다.",
      "익숙하지 않은 타국의 문화를 접하고 수용하는 데에 큰 거부감이 없다.",
      "언제 어디서 사고를 당할지 몰라 항상 긴장감을 갖고 생명보험을 중요시한다.",
      "사람들의 거절로 상처받았을 때 며칠간 몸져누울 정도로 감정 소모가 심하다.",
      "나는 삶의 역경 속에서도 끝내 내가 옳다고 믿는 목표를 완수할 끈기를 가졌다."
    ];

    // 역채점 문항 인덱스 정의 (0-indexed)
    // 사회적 친화성(RD) 역채점: Q114 (113), Q126 (125), Q140 (139), Q163 (162), Q169 (168), Q181 (180), Q194 (193), Q213 (212)
    // 위험 회피성(HA) 역채점: Q91 (90), Q99 (98), Q146 (145), Q154 (153), Q175 (174), Q206 (205)
    // 자극 추구성(NS) 역채점: Q98 (97), Q153 (152), Q179 (178), Q218 (217), Q243 (242)
    // 자기 조절력(SD) 역채점: Q138 (137), Q182 (181), Q193 (192), Q227 (226)
    const reverseIndices = [
      113, 119, 120, 134, 135, 150, 155, 158, 168, 169, 188
    ];

    return fullTexts.map((txt, idx) => {
      let scale = 'Depression';
      if (idx < 30) scale = 'SomaticConcern';
      else if (idx >= 30 && idx < 60) scale = 'Depression';
      else if (idx >= 60 && idx < 90) scale = 'Anxiety';
      else if (idx >= 90 && idx < 115) scale = 'SocialAffiliation';
      else if (idx >= 115 && idx < 140) scale = 'HarmAvoidance';
      else if (idx >= 140 && idx < 165) scale = 'NoveltySeeking';
      else scale = 'SelfDirection';

      const isReversed = reverseIndices.includes(idx);
      return { id: `q_full_${idx + 1}`, text: txt, scale: scale, reversed: isReversed };
    });
  }
}

export function calculateScores(answers, mode) {
  if (mode === 'quick') {
    let depressionSum = 0;
    let anxietySum = 0;
    let personalitySum = 0;
    
    for (let i = 1; i <= 45; i++) {
      const val = answers[`q_quick_${i}`] || 0;
      if (i <= 10) depressionSum += val;
      else if (i <= 20) anxietySum += val;
      else personalitySum += val;
    }
    
    return {
      Depression: depressionSum,
      Anxiety: anxietySum,
      Personality: personalitySum
    };
  } else {
    let somaticSum = 0;
    let depressionSum = 0;
    let anxietySum = 0;
    let socialAffiliationSum = 0;
    let harmAvoidanceSum = 0;
    let noveltySeekingSum = 0;
    let selfDirectionSum = 0;

    const reverseIndices = [
      113, 119, 120, 134, 135, 150, 155, 158, 168, 169, 188
    ];

    for (let i = 0; i < 190; i++) {
      const qId = `q_full_${i + 1}`;
      let val = answers[qId] || 0;
      if (reverseIndices.includes(i)) {
        val = 4 - val;
      }

      if (i < 30) somaticSum += val;
      else if (i >= 30 && i < 60) depressionSum += val;
      else if (i >= 60 && i < 90) anxietySum += val;
      else if (i >= 90 && i < 115) socialAffiliationSum += val;
      else if (i >= 115 && i < 140) harmAvoidanceSum += val;
      else if (i >= 140 && i < 165) noveltySeekingSum += val;
      else selfDirectionSum += val;
    }

    let carelessIndex = 0;
    const v1 = answers['q_full_114'];
    const v2 = answers['q_full_169'];
    if (v1 !== undefined && v2 !== undefined) carelessIndex += Math.abs(v1 - v2);

    const v3 = answers['q_full_126'];
    const v4 = answers['q_full_181'];
    if (v3 !== undefined && v4 !== undefined) carelessIndex += Math.abs(v3 - v4);

    const v5 = answers['q_full_139'];
    const v6 = answers['q_full_194'];
    if (v5 !== undefined && v6 !== undefined) carelessIndex += Math.abs(v5 - v6);

    return {
      SomaticConcern: somaticSum,
      Depression: depressionSum,
      Anxiety: anxietySum,
      SocialAffiliation: socialAffiliationSum,
      HarmAvoidance: harmAvoidanceSum,
      NoveltySeeking: noveltySeekingSum,
      SelfDirection: selfDirectionSum,
      CarelessIndex: carelessIndex
    };
  }
}

export function render(container, sessionData, mode, onComplete) {
  surveyState.questions = generateSurveyQuestions(mode);
  surveyState.currentPage = 0;
  surveyState.answers = sessionData.survey || {};
  sessionData.surveyScores = calculateScores(surveyState.answers, mode);

  renderSurveyPage(container, sessionData, mode, onComplete);
}

function renderSurveyPage(container, sessionData, mode, onComplete) {
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
      sessionData.survey = surveyState.answers;
      sessionData.surveyScores = calculateScores(surveyState.answers, mode);
    });
  });

  container.querySelector('#btn-survey-prev-page').addEventListener('click', () => {
    if (surveyState.currentPage > 0) {
      surveyState.currentPage--;
      renderSurveyPage(container, sessionData, mode, onComplete);
    }
  });

  container.querySelector('#btn-survey-next-page').addEventListener('click', () => {
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
      renderSurveyPage(container, sessionData, mode, onComplete);
    } else {
      if (onComplete) onComplete();
    }
  });
}

export function capture(sessionData, mode) {
  sessionData.survey = surveyState.answers;
  sessionData.surveyScores = calculateScores(surveyState.answers, mode);
}

export function validate(container, sessionData, mode) {
  // 이미 각 페이지별로 다 채우고 넘어오도록 강제했으므로 true 리턴
  return true;
}
