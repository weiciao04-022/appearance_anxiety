function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const phoneFeed = document.getElementById('phoneFeed');
const bmiModal = document.getElementById('bmiModal');
const btnBmi = document.getElementById('btnBmi');
let hasShownBmiModal = false;

if (phoneFeed && bmiModal) {
  phoneFeed.addEventListener('scroll', () => {
    if (hasShownBmiModal) return;
    const maxScrollable = phoneFeed.scrollHeight - phoneFeed.clientHeight;
    if (maxScrollable <= 0) return;

    const ratio = phoneFeed.scrollTop / maxScrollable;
    if (ratio >= 0.45) {
      bmiModal.classList.add('show');
      bmiModal.setAttribute('aria-hidden', 'false');
      hasShownBmiModal = true;
    }
  });
}

if (btnBmi) {
  btnBmi.addEventListener('click', () => {
    scrollToSection('frame-3');
  });
}

const heightInput = document.getElementById('heightInput');
const weightInput = document.getElementById('weightInput');
const submitBmi = document.getElementById('submitBmi');
const bmiValue = document.getElementById('bmiValue');
const bmiStatus = document.getElementById('bmiStatus');

if (submitBmi) {
  submitBmi.addEventListener('click', () => {
    const heightCm = Number(heightInput.value);
    const weightKg = Number(weightInput.value);

    if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
      bmiStatus.textContent = '請輸入有效的身高與體重';
      return;
    }

    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    bmiValue.textContent = bmi.toFixed(1);

    if (bmi < 18.5) {
      bmiStatus.textContent = '偏低';
    } else if (bmi < 24) {
      bmiStatus.textContent = '正常';
    } else if (bmi < 27) {
      bmiStatus.textContent = '過重';
    } else {
      bmiStatus.textContent = '肥胖';
    }
  });
}

const CHOICE_STORAGE_KEY = 'bodyIdealChoices';
const mockData = [];

function getChoices() {
  try {
    const raw = localStorage.getItem(CHOICE_STORAGE_KEY);
    if (!raw) return [...mockData];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...mockData];
    return parsed;
  } catch (error) {
    return [...mockData];
  }
}

function saveChoice(choice) {
  const current = getChoices();
  current.push({ choice, createdAt: new Date().toISOString() });
  localStorage.setItem(CHOICE_STORAGE_KEY, JSON.stringify(current));
}

function calculateChoicePercentage(choice) {
  const choices = getChoices();
  if (choices.length === 0) return 0;
  const sameCount = choices.filter((item) => item.choice === choice).length;
  return Math.round((sameCount / choices.length) * 100);
}

function renderChoiceResult(choice) {
  const choiceResult = document.getElementById('choiceResult');
  const percentage = calculateChoicePercentage(choice);
  choiceResult.textContent = `你和曾點選過的人中，有 ${percentage}% 選擇一樣的答案`;
}

function submitChoiceToGitHub(choice) {
  // 正式部署時，應改成呼叫後端 API / GitHub Action / serverless function，不要把 GitHub Token 放在前端。
  // 建議做法：前端送 choice 給你的後端，後端再用安全憑證寫入 GitHub Issues 或 Gist。
  return Promise.resolve({ ok: true, choice });
}

const choiceCards = document.querySelectorAll('.choice-card');
choiceCards.forEach((card) => {
  card.addEventListener('click', async () => {
    const choice = card.dataset.choice;
    choiceCards.forEach((item) => item.classList.remove('active'));
    card.classList.add('active');

    saveChoice(choice);
    await submitChoiceToGitHub(choice);
    renderChoiceResult(choice);
  });
});

function bindJump(triggerId, targetId) {
  const trigger = document.getElementById(triggerId);
  if (!trigger) return;
  trigger.addEventListener('click', () => scrollToSection(targetId));
}

bindJump('caseCard1', 'frame-6');
bindJump('caseCard2', 'frame-7');
bindJump('caseCard3', 'frame-8');
bindJump('backToStories1', 'frame-5');
bindJump('backToStories2', 'frame-5');
bindJump('backToStories3', 'frame-5');
bindJump('goGym', 'frame-10');
bindJump('backArticle', 'frame-11');

const frame10Status = document.getElementById('frame10Status');
const frame10Placeholder = document.getElementById('frame10Placeholder');

function restartFrame10() {
  if (frame10Placeholder) {
    frame10Placeholder.textContent = '圖片 placeholder（初始狀態）';
  }
  if (frame10Status) {
    frame10Status.textContent = '已重新開始';
  }
}

const restartBtn = document.getElementById('restart');
if (restartBtn) {
  restartBtn.addEventListener('click', restartFrame10);
}

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll('.reveal').forEach((element) => {
  revealObserver.observe(element);
});
