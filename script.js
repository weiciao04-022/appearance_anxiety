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

  function showBmiModal() {
    if (modalShown) return;
    modalShown = true;
    bmiModal.classList.add('visible', 'show');
    bmiModal.setAttribute('aria-hidden', 'false');
  }

  phoneFeed.addEventListener('scroll', () => {
    const maxScroll = phoneFeed.scrollHeight - phoneFeed.clientHeight;
    if (maxScroll <= 0) return;

    const scrollRatio =
      phoneFeed.scrollTop /
      (phoneFeed.scrollHeight - phoneFeed.clientHeight);

    if (scrollRatio >= 0.88 && !modalShown) {
      showBmiModal();
    }
  });
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

function initHealthyMealSection() {
  const section = document.querySelector('[data-meal-section]');
  if (!section) return;

  const items = {
    veggies: [
      { name: '花椰菜', asset: 'assets/foods/broccoli.png', color: '#8fbf67', calories: 35, protein: 3, fat: 0, carbs: 7 },
      { name: '玉米筍', asset: 'assets/foods/baby-corn.png', color: '#f0c860', calories: 28, protein: 1, fat: 0, carbs: 6 },
      { name: '高麗菜', asset: 'assets/foods/cabbage.png', color: '#b8d985', calories: 30, protein: 2, fat: 0, carbs: 6 },
      { name: '菠菜', asset: 'assets/foods/spinach.png', color: '#75aa61', calories: 25, protein: 3, fat: 0, carbs: 4 },
      { name: '杏鮑菇', asset: 'assets/foods/mushroom.png', color: '#d7c4a1', calories: 36, protein: 2, fat: 0, carbs: 7 },
      { name: '南瓜', asset: 'assets/foods/pumpkin.png', color: '#eba24c', calories: 55, protein: 1, fat: 0, carbs: 13 },
      { name: '小黃瓜', asset: 'assets/foods/cucumber.png', color: '#94cb7b', calories: 18, protein: 1, fat: 0, carbs: 4 },
      { name: '胡蘿蔔', asset: 'assets/foods/carrot.png', color: '#ee8d43', calories: 32, protein: 1, fat: 0, carbs: 8 },
      { name: '紫高麗菜', asset: 'assets/foods/purple-cabbage.png', color: '#b895c8', calories: 30, protein: 1, fat: 0, carbs: 7 },
      { name: '毛豆', asset: 'assets/foods/edamame.png', color: '#8fbd65', calories: 80, protein: 8, fat: 3, carbs: 7 }
    ],
    protein: [
      { name: '舒肥雞胸', asset: 'assets/foods/chicken.png', color: '#dfbf91', calories: 165, protein: 31, fat: 4, carbs: 0 },
      { name: '鮭魚', asset: 'assets/foods/salmon.png', color: '#ef9d7a', calories: 210, protein: 22, fat: 13, carbs: 0 },
      { name: '牛肉', asset: 'assets/foods/beef.png', color: '#c17a5a', calories: 230, protein: 25, fat: 14, carbs: 0 },
      { name: '豆腐', asset: 'assets/foods/tofu.png', color: '#f2e8d6', calories: 120, protein: 12, fat: 7, carbs: 4 },
      { name: '水煮蛋', asset: 'assets/foods/egg.png', color: '#f1cf72', calories: 78, protein: 6, fat: 5, carbs: 1 }
    ],
    sauce: [
      { name: '胡麻醬', asset: 'assets/foods/sesame-sauce.png', color: '#d2a75c', calories: 95, protein: 2, fat: 8, carbs: 4 },
      { name: '和風醬', asset: 'assets/foods/wafu-sauce.png', color: '#cbb176', calories: 45, protein: 1, fat: 2, carbs: 6 },
      { name: '凱薩醬', asset: 'assets/foods/caesar-sauce.png', color: '#eeddb5', calories: 110, protein: 2, fat: 10, carbs: 3 },
      { name: '辣味優格醬', asset: 'assets/foods/spicy-yogurt.png', color: '#f09a63', calories: 70, protein: 4, fat: 3, carbs: 6 }
    ]
  };

  const comparisonFoods = {
    珍珠奶茶: { calories: 650, asset: 'assets/foods/bubble-tea.png' },
    炸雞排: { calories: 700, asset: 'assets/foods/fried-chicken.png' },
    麥當勞套餐: { calories: 1050, asset: 'assets/foods/fast-food-set.png' },
    泡麵: { calories: 520, asset: 'assets/foods/instant-noodles.png' },
    手搖飲: { calories: 420, asset: 'assets/foods/tea-drink.png' },
    超商便當: { calories: 850, asset: 'assets/foods/convenience-bento.png' }
  };

  const dialogueTitle = document.getElementById('mealDialogueTitle');
  const dialogueText = document.getElementById('mealDialogueText');
  const tipText = document.getElementById('mealTipText');
  const stageTitle = document.getElementById('mealStageTitle');
  const stageHint = document.getElementById('mealStageHint');
  const veggieCount = document.getElementById('embeddedVeggieCount');
  const checkoutButton = document.getElementById('mealCheckoutButton');
  const payButton = document.getElementById('mealPayButton');
  const restartButton = document.getElementById('embeddedMealRestart');
  const tongs = document.getElementById('mealTongs');
  const flyLayer = document.getElementById('mealFlyLayer');
  const progressTrack = section.querySelector('.meal-progress-track');
  const boxes = [
    document.getElementById('embeddedMealBox'),
    document.getElementById('checkoutMealBox'),
    document.getElementById('waitingMealBox'),
    document.getElementById('resultEmbeddedMealBox')
  ];

  const state = {
    veggies: [],
    protein: null,
    sauce: null
  };

  function playClickSound() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 520;
    gain.gain.setValueAtTime(0.028, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.075);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.075);
  }

  function selectedItems() {
    return [...state.veggies, state.protein, state.sauce].filter(Boolean);
  }

  function totals() {
    return selectedItems().reduce(
      (sum, item) => ({
        calories: sum.calories + item.calories,
        protein: sum.protein + item.protein,
        fat: sum.fat + item.fat,
        carbs: sum.carbs + item.carbs
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );
  }

  function isComplete() {
    return state.veggies.length === 5 && state.protein && state.sauce;
  }

  function updateDialogue(step) {
    const copy = {
      build: [
        '歡迎光臨變棒棒健康餐！',
        '你知道自己每天吃進多少熱量嗎？先點選食材，做一份你的健康餐盒。',
        '青菜熱量通常不高，但份量和醬料會讓整體差很多。'
      ],
      checkout: [
        '餐盒完成，準備結帳！',
        '結帳前可以觀察一下，主食和醬料通常是熱量變化最大的地方。',
        '有些健康餐看起來清爽，醬料熱量其實也很有存在感。'
      ],
      waiting: [
        '餐盒製作中。',
        '等一下我們會把你的餐盒，拿去跟常見食物做熱量比較。',
        '用比較的方式看熱量，通常比只看數字更有感。'
      ],
      result: [
        '你的熱量比較結果出來了。',
        '這不是要你害怕吃東西，而是讓你更知道自己吃進了什麼。',
        '偶爾吃喜歡的食物也沒關係，重點是看見選擇。'
      ]
    }[step];
    dialogueTitle.textContent = copy[0];
    dialogueText.textContent = copy[1];
    tipText.textContent = copy[2];
  }

  function showScene(name) {
    section.querySelectorAll('[data-meal-scene]').forEach((scene) => {
      scene.classList.toggle('is-hidden', scene.dataset.mealScene !== name);
    });
    updateDialogue(name);
  }

  function renderMealBox(target) {
    if (!target) return;
    target.innerHTML = '<span class="meal-box-label">餐盒 placeholder</span>';
    selectedItems().forEach((item, index) => {
      const piece = document.createElement('span');
      const row = Math.floor(index / 4);
      const col = index % 4;
      piece.className = 'meal-piece';
      piece.textContent = item.name;
      piece.style.setProperty('--piece-color', item.color);
      piece.style.left = `${7 + col * 23 + (row % 2) * 3}%`;
      piece.style.top = `${9 + row * 27}%`;
      piece.style.animationDelay = `${index * 0.025}s`;
      target.appendChild(piece);
    });
  }

  function renderAllBoxes() {
    boxes.forEach(renderMealBox);
  }

  function updateStageText() {
    if (veggieCount) veggieCount.textContent = `${state.veggies.length} / 5`;
    if (checkoutButton) checkoutButton.disabled = !isComplete();

    if (state.veggies.length < 5) {
      stageTitle.textContent = '自己夾一份健康餐';
      stageHint.textContent = `先選 5 樣青菜，還差 ${5 - state.veggies.length} 樣。`;
    } else if (!state.protein) {
      stageTitle.textContent = '選一份主食';
      stageHint.textContent = '青菜夾好了，接著選一份主食。';
    } else if (!state.sauce) {
      stageTitle.textContent = '最後選醬料';
      stageHint.textContent = '醬料也會增加熱量，選一種你今天想吃的。';
    } else {
      stageTitle.textContent = '餐盒完成';
      stageHint.textContent = '可以前往結帳，看看這份餐盒和常見食物差多少。';
    }
  }

  function updateOptionStates() {
    section.querySelectorAll('.meal-option').forEach((button) => {
      const category = button.dataset.category;
      const name = button.dataset.name;
      const selected = category === 'veggies'
        ? state.veggies.some((item) => item.name === name)
        : state[category]?.name === name;
      const locked =
        (category === 'protein' && state.veggies.length < 5) ||
        (category === 'sauce' && !state.protein);
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      button.disabled = category === 'veggies'
        ? state.veggies.length >= 5 && !selected
        : locked;
    });
  }

  function syncBuild() {
    renderAllBoxes();
    updateStageText();
    updateOptionStates();
  }

  function runTongsAnimation(sourceButton) {
    if (!tongs) return;
    const areaRect = section.querySelector('.meal-play-area').getBoundingClientRect();
    const sourceRect = sourceButton.getBoundingClientRect();
    tongs.style.setProperty('--tong-x', `${sourceRect.left - areaRect.left + sourceRect.width / 2}px`);
    tongs.style.setProperty('--tong-y', `${sourceRect.top - areaRect.top + sourceRect.height / 2}px`);
    tongs.classList.remove('is-active');
    void tongs.offsetWidth;
    tongs.classList.add('is-active');
  }

  function runFlyAnimation(sourceButton, item) {
    if (!flyLayer || !boxes[0]) return;
    const areaRect = section.querySelector('.meal-play-area').getBoundingClientRect();
    const sourceRect = sourceButton.getBoundingClientRect();
    const targetRect = boxes[0].getBoundingClientRect();
    const flyItem = document.createElement('span');
    flyItem.className = 'meal-fly-item';
    flyItem.textContent = item.name;
    flyItem.style.setProperty('--piece-color', item.color);
    flyItem.style.setProperty('--from-x', `${sourceRect.left - areaRect.left + sourceRect.width / 2}px`);
    flyItem.style.setProperty('--from-y', `${sourceRect.top - areaRect.top + sourceRect.height / 2}px`);
    flyItem.style.setProperty('--to-x', `${targetRect.left - areaRect.left + targetRect.width / 2}px`);
    flyItem.style.setProperty('--to-y', `${targetRect.top - areaRect.top + targetRect.height / 2}px`);
    flyLayer.appendChild(flyItem);
    flyItem.addEventListener('animationend', () => flyItem.remove(), { once: true });
  }

  function chooseItem(category, item, button) {
    playClickSound();
    button.classList.add('is-pinching');
    window.setTimeout(() => button.classList.remove('is-pinching'), 180);
    runTongsAnimation(button);
    runFlyAnimation(button, item);

    if (category === 'veggies') {
      const existingIndex = state.veggies.findIndex((selected) => selected.name === item.name);
      if (existingIndex >= 0) {
        state.veggies.splice(existingIndex, 1);
      } else if (state.veggies.length < 5) {
        state.veggies.push(item);
      }
    } else {
      state[category] = state[category]?.name === item.name ? null : item;
    }
    window.setTimeout(syncBuild, 180);
  }

  function renderOptions() {
    Object.entries(items).forEach(([category, options]) => {
      const container = section.querySelector(`[data-meal-category="${category}"]`);
      if (!container) return;
      container.innerHTML = '';
      options.forEach((item) => {
        const button = document.createElement('button');
        button.className = 'meal-option';
        button.type = 'button';
        button.dataset.category = category;
        button.dataset.name = item.name;
        button.dataset.assetPath = item.asset;
        button.setAttribute('aria-pressed', 'false');
        button.innerHTML = `<span class="meal-food-art">素材<br />placeholder</span><span>${item.name}</span>`;
        button.addEventListener('click', () => chooseItem(category, item, button));
        container.appendChild(button);
      });
    });
  }

  function renderComparisons(totalCalories) {
    const comparisonTarget = document.getElementById('mealComparisons');
    if (!comparisonTarget) return;
    comparisonTarget.innerHTML = '';
    Object.entries(comparisonFoods).forEach(([name, food]) => {
      const ratio = totalCalories / food.calories;
      const card = document.createElement('div');
      card.className = 'meal-comparison-card';
      card.innerHTML = `
        <span class="meal-comparison-icon" data-asset-path="${food.asset}">icon<br />placeholder</span>
        <p>約為 <b>${name}</b> 的 ${ratio.toFixed(1)} 倍</p>
      `;
      comparisonTarget.appendChild(card);
    });
  }

  function showResult() {
    const total = totals();
    const sauceCalories = state.sauce?.calories || 0;
    const comment = sauceCalories >= 90
      ? '醬料熱量其實比你想像高喔。'
      : total.calories < comparisonFoods.珍珠奶茶.calories
        ? '其實你今天這份，比一杯全糖珍奶還低熱量很多！'
        : '這份餐盒很有飽足感，下一餐可以搭配清爽一點。';

    document.getElementById('embeddedMealCalories').textContent = total.calories;
    document.getElementById('embeddedMealProtein').textContent = `${total.protein}g`;
    document.getElementById('embeddedMealFat').textContent = `${total.fat}g`;
    document.getElementById('embeddedMealCarbs').textContent = `${total.carbs}g`;
    document.getElementById('embeddedMealComment').textContent = comment;
    renderComparisons(total.calories);
    renderAllBoxes();
    showScene('result');
  }

  function resetGame() {
    state.veggies = [];
    state.protein = null;
    state.sauce = null;
    progressTrack?.classList.remove('is-running');
    showScene('build');
    syncBuild();
  }

  renderOptions();
  syncBuild();

  checkoutButton?.addEventListener('click', () => {
    if (!isComplete()) return;
    playClickSound();
    renderAllBoxes();
    showScene('checkout');
  });

  payButton?.addEventListener('click', () => {
    playClickSound();
    showScene('waiting');
    progressTrack?.classList.remove('is-running');
    void progressTrack?.offsetWidth;
    progressTrack?.classList.add('is-running');
    window.setTimeout(showResult, 1350);
  });

  restartButton?.addEventListener('click', resetGame);
}

initHealthyMealSection();

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
