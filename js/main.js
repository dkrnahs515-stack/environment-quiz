// ===== 환경 퀴즈 메인 로직 =====

// 상태 관리
const state = {
  selectedCategory: 'all',
  selectedCount: 10,
  questions: [],
  currentIndex: 0,
  score: 0,
  correctCount: 0,
  wrongItems: [],
  answered: false
};

// DOM 요소
const screens = {
  start:  document.getElementById('screen-start'),
  quiz:   document.getElementById('screen-quiz'),
  result: document.getElementById('screen-result')
};

const quitModal      = document.getElementById('quitModal');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalConfirmBtn= document.getElementById('modalConfirmBtn');
const quitBtn        = document.getElementById('quitBtn');

// ===== 그만하기 모달 =====
function openQuitModal() {
  quitModal.classList.add('active');
}

function closeQuitModal() {
  quitModal.classList.remove('active');
}

quitBtn.addEventListener('click', openQuitModal);

// 계속 풀기
modalCancelBtn.addEventListener('click', closeQuitModal);

// 처음으로 확정
modalConfirmBtn.addEventListener('click', () => {
  closeQuitModal();
  goHome();
});

// 모달 바깥 클릭 시 닫기
quitModal.addEventListener('click', (e) => {
  if (e.target === quitModal) closeQuitModal();
});

// ESC 키로 모달 닫기
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && quitModal.classList.contains('active')) {
    closeQuitModal();
  }
});

// ===== 처음 화면으로 이동 공통 함수 =====
function goHome() {
  showScreen('start');
  document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.category-btn[data-category="all"]').classList.add('active');
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.mode-btn[data-count="10"]').classList.add('active');
  state.selectedCategory = 'all';
  state.selectedCount = 10;
}

// ===== 화면 전환 =====
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== 시작 화면 이벤트 =====
document.querySelectorAll('.category-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedCategory = btn.dataset.category;
  });
});

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedCount = parseInt(btn.dataset.count);
  });
});

document.getElementById('startBtn').addEventListener('click', startQuiz);

// ===== 퀴즈 시작 =====
function startQuiz() {
  // 카테고리에 따라 문제 필터링
  let pool = state.selectedCategory === 'all'
    ? [...QUIZ_DATA]
    : QUIZ_DATA.filter(q => q.category === state.selectedCategory);

  if (pool.length === 0) {
    alert('선택한 카테고리에 문제가 없어요!');
    return;
  }

  // 문제 섞기 (피셔-예이츠 셔플)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // 선택한 수만큼 자르기
  const count = Math.min(state.selectedCount, pool.length);
  state.questions = pool.slice(0, count);

  // 상태 초기화
  state.currentIndex = 0;
  state.score = 0;
  state.correctCount = 0;
  state.wrongItems = [];
  state.answered = false;

  showScreen('quiz');
  renderQuestion();
}

// ===== 문제 렌더링 =====
function renderQuestion() {
  const q = state.questions[state.currentIndex];
  const total = state.questions.length;
  const idx = state.currentIndex;

  state.answered = false;

  // 헤더 업데이트
  document.getElementById('questionCounter').textContent = `${idx + 1} / ${total}`;
  document.getElementById('categoryTag').textContent = q.categoryLabel;
  document.getElementById('currentScore').textContent = state.score;

  // 진행바
  const pct = (idx / total) * 100;
  document.getElementById('progressBar').style.width = pct + '%';

  // 문제
  document.getElementById('questionNumber').textContent = `Q${idx + 1}`;
  document.getElementById('questionText').textContent = q.question;

  // 선택지 렌더링
  const grid = document.getElementById('choicesGrid');
  grid.innerHTML = '';

  // 선택지 순서 섞기 (답 위치 랜덤)
  const indices = [0, 1, 2, 3];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // 섞인 순서로 버튼 생성
  const shuffledChoices = indices.map(i => ({ text: q.choices[i], originalIndex: i }));
  const correctShuffledIndex = shuffledChoices.findIndex(c => c.originalIndex === q.answer);

  shuffledChoices.forEach((choice, shuffledIdx) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = `${['①', '②', '③', '④'][shuffledIdx]} ${choice.text}`;
    btn.dataset.shuffledIndex = shuffledIdx;
    btn.dataset.correct = (shuffledIdx === correctShuffledIndex) ? 'true' : 'false';
    btn.addEventListener('click', () => handleAnswer(btn, shuffledIdx === correctShuffledIndex, q));
    grid.appendChild(btn);
  });

  // 피드백 박스 숨기기
  const fb = document.getElementById('feedbackBox');
  fb.classList.remove('visible', 'feedback-wrong');

  // 애니메이션
  document.querySelector('.question-area').style.animation = 'none';
  setTimeout(() => {
    document.querySelector('.question-area').style.animation = 'fadeIn 0.4s ease';
  }, 10);
}

// ===== 답 처리 =====
function handleAnswer(selectedBtn, isCorrect, q) {
  if (state.answered) return;
  state.answered = true;

  const allBtns = document.querySelectorAll('.choice-btn');

  // 모든 버튼 비활성화
  allBtns.forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.correct === 'true') {
      btn.classList.add('reveal-correct');
    }
  });

  const fb = document.getElementById('feedbackBox');
  const fbIcon = document.getElementById('feedbackIcon');
  const fbText = document.getElementById('feedbackText');
  const expText = document.getElementById('explanationText');

  if (isCorrect) {
    selectedBtn.classList.add('correct');
    fb.classList.add('visible');
    fb.classList.remove('feedback-wrong');
    fbIcon.textContent = '🎉';
    fbText.textContent = '정답이에요! 아주 잘했어요!';
    state.score += 10;
    state.correctCount++;
    document.getElementById('currentScore').textContent = state.score;

    // 정답 효과음 (시각 피드백)
    showScorePopup('+10점', true);
  } else {
    selectedBtn.classList.add('wrong');
    fb.classList.add('visible', 'feedback-wrong');
    fbIcon.textContent = '😢';
    fbText.textContent = '아쉬워요! 다음엔 꼭 맞힐 수 있어요!';

    // 오답 기록
    state.wrongItems.push(q);
    showScorePopup('틀렸어요', false);
  }

  expText.textContent = `💡 ${q.explanation}`;

  // 마지막 문제 여부에 따라 버튼 텍스트 변경
  const nextBtn = document.getElementById('nextBtn');
  nextBtn.textContent = (state.currentIndex === state.questions.length - 1)
    ? '📊 결과 보기!'
    : '다음 문제 →';
}

// ===== +점수 팝업 =====
function showScorePopup(text, isCorrect) {
  const popup = document.createElement('div');
  popup.textContent = text;
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.5);
    font-size: 2rem;
    font-weight: 900;
    color: ${isCorrect ? '#43a047' : '#e53935'};
    background: ${isCorrect ? '#e8f5e9' : '#ffebee'};
    border: 3px solid ${isCorrect ? '#66bb6a' : '#ef9a9a'};
    padding: 14px 28px;
    border-radius: 20px;
    z-index: 9999;
    pointer-events: none;
    transition: all 0.5s ease;
    font-family: 'Noto Sans KR', sans-serif;
  `;
  document.body.appendChild(popup);

  requestAnimationFrame(() => {
    popup.style.transform = 'translate(-50%, -120%) scale(1)';
    popup.style.opacity = '1';
  });

  setTimeout(() => {
    popup.style.opacity = '0';
    popup.style.transform = 'translate(-50%, -200%) scale(0.8)';
    setTimeout(() => popup.remove(), 500);
  }, 900);
}

// ===== 다음 문제 =====
document.getElementById('nextBtn').addEventListener('click', () => {
  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex++;
    renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    showResult();
  }
});

// ===== 결과 화면 =====
function showResult() {
  showScreen('result');

  const total = state.questions.length;
  const maxScore = total * 10;
  const rate = Math.round((state.correctCount / total) * 100);
  const wrong = total - state.correctCount;

  // 점수 카운트 업 애니메이션
  animateNumber('resultScore', state.score, 800);

  document.getElementById('resultTotal').textContent = `/ ${maxScore}점`;
  document.getElementById('correctCount').textContent = state.correctCount;
  document.getElementById('wrongCount').textContent = wrong;
  document.getElementById('ratePercent').textContent = rate + '%';

  // 등급 & 메시지
  const gradeInfo = getGrade(rate);
  document.getElementById('resultEmoji').textContent = gradeInfo.emoji;
  document.getElementById('resultTitle').textContent = gradeInfo.title;
  document.getElementById('resultGrade').textContent = gradeInfo.grade;
  document.getElementById('resultGrade').style.color = gradeInfo.color;
  document.getElementById('resultMessage').textContent = gradeInfo.message;

  // 오답 복습
  renderWrongReview();
}

// ===== 숫자 카운트업 애니메이션 =====
function animateNumber(elId, target, duration) {
  const el = document.getElementById(elId);
  const start = 0;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ===== 등급 계산 =====
function getGrade(rate) {
  if (rate === 100) return {
    emoji: '🏆', title: '완벽해요!', grade: '⭐⭐⭐ 환경 박사!',
    color: '#f57c00',
    message: '와! 100점 만점이에요! 당신은 진짜 환경 전문가예요! 지구가 당신 덕분에 웃고 있어요. 🌍💚'
  };
  if (rate >= 90) return {
    emoji: '🥇', title: '훌륭해요!', grade: '⭐⭐⭐ 환경 지킴이!',
    color: '#e65100',
    message: '거의 완벽해요! 환경에 대해 정말 잘 알고 있군요. 조금만 더 공부하면 만점도 금방이에요!'
  };
  if (rate >= 70) return {
    emoji: '🥈', title: '잘했어요!', grade: '⭐⭐ 환경 탐험가!',
    color: '#1565c0',
    message: '아주 잘했어요! 환경에 대한 지식이 쑥쑥 자라고 있어요. 틀린 문제를 다시 읽어보면 더 잘할 수 있어요!'
  };
  if (rate >= 50) return {
    emoji: '🥉', title: '괜찮아요!', grade: '⭐ 환경 새싹!',
    color: '#2e7d32',
    message: '절반 이상 맞혔어요! 환경 공부를 더 하면 점점 좋아질 거예요. 다시 도전해 보세요! 🌱'
  };
  return {
    emoji: '🌱', title: '도전하세요!', grade: '환경 씨앗!',
    color: '#6a1b9a',
    message: '걱정하지 마세요! 틀린 문제를 보며 하나씩 배워가면 돼요. 다시 도전하면 분명 더 잘할 수 있어요! 💪'
  };
}

// ===== 오답 복습 렌더링 =====
function renderWrongReview() {
  const container = document.getElementById('wrongReview');
  if (state.wrongItems.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#43a047; font-weight:700; font-size:1.05rem;">🎊 오답이 없어요! 완벽해요!</p>';
    return;
  }

  let html = `<h3>❌ 틀린 문제 다시 보기 (${state.wrongItems.length}개)</h3>`;
  state.wrongItems.forEach((q, i) => {
    html += `
      <div class="review-item">
        <div class="review-q">Q. ${q.question}</div>
        <div class="review-a">✅ 정답: ${q.choices[q.answer]}</div>
        <div style="color:#555; font-size:0.88rem; margin-top:4px;">💡 ${q.explanation}</div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// ===== 다시 도전 / 처음으로 =====
document.getElementById('restartBtn').addEventListener('click', () => {
  startQuiz();
});

document.getElementById('homeBtn').addEventListener('click', goHome);

// ===== 초기 화면 =====
showScreen('start');
