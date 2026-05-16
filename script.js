function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach((page) => {
    page.classList.remove('active');
  });

  const target = document.getElementById(pageId);
  if (!target) return;

  target.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function showMainAndScrollTo(sectionId) {
  document.querySelectorAll('.page').forEach((page) => {
    page.classList.remove('active');
  });

  const mainPage = document.getElementById('main-page');
  if (!mainPage) return;
  mainPage.classList.add('active');

  requestAnimationFrame(() => {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
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
    showMainAndScrollTo('frame-3');
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
  } catch {
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

const caseCard1 = document.getElementById('caseCard1');
const caseCard2 = document.getElementById('caseCard2');
const caseCard3 = document.getElementById('caseCard3');
const backToStories1 = document.getElementById('backToStories1');
const backToStories2 = document.getElementById('backToStories2');
const backToStories3 = document.getElementById('backToStories3');
const goGym = document.getElementById('goGym');
const restartGym = document.getElementById('restartGym');
const backArticle = document.getElementById('backArticle');

if (caseCard1) caseCard1.addEventListener('click', () => showPage('story-case-1-page'));
if (caseCard2) caseCard2.addEventListener('click', () => showPage('story-case-2-page'));
if (caseCard3) caseCard3.addEventListener('click', () => showPage('story-case-3-page'));

if (backToStories1) backToStories1.addEventListener('click', () => showMainAndScrollTo('story-1-page'));
if (backToStories2) backToStories2.addEventListener('click', () => showMainAndScrollTo('story-1-page'));
if (backToStories3) backToStories3.addEventListener('click', () => showMainAndScrollTo('story-1-page'));

if (goGym) goGym.addEventListener('click', () => showPage('gym-page'));

const gymStatus = document.getElementById('gymStatus');
const gymPlaceholder = document.getElementById('gymPlaceholder');

function resetGymPage() {
  if (gymPlaceholder) gymPlaceholder.textContent = '圖片 placeholder（初始狀態）';
  if (gymStatus) gymStatus.textContent = '已重新開始';
}

if (restartGym) {
  restartGym.addEventListener('click', () => {
    resetGymPage();
  });
}

if (backArticle) {
  backArticle.addEventListener('click', () => {
    showMainAndScrollTo('frame-11');
  });
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
