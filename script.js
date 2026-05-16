const CHOICE_STORAGE_KEY = 'bodyIdealChoices';
const mockData = [];

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const btnBmi = document.getElementById('btnBmi');

function initBmiModalTrigger() {
  const phoneFeed = document.getElementById('phoneFeed');
  const bmiModal = document.getElementById('bmiModal');
  if (!phoneFeed || !bmiModal) return;

  let modalShown = false;

  function showModal() {
    if (modalShown) return;
    modalShown = true;
    bmiModal.classList.add('visible', 'show');
    bmiModal.setAttribute('aria-hidden', 'false');
  }

  if (window.matchMedia('(max-width: 900px)').matches) {
    const posts = phoneFeed.querySelectorAll('.ig-post');
    const lastPost = posts[posts.length - 1];
    if (!lastPost) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          showModal();
          observer.disconnect();
        }
      });
    }, {
      threshold: 0.35
    });

    observer.observe(lastPost);
  } else {
    phoneFeed.addEventListener('scroll', () => {
      const maxScroll = phoneFeed.scrollHeight - phoneFeed.clientHeight;
      if (maxScroll <= 0) return;

      const scrollRatio = phoneFeed.scrollTop / maxScroll;
      if (scrollRatio >= 0.88) {
        showModal();
      }
    });
  }
}

initBmiModalTrigger();

if (btnBmi) {
  btnBmi.addEventListener('click', () => {
    document.getElementById('frame-3')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

const heightInput = document.getElementById('heightInput');
const weightInput = document.getElementById('weightInput');
const submitBmi = document.getElementById('submitBmi');
const bmiValue = document.getElementById('bmiValue');
const bmiStatus = document.getElementById('bmiStatus');

if (submitBmi && heightInput && weightInput && bmiValue && bmiStatus) {
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
  if (!choiceResult) return;
  const percentage = calculateChoicePercentage(choice);
  choiceResult.textContent = `你和曾點選過的人中，有 ${percentage}% 選擇一樣的答案`;
}

function submitChoiceToGitHub(choice) {
  // 正式部署時，應改成呼叫後端 API / GitHub Action / serverless function，不要把 GitHub Token 放在前端。
  // 建議做法：前端送 choice 給你的後端，後端再用安全憑證寫入 GitHub Issues 或 Gist。
  return Promise.resolve({ ok: true, choice });
}

const choiceCards = document.querySelectorAll('.choice-card');
if (choiceCards.length > 0) {
  choiceCards.forEach((card) => {
    card.addEventListener('click', async () => {
      const choice = card.dataset.choice;
      if (!choice) return;

      choiceCards.forEach((item) => item.classList.remove('active'));
      card.classList.add('active');

      saveChoice(choice);
      await submitChoiceToGitHub(choice);
      renderChoiceResult(choice);
    });
  });
}

const restartGym = document.getElementById('restartGym');
if (restartGym) {
  restartGym.addEventListener('click', (event) => {
    event.preventDefault();
    const status = document.getElementById('gymStatus');
    if (status) status.textContent = '已重新開始';
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
