const CHOICE_STORAGE_KEY = 'bodyIdealChoices';
const mockData = [];

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initScrollVideoIntro() {
  const intro = document.querySelector('[data-video-intro]');
  if (!intro) return;

  const progressBar = intro.querySelector('[data-video-progress]');
  const frameLabel = document.getElementById('videoFrameLabel');
  const cues = [...intro.querySelectorAll('[data-video-cue]')];

  function updateIntroProgress() {
    const rect = intro.getBoundingClientRect();
    const scrollable = Math.max(1, intro.offsetHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
    const percent = Math.round(progress * 100);
    const frameNumber = String(Math.min(3, Math.floor(progress * 3) + 1)).padStart(2, '0');
    const activeIndex = Math.min(cues.length - 1, Math.floor(progress * cues.length));

    intro.style.setProperty('--intro-progress', `${percent}%`);
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (frameLabel) frameLabel.textContent = `frame ${frameNumber}`;
    cues.forEach((cue, index) => cue.classList.toggle('is-active', index === activeIndex));
  }

  updateIntroProgress();
  window.addEventListener('scroll', updateIntroProgress, { passive: true });
  window.addEventListener('resize', updateIntroProgress);
}

initScrollVideoIntro();

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

  // Nutrition references for this section:
  // - Mifflin-St Jeor equation estimates BMR from sex, age, height, and weight.
  // - AMDR macronutrient distribution ranges: carbohydrate 45–65%, fat 20–35%, protein 10–35%.
  // - USDA FoodData Central can be used as a reference source for future food nutrition data calibration.
  const basePrice = 120;

  const ingredientData = {
    base: [
      { name: '生菜加白飯', type: 'base', calories: 245, protein: 5, carbs: 51, fat: 1, price: 10, image: 'assets/foods/lettuce-rice-placeholder.png', color: '#d9ddb0' },
      { name: '純生菜', type: 'base', calories: 25, protein: 2, carbs: 5, fat: 0, price: 0, image: 'assets/foods/lettuce-placeholder.png', color: '#b9d88b' },
      { name: '地瓜', type: 'base', calories: 180, protein: 3, carbs: 41, fat: 0, price: 20, image: 'assets/foods/sweet-potato-placeholder.png', color: '#e2a24d' },
      { name: '生菜加紫米飯', type: 'base', calories: 235, protein: 6, carbs: 48, fat: 2, price: 15, image: 'assets/foods/lettuce-purple-rice-placeholder.png', color: '#bca0bc' },
      { name: '白飯', type: 'base', calories: 220, protein: 4, carbs: 46, fat: 1, price: 0, image: 'assets/foods/rice-placeholder.png', color: '#f2eadc' },
      { name: '紫米飯', type: 'base', calories: 210, protein: 5, carbs: 43, fat: 2, price: 10, image: 'assets/foods/purple-rice-placeholder.png', color: '#9d7b9e' }
    ],
    veggies: [
      { name: '花椰菜', type: 'vegetable', calories: 35, protein: 3, carbs: 7, fat: 0, image: 'assets/foods/broccoli-placeholder.png', color: '#8fbf67' },
      { name: '玉米筍', type: 'vegetable', calories: 28, protein: 1, carbs: 6, fat: 0, image: 'assets/foods/baby-corn-placeholder.png', color: '#f0c860' },
      { name: '高麗菜', type: 'vegetable', calories: 30, protein: 2, carbs: 6, fat: 0, image: 'assets/foods/cabbage-placeholder.png', color: '#b8d985' },
      { name: '菠菜', type: 'vegetable', calories: 25, protein: 3, carbs: 4, fat: 0, image: 'assets/foods/spinach-placeholder.png', color: '#75aa61' },
      { name: '杏鮑菇', type: 'vegetable', calories: 36, protein: 2, carbs: 7, fat: 0, image: 'assets/foods/mushroom-placeholder.png', color: '#d7c4a1' },
      { name: '南瓜', type: 'vegetable', calories: 55, protein: 1, carbs: 13, fat: 0, image: 'assets/foods/pumpkin-placeholder.png', color: '#eba24c' },
      { name: '小黃瓜', type: 'vegetable', calories: 18, protein: 1, carbs: 4, fat: 0, image: 'assets/foods/cucumber-placeholder.png', color: '#94cb7b' },
      { name: '胡蘿蔔', type: 'vegetable', calories: 32, protein: 1, carbs: 8, fat: 0, image: 'assets/foods/carrot-placeholder.png', color: '#ee8d43' },
      { name: '紫高麗菜', type: 'vegetable', calories: 30, protein: 1, carbs: 7, fat: 0, image: 'assets/foods/purple-cabbage-placeholder.png', color: '#b895c8' },
      { name: '毛豆', type: 'vegetable', calories: 80, protein: 8, carbs: 7, fat: 3, image: 'assets/foods/edamame-placeholder.png', color: '#8fbd65' }
    ],
    protein: [
      { name: '舒肥雞胸', type: 'protein', calories: 165, protein: 31, carbs: 0, fat: 4, price: 40, image: 'assets/foods/chicken-placeholder.png', color: '#dfbf91' },
      { name: '鮭魚', type: 'protein', calories: 210, protein: 22, carbs: 0, fat: 13, price: 70, image: 'assets/foods/salmon-placeholder.png', color: '#ef9d7a' },
      { name: '牛肉', type: 'protein', calories: 230, protein: 25, carbs: 0, fat: 14, price: 60, image: 'assets/foods/beef-placeholder.png', color: '#c17a5a' },
      { name: '豆腐', type: 'protein', calories: 120, protein: 12, carbs: 4, fat: 7, price: 20, image: 'assets/foods/tofu-placeholder.png', color: '#f2e8d6' },
      { name: '水煮蛋', type: 'protein', calories: 78, protein: 6, carbs: 1, fat: 5, price: 15, image: 'assets/foods/egg-placeholder.png', color: '#f1cf72' }
    ],
    sauce: [
      { name: '胡麻醬', type: 'sauce', calories: 95, protein: 2, carbs: 4, fat: 8, price: 10, image: 'assets/foods/sesame-sauce-placeholder.png', color: '#d2a75c' },
      { name: '和風醬', type: 'sauce', calories: 45, protein: 1, carbs: 6, fat: 2, price: 0, image: 'assets/foods/wafu-sauce-placeholder.png', color: '#cbb176' },
      { name: '凱薩醬', type: 'sauce', calories: 110, protein: 2, carbs: 3, fat: 10, price: 10, image: 'assets/foods/caesar-sauce-placeholder.png', color: '#eeddb5' },
      { name: '辣味優格醬', type: 'sauce', calories: 70, protein: 4, carbs: 6, fat: 3, price: 10, image: 'assets/foods/spicy-yogurt-placeholder.png', color: '#f09a63' }
    ],
    topping: [
      { name: '白芝麻', type: 'topping', calories: 25, protein: 1, carbs: 1, fat: 2, price: 0, image: 'assets/foods/sesame-placeholder.png', color: '#efe0bd' },
      { name: '海苔絲', type: 'topping', calories: 8, protein: 1, carbs: 1, fat: 0, price: 0, image: 'assets/foods/nori-placeholder.png', color: '#56694e' },
      { name: '堅果碎', type: 'topping', calories: 65, protein: 2, carbs: 2, fat: 6, price: 15, image: 'assets/foods/nuts-placeholder.png', color: '#b9854f' },
      { name: '蔥花', type: 'topping', calories: 5, protein: 0, carbs: 1, fat: 0, price: 0, image: 'assets/foods/scallion-placeholder.png', color: '#76a85c' }
    ]
  };

  const comparisonFoods = {
    珍珠奶茶: { calories: 650, unit: '杯', image: 'assets/foods/bubble-tea-placeholder.png' },
    炸雞排: { calories: 700, unit: '份', image: 'assets/foods/fried-chicken-placeholder.png' },
    大麥克漢堡: { calories: 550, unit: '個', image: 'assets/foods/big-mac-placeholder.png' },
    泡麵: { calories: 450, unit: '碗', image: 'assets/foods/instant-noodles-placeholder.png' },
    超商便當: { calories: 850, unit: '份', image: 'assets/foods/convenience-bento-placeholder.png' },
    滷肉飯: { calories: 600, unit: '碗', image: 'assets/foods/braised-pork-rice-placeholder.png' },
    雞肉飯: { calories: 500, unit: '碗', image: 'assets/foods/chicken-rice-placeholder.png' },
    '鍋貼 10 顆': { calories: 650, unit: '份', image: 'assets/foods/dumplings-placeholder.png' }
  };

  const dialogueTitle = document.getElementById('mealDialogueTitle');
  const dialogueText = document.getElementById('mealDialogueText');
  const tipText = document.getElementById('mealTipText');
  const stageTitle = document.getElementById('mealStageTitle');
  const stageHint = document.getElementById('mealStageHint');
  const profileForm = document.getElementById('mealProfileForm');
  const profileError = document.getElementById('mealProfileError');
  const startButton = document.getElementById('mealStartButton');
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
    base: null,
    veggies: [],
    protein: null,
    sauce: null,
    topping: null,
    targets: null
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
    return [state.base, ...state.veggies, state.protein, state.sauce, state.topping].filter(Boolean);
  }

  function totals() {
    return selectedItems().reduce(
      (sum, item) => ({
        calories: sum.calories + item.calories,
        protein: sum.protein + item.protein,
        carbs: sum.carbs + item.carbs,
        fat: sum.fat + item.fat
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }

  function totalPrice() {
    return selectedItems().reduce((sum, item) => sum + (item.price || 0), basePrice);
  }

  function isComplete() {
    return state.base && state.veggies.length === 5 && state.protein && state.sauce && state.topping;
  }

  function calculateTargets(profile) {
    const bmr = profile.sex === 'male'
      ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
      : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
    const mealCalories = (bmr * profile.activity) / 3;
    return {
      calories: { min: Math.round(mealCalories * 0.9), max: Math.round(mealCalories * 1.1), center: Math.round(mealCalories) },
      protein: { min: Math.round((mealCalories * 0.10) / 4), max: Math.round((mealCalories * 0.35) / 4) },
      carbs: { min: Math.round((mealCalories * 0.45) / 4), max: Math.round((mealCalories * 0.65) / 4) },
      fat: { min: Math.round((mealCalories * 0.20) / 9), max: Math.round((mealCalories * 0.35) / 9) }
    };
  }

  function readProfile() {
    const height = Number(document.getElementById('mealHeightInput')?.value);
    const weight = Number(document.getElementById('mealWeightInput')?.value);
    const sex = document.getElementById('mealSexInput')?.value;
    const age = Number(document.getElementById('mealAgeInput')?.value);
    const activity = Number(document.getElementById('mealActivityInput')?.value);
    if (!height || !weight || !sex || !age || !activity || height <= 0 || weight <= 0 || age <= 0) return null;
    return { height, weight, sex, age, activity };
  }

  function getStatus(value, range) {
    if (value < range.min) return '偏低';
    if (value > range.max) return '偏高';
    return '足夠';
  }

  function updateDialogue(step) {
    const copy = {
      profile: [
        '營養師提示',
        '先填入基本資料，我們會估算你這一餐大約需要多少熱量與營養素。',
        '系統會依照 Mifflin-St Jeor 公式估算每日熱量需求，再換算成一餐建議量。營養素比例參考 AMDR：碳水 45–65%、脂肪 20–35%、蛋白質 10–35%。'
      ],
      build: [
        '攝取量提醒',
        '系統會依照 Mifflin-St Jeor 公式估算每日熱量需求，再換算成一餐建議量。',
        '請先選 1 種基底，再選 5 樣青菜、1 份主菜、1 種醬料與 1 種點綴。'
      ],
      checkout: [
        '結帳提醒',
        '結帳前可以先看一下，主菜、基底和醬料通常是熱量與價格變動最大的地方。',
        '價格以基本餐盒加上基底、主菜、醬料與點綴加價估算。'
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
    if (!copy) return;
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

  function keepMealSectionPosition(callback) {
    const frame = section.closest('#frame-12') || section;
    const topBefore = frame.getBoundingClientRect().top;
    callback();
    const topAfter = frame.getBoundingClientRect().top;
    window.scrollBy({ top: topAfter - topBefore, left: 0, behavior: 'auto' });
  }

  function makeSlot(className, label, item) {
    const slot = document.createElement('span');
    slot.className = `meal-piece ${className}${item ? ' is-filled' : ''}`;
    slot.textContent = item ? item.name : label;
    if (item) {
      slot.style.setProperty('--piece-color', item.color);
      slot.dataset.assetPath = item.image;
    }
    return slot;
  }

  function renderMealBox(target) {
    if (!target) return;
    target.innerHTML = '<span class="meal-box-label">圓形碗 placeholder</span>';
    target.appendChild(makeSlot('base-center-slot', 'base-center-slot', state.base));
    for (let index = 0; index < 5; index += 1) {
      target.appendChild(makeSlot(`vegetable-slot-${index + 1}`, `vegetable-slot-${index + 1}`, state.veggies[index]));
    }
    target.appendChild(makeSlot('protein-center-slot', 'protein-center-slot', state.protein));
    target.appendChild(makeSlot('sauce-overlay', 'sauce-overlay', state.sauce));
    target.appendChild(makeSlot('topping-overlay', 'topping-overlay', state.topping));
  }

  function renderAllBoxes() {
    boxes.forEach(renderMealBox);
  }

  function renderCheckoutSummary() {
    const list = document.getElementById('mealCheckoutItems');
    const calories = document.getElementById('mealCheckoutCalories');
    const price = document.getElementById('mealCheckoutPrice');
    const total = totals();
    if (calories) calories.textContent = total.calories;
    if (price) price.textContent = totalPrice();
    if (!list) return;
    const rows = [
      ['基底', state.base?.name || '未選'],
      ['青菜', state.veggies.map((item) => item.name).join('、') || '未選'],
      ['主菜', state.protein?.name || '未選'],
      ['醬料', state.sauce?.name || '未選'],
      ['點綴', state.topping?.name || '未選']
    ];
    list.innerHTML = rows.map(([label, value]) => `<p><span>${label}</span><b>${value}</b></p>`).join('');
  }

  function updateStageText() {
    if (veggieCount) veggieCount.textContent = `${state.veggies.length} / 5`;
    if (checkoutButton) checkoutButton.disabled = !isComplete();

    if (!state.base) {
      stageTitle.textContent = '先選基底／主食';
      stageHint.textContent = '先選 1 種基底，再開始夾青菜。';
    } else if (state.veggies.length < 5) {
      stageTitle.textContent = '自己夾一份健康餐';
      stageHint.textContent = `已選 ${state.base.name}，接著選 5 樣青菜，還差 ${5 - state.veggies.length} 樣。`;
    } else if (!state.protein) {
      stageTitle.textContent = '選一份主菜';
      stageHint.textContent = '青菜夾好了，接著選一份主菜。';
    } else if (!state.sauce) {
      stageTitle.textContent = '選一種醬料';
      stageHint.textContent = '醬料也會增加熱量，選一種你今天想吃的。';
    } else if (!state.topping) {
      stageTitle.textContent = '最後選點綴';
      stageHint.textContent = '撒上一種點綴，就可以前往結帳。';
    } else {
      stageTitle.textContent = '餐盒完成';
      stageHint.textContent = `可以前往結帳，目前暫估 ${totals().calories} kcal，價格 $${totalPrice()}。`;
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
        (category === 'veggies' && !state.base) ||
        (category === 'protein' && (!state.base || state.veggies.length < 5)) ||
        (category === 'sauce' && !state.protein) ||
        (category === 'topping' && !state.sauce);
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      button.disabled = category === 'veggies'
        ? locked || (state.veggies.length >= 5 && !selected)
        : locked;
    });
  }

  function syncBuild() {
    renderAllBoxes();
    updateStageText();
    updateOptionStates();
  }

  function targetSelectorFor(category, item) {
    if (category === 'veggies') {
      const selectedIndex = state.veggies.findIndex((selected) => selected.name === item.name);
      const nextIndex = selectedIndex >= 0 ? selectedIndex : state.veggies.length;
      return `.vegetable-slot-${Math.min(nextIndex + 1, 5)}`;
    }
    if (category === 'base') return '.base-center-slot';
    if (category === 'protein') return '.protein-center-slot';
    if (category === 'sauce') return '.sauce-overlay';
    return '.topping-overlay';
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

  function runFlyAnimation(sourceButton, item, category) {
    if (!flyLayer || !boxes[0]) return;
    const areaRect = section.querySelector('.meal-play-area').getBoundingClientRect();
    const sourceRect = sourceButton.getBoundingClientRect();
    const targetSlot = boxes[0].querySelector(targetSelectorFor(category, item)) || boxes[0];
    const targetRect = targetSlot.getBoundingClientRect();
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
    if (button.disabled) return;
    playClickSound();
    button.classList.add('is-pinching');
    window.setTimeout(() => button.classList.remove('is-pinching'), 180);
    runTongsAnimation(button);
    runFlyAnimation(button, item, category);

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
    Object.entries(ingredientData).forEach(([category, options]) => {
      const container = section.querySelector(`[data-meal-category="${category}"]`);
      if (!container) return;
      container.innerHTML = '';
      options.forEach((item) => {
        const button = document.createElement('button');
        button.className = 'meal-option';
        button.type = 'button';
        button.dataset.category = category;
        button.dataset.name = item.name;
        button.dataset.assetPath = item.image;
        button.setAttribute('aria-pressed', 'false');
        const priceText = item.price ? `<small>+$${item.price}</small>` : '';
        button.innerHTML = `<span class="meal-food-art">icon<br />placeholder</span><span>${item.name}${priceText}</span>`;
        button.addEventListener('click', () => chooseItem(category, item, button));
        container.appendChild(button);
      });
    });
  }

  function renderMacroResults(total) {
    const target = document.getElementById('mealMacroResults');
    if (!target || !state.targets) return;
    const rows = [
      { key: 'protein', label: '蛋白質', unit: 'g', value: total.protein, range: state.targets.protein },
      { key: 'carbs', label: '碳水', unit: 'g', value: total.carbs, range: state.targets.carbs },
      { key: 'fat', label: '脂肪', unit: 'g', value: total.fat, range: state.targets.fat },
      { key: 'calories', label: '總熱量', unit: 'kcal', value: total.calories, range: state.targets.calories }
    ];
    target.innerHTML = '';
    rows.forEach((row) => {
      const rawStatus = getStatus(row.value, row.range);
      const displayStatus = row.key === 'calories' && rawStatus === '足夠' ? '接近' : rawStatus;
      const card = document.createElement('div');
      card.className = `meal-macro-card is-${rawStatus === '足夠' ? 'enough' : rawStatus === '偏低' ? 'low' : 'high'}`;
      card.innerHTML = `
        <span>${row.label}</span>
        <b>${row.value}${row.unit} / 建議 ${row.range.min}–${row.range.max}${row.unit}</b>
        <em>${displayStatus}</em>
      `;
      target.appendChild(card);
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
        <div class="comparison-icon-placeholder" data-asset-path="${food.image}"></div>
        <p>約等於 ${ratio.toFixed(1)} ${food.unit}${name}</p>
      `;
      comparisonTarget.appendChild(card);
    });
  }

  function buildNutritionComment(total) {
    if (!state.targets) return '';
    if (getStatus(total.protein, state.targets.protein) === '偏低') {
      return '這餐蛋白質偏少，可以考慮增加雞胸、豆腐或蛋。';
    }
    if (getStatus(total.carbs, state.targets.carbs) === '偏低') {
      return '這餐碳水偏少，可能比較不耐餓，可以補一點地瓜、白飯或紫米飯。';
    }
    if (getStatus(total.fat, state.targets.fat) === '偏高') {
      return '脂肪偏高，可能是醬料或主菜選擇造成的。';
    }
    if (getStatus(total.calories, state.targets.calories) === '足夠') {
      return '這份餐盒和你的一餐建議量相當接近，是相對均衡的一餐。';
    }
    return '這份餐盒已完成，可以依照上方標籤調整下一餐的份量。';
  }

  function showResult() {
    const total = totals();
    document.getElementById('embeddedMealCalories').textContent = total.calories;
    document.getElementById('embeddedMealPrice').textContent = totalPrice();
    renderMacroResults(total);
    renderComparisons(total.calories);
    document.getElementById('embeddedMealComment').textContent = buildNutritionComment(total);
    renderAllBoxes();
    showScene('result');
  }

  function resetGame() {
    state.base = null;
    state.veggies = [];
    state.protein = null;
    state.sauce = null;
    state.topping = null;
    state.targets = null;
    if (profileError) profileError.textContent = '';
    progressTrack?.classList.remove('is-running');
    showScene('profile');
    syncBuild();
    stageTitle.textContent = '先建立一餐建議量';
    stageHint.textContent = '填寫身高、體重、性別、年齡與活動量，估算你這一餐的建議攝取範圍。';
  }

  renderOptions();
  syncBuild();
  showScene('profile');

  function startBuildFlow(event) {
    event?.preventDefault();
    if (profileForm?.reportValidity && !profileForm.reportValidity()) return;

    const profile = readProfile();
    if (!profile) {
      if (profileError) profileError.textContent = '請輸入有效的基本資料。';
      return;
    }
    if (profileError) profileError.textContent = '';
    startButton?.blur();
    state.targets = calculateTargets(profile);
    playClickSound();
    keepMealSectionPosition(() => {
      showScene('build');
      syncBuild();
    });
  }

  profileForm?.addEventListener('submit', startBuildFlow);
  startButton?.addEventListener('click', startBuildFlow);

  checkoutButton?.addEventListener('click', () => {
    if (!isComplete()) return;
    playClickSound();
    renderAllBoxes();
    renderCheckoutSummary();
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
