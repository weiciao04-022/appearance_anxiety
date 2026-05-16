function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const btnBmi = document.getElementById('btn-bmi');
if (btnBmi) {
  btnBmi.addEventListener('click', () => scrollToSection('frame-3'));
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
    const rounded = bmi.toFixed(1);
    bmiValue.textContent = rounded;

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

const choiceData = { card1: 12, card2: 25, card3: 31, card4: 20, card5: 12 };
const idealCards = document.querySelectorAll('.ideal-card');
const choiceResult = document.getElementById('choiceResult');
idealCards.forEach((card) => {
  card.addEventListener('click', () => {
    idealCards.forEach((c) => c.classList.remove('active'));
    card.classList.add('active');
    const key = card.dataset.card;
    choiceResult.textContent = `你和 ${choiceData[key]}% 人的選擇一樣`;
  });
});

const linkMap = [
  ['caseCard1', 'frame-6'],
  ['caseCard2', 'frame-7'],
  ['caseCard3', 'frame-8'],
  ['backToStories1', 'frame-5'],
  ['backToStories2', 'frame-5'],
  ['backToStories3', 'frame-5'],
  ['goGym', 'frame-10'],
  ['restart', 'frame-5'],
  ['backArticle', 'frame-11']
];

linkMap.forEach(([triggerId, targetId]) => {
  const el = document.getElementById(triggerId);
  if (el) {
    el.addEventListener('click', () => scrollToSection(targetId));
  }
});

const observer = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
