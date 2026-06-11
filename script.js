const siteAssetManifest = [
  './pic/B/B_female%3C8%25.png',
  './pic/B/B_female10-14%25.png',
  './pic/B/B_female15-18%25.png',
  './pic/B/B_female20-25%25.png',
  './pic/B/B_female%3E30%25.png',
  './pic/B/B_male%3C8%25.png',
  './pic/B/B_male10-14%25.png',
  './pic/B/B_male15-18%25.png',
  './pic/B/B_male20-25%25.png',
  './pic/B/B_male%3E30%25.png',
  './pic/E/female_1.png',
  './pic/E/female_2.png',
  './pic/E/female_3.png',
  './pic/E/female_4.png',
  './pic/E/male_1.png',
  './pic/E/male_2.png',
  './pic/E/male_3.png',
  './pic/E/male_4.png',
  './pic/health-magnifier/A.png',
  './pic/health-magnifier/B.png',
  './pic/health-magnifier/C.png',
  './pic/health-magnifier/behindA.png',
  './pic/health-magnifier/behindB.png',
  './pic/health-magnifier/behindC.png',
  './pic/product-experience/healthmeal.png',
  './pic/product-experience/gym.png',
  './pic/product-experience/silmshot.png',
  './pic/product-experience/influencerchallenge.png',
  './pic/opening-comic/1.jpg',
  './pic/opening-comic/2.jpg',
  './pic/opening-comic/3.jpg',
  './pic/opening-comic/4.jpg',
  './pic/opening-comic/5.jpg',
  './pic/opening-comic/6.jpg',
  './pic/opening-comic/7.jpg',
  './pic/body-game/card-healthy-meal.png',
  './pic/body-game/card-gym.png',
  './pic/body-game/card-injection.png',
  './pic/body-game/card-influencer-challenge.png'
];

const siteVideoManifest = [
  './video/model-posts/1.m4v',
  './video/model-posts/2.m4v',
  './video/model-posts/3.m4v',
  './video/model-posts/4.m4v',
  './video/model-posts/5.m4v',
  './video/model-posts/6.m4v'
];

function preloadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = src;
    if (image.complete) resolve();
  });
}

function preloadVideo(src) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const finish = () => {
      video.removeAttribute('src');
      video.load();
      resolve();
    };
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.oncanplaythrough = finish;
    video.onloadeddata = finish;
    video.onerror = finish;
    video.src = src;
    video.load();
  });
}

async function initSitePreloader() {
  const preloader = document.querySelector('[data-site-preloader]');
  const progressBar = document.querySelector('[data-preload-progress]');
  const status = document.querySelector('[data-preload-status]');
  if (!preloader) {
    document.documentElement.classList.remove('is-preloading');
    return;
  }

  const pageImages = Array.from(document.querySelectorAll('img[src], video[poster]'))
    .map((element) => element.currentSrc || element.getAttribute('src') || element.getAttribute('poster'))
    .filter(Boolean);
  const imageAssets = [...new Set([...siteAssetManifest, ...pageImages])];
  const videoAssets = [...new Set(siteVideoManifest)];
  const totalAssets = Math.max(1, imageAssets.length + videoAssets.length);
  const startedAt = performance.now();
  let completed = 0;
  const updateProgress = () => {
    const percentage = Math.round((completed / totalAssets) * 100);
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (status) status.textContent = `載入素材 ${percentage}%`;
  };

  const preloadTask = Promise.all(
    [
      ...imageAssets.map((src) => preloadImage(src)),
      ...videoAssets.map((src) => preloadVideo(src))
    ].map((task) =>
      task.finally(() => {
        completed += 1;
        updateProgress();
      })
    )
  );
  await preloadTask;
  await document.fonts?.ready;
  const minimumDisplayTime = Math.max(0, 500 - (performance.now() - startedAt));
  await new Promise((resolve) => window.setTimeout(resolve, minimumDisplayTime));

  if (progressBar) progressBar.style.width = '100%';
  if (status) status.textContent = '準備完成';
  document.documentElement.classList.remove('is-preloading');
  preloader.classList.add('is-complete');
  window.setTimeout(() => preloader.remove(), 500);
}

function initDynamicContentTransitions() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement) || node.classList.contains('site-preloader')) return;
        node.classList.remove('ui-enter');
        void node.offsetWidth;
        node.classList.add('ui-enter');
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initReadingProgress() {
  const progressBar = document.querySelector('[data-reading-progress]');
  if (!progressBar) return;

  let ticking = false;

  function updateReadingProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, scrollTop / scrollable));
    progressBar.style.width = `${Math.round(progress * 1000) / 10}%`;
    ticking = false;
  }

  function requestProgressUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateReadingProgress);
  }

  updateReadingProgress();
  window.addEventListener('scroll', requestProgressUpdate, { passive: true });
  window.addEventListener('resize', requestProgressUpdate);
  window.addEventListener('load', requestProgressUpdate);
}

initReadingProgress();

function initScrollVideoIntro() {
  const intro = document.querySelector('[data-comic-intro]');
  if (!intro) return;

  const hero = intro.querySelector('.opening-comic-hero');
  const stage = intro.querySelector('.opening-comic-stage');
  const progressBar = intro.querySelector('[data-comic-progress]');
  const panels = [...intro.querySelectorAll('[data-comic-panel]')];
  // 調整開場漫畫停留時間：前三張比例較長，方便讀者看清楚畫面內容。
  const panelStops = [0, 0.2, 0.4, 0.6, 0.7, 0.8, 0.9, 1.01];

  function updateIntroProgress() {
    const rect = intro.getBoundingClientRect();
    const scrollable = Math.max(1, intro.offsetHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
    const percent = Math.round(progress * 100);
    const titleExitProgress = Math.min(1, progress / 0.12);
    const panelProgress = Math.min(1, Math.max(0, (progress - 0.18) / 0.82));
    const activeIndex = Math.min(
      panels.length - 1,
      Math.max(0, panelStops.findIndex((stop, index) => panelProgress >= stop && panelProgress < panelStops[index + 1]))
    );

    intro.style.setProperty('--comic-progress', `${percent}%`);
    if (hero) {
      hero.style.opacity = String(1 - titleExitProgress);
      hero.style.filter = `blur(${titleExitProgress * 18}px)`;
      hero.style.transform = `scale(${1 + titleExitProgress * 0.025})`;
      hero.style.pointerEvents = titleExitProgress > 0.95 ? 'none' : '';
    }
    if (stage) {
      stage.style.opacity = String(Math.min(1, panelProgress * 1.6));
      stage.style.transform = `translateY(${Math.max(0, 28 - panelProgress * 28)}px)`;
    }
    if (progressBar) progressBar.style.width = `${percent}%`;
    panels.forEach((panel, index) => panel.classList.toggle('is-active', index === activeIndex));
  }

  updateIntroProgress();
  window.addEventListener('scroll', updateIntroProgress, { passive: true });
  window.addEventListener('resize', updateIntroProgress);
}

initScrollVideoIntro();

const bodyImageBasePath = './pic/B/';

function createBodyImagePath(fileName) {
  return `${bodyImageBasePath}${encodeURIComponent(fileName)}`;
}

const bodyFatImages = [
  {
    id: 'female-under-8',
    label: '理想身材選項',
    src: createBodyImagePath('B_female<8%.png'),
    gender: 'female',
    bodyFatRange: '<8%',
    bodyFatMin: 0,
    bodyFatMax: 8,
    selectionNote: '你選擇的是線條較精瘦、肌肉輪廓較明顯的體態。'
  },
  {
    id: 'female-10-14',
    label: '理想身材選項',
    src: createBodyImagePath('B_female10-14%.png'),
    gender: 'female',
    bodyFatRange: '10–14%',
    bodyFatMin: 10,
    bodyFatMax: 14,
    selectionNote: '你選擇的是整體偏精實、腰腹線條較明顯的體態。'
  },
  {
    id: 'female-15-18',
    label: '理想身材選項',
    src: createBodyImagePath('B_female15-18%.png'),
    gender: 'female',
    bodyFatRange: '15–18%',
    bodyFatMin: 15,
    bodyFatMax: 18,
    selectionNote: '你選擇的是保有部分線條、外觀較自然均衡的體態。'
  },
  {
    id: 'female-20-25',
    label: '理想身材選項',
    src: createBodyImagePath('B_female20-25%.png'),
    gender: 'female',
    bodyFatRange: '20–25%',
    bodyFatMin: 20,
    bodyFatMax: 25,
    selectionNote: '你選擇的是線條較柔和、身形曲線較明顯的體態。'
  },
  {
    id: 'female-over-30',
    label: '理想身材選項',
    src: createBodyImagePath('B_female>30%.png'),
    gender: 'female',
    bodyFatRange: '>30%',
    bodyFatMin: 30,
    bodyFatMax: 100,
    selectionNote: '你選擇的是整體較圓潤、身形曲線較豐滿的體態。'
  },
  {
    id: 'male-under-8',
    label: '理想身材選項',
    src: createBodyImagePath('B_male<8%.png'),
    gender: 'male',
    bodyFatRange: '<8%',
    bodyFatMin: 0,
    bodyFatMax: 8,
    selectionNote: '你選擇的是線條較精瘦、肌肉輪廓較明顯的體態。'
  },
  {
    id: 'male-10-14',
    label: '理想身材選項',
    src: createBodyImagePath('B_male10-14%.png'),
    gender: 'male',
    bodyFatRange: '10–14%',
    bodyFatMin: 10,
    bodyFatMax: 14,
    selectionNote: '你選擇的是整體偏精實、軀幹線條較明顯的體態。'
  },
  {
    id: 'male-15-18',
    label: '理想身材選項',
    src: createBodyImagePath('B_male15-18%.png'),
    gender: 'male',
    bodyFatRange: '15–18%',
    bodyFatMin: 15,
    bodyFatMax: 18,
    selectionNote: '你選擇的是保有部分線條、外觀較自然均衡的體態。'
  },
  {
    id: 'male-20-25',
    label: '理想身材選項',
    src: createBodyImagePath('B_male20-25%.png'),
    gender: 'male',
    bodyFatRange: '20–25%',
    bodyFatMin: 20,
    bodyFatMax: 25,
    selectionNote: '你選擇的是線條較柔和、整體輪廓較厚實的體態。'
  },
  {
    id: 'male-over-30',
    label: '理想身材選項',
    src: createBodyImagePath('B_male>30%.png'),
    gender: 'male',
    bodyFatRange: '>30%',
    bodyFatMin: 30,
    bodyFatMax: 100,
    selectionNote: '你選擇的是整體較圓潤、身形輪廓較豐滿的體態。'
  }
];

const bodyOptions = {
  female: bodyFatImages.filter((image) => image.gender === 'female'),
  male: bodyFatImages.filter((image) => image.gender === 'male')
};

const IdealBodySelector = {
  selectedGender: 'female',
  selectedOptionId: null,
  selectedBodyImage: null,
  percentage: null,
  voteCounts: [],
  statsSource: 'local'
};

const bodyChoiceStorageKeys = {
  hasSubmitted: 'hasSubmittedBodyChoice',
  clientId: 'bodyChoiceClientId',
  submittedChoiceId: 'submittedBodyChoiceId',
  submittedAt: 'bodyChoiceSubmittedAt',
  fallbackStats: 'bodyChoiceStatsFallback'
};

function getBodyChoiceClientId() {
  let clientId = localStorage.getItem(bodyChoiceStorageKeys.clientId);
  if (!clientId) {
    clientId = `body-choice-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(bodyChoiceStorageKeys.clientId, clientId);
  }
  return clientId;
}

function readLocalBodyChoiceStats() {
  try {
    return JSON.parse(localStorage.getItem(bodyChoiceStorageKeys.fallbackStats)) || [];
  } catch {
    return [];
  }
}

function writeLocalBodyChoiceStat(choice) {
  const clientId = getBodyChoiceClientId();
  const stats = readLocalBodyChoiceStats().filter((item) => item.clientId !== clientId);
  const record = {
    clientId,
    choiceId: choice.id,
    bodyFatRange: choice.bodyFatRange,
    bodyFatMin: choice.bodyFatMin,
    bodyFatMax: choice.bodyFatMax,
    gender: choice.gender,
    updatedAt: Date.now()
  };

  stats.push(record);
  localStorage.setItem(bodyChoiceStorageKeys.fallbackStats, JSON.stringify(stats));
  localStorage.setItem(bodyChoiceStorageKeys.hasSubmitted, 'true');
  localStorage.setItem(bodyChoiceStorageKeys.submittedChoiceId, choice.id);
  localStorage.setItem(bodyChoiceStorageKeys.submittedAt, String(record.updatedAt));
  return stats;
}

function calculateBodyChoiceStats(stats, selectedBodyImage) {
  if (!selectedBodyImage || stats.length === 0) {
    return {
      totalCount: stats.length,
      sameRangeCount: 0,
      percentage: 0
    };
  }

  const sameRangeCount = stats.filter((item) => item.bodyFatRange === selectedBodyImage.bodyFatRange).length;
  return {
    totalCount: stats.length,
    sameRangeCount,
    percentage: Math.round((sameRangeCount / stats.length) * 100)
  };
}

function updateBodyChoiceResult() {
  const choiceResult = document.getElementById('choiceResult');
  const workspace = document.querySelector('[data-body-choice-workspace]');
  if (!choiceResult) return;

  if (!IdealBodySelector.selectedBodyImage) {
    workspace?.classList.remove('has-selection');
    choiceResult.textContent = '請先選擇一張圖片';
    return;
  }

  workspace?.classList.add('has-selection');
  const stats = calculateBodyChoiceStats(IdealBodySelector.voteCounts, IdealBodySelector.selectedBodyImage);
  IdealBodySelector.percentage = stats.percentage;
  const minimumSharedSampleSize = 5;
  const hasSharedStats = IdealBodySelector.statsSource === 'firebase';
  const hasEnoughSharedStats = hasSharedStats && stats.totalCount >= minimumSharedSampleSize;

  if (!hasEnoughSharedStats) {
    const statsMessage = hasSharedStats
      ? `目前共有 ${stats.totalCount} 位使用者完成選擇，樣本尚未達 ${minimumSharedSampleSize} 筆，因此暫不顯示比例。`
      : 'Firebase 尚未連線，目前只有本機暫存選擇，因此暫不顯示百分比。';
    choiceResult.innerHTML = `
      <article class="body-choice-stat-card">
        <p class="body-choice-selected">你選擇了這個體態</p>
        <p>${IdealBodySelector.selectedBodyImage.selectionNote}</p>
        <p>你選擇的體態大約落在 ${IdealBodySelector.selectedBodyImage.bodyFatRange} 體脂區間。</p>
        <div class="body-choice-stat-main">
          <strong>資料不足</strong>
          <span>連線共用統計後再進行比較</span>
        </div>
        <p>${statsMessage}</p>
        ${hasSharedStats ? '' : '<p class="body-choice-local-note">目前僅顯示本機暫存資料。</p>'}
      </article>
    `;
    return;
  }

  choiceResult.innerHTML = `
    <article class="body-choice-stat-card">
      <p class="body-choice-selected">你選擇了這個體態</p>
      <p>${IdealBodySelector.selectedBodyImage.selectionNote}</p>
      <p>你選擇的體態大約落在 ${IdealBodySelector.selectedBodyImage.bodyFatRange} 體脂區間。</p>
      <div class="body-choice-stat-main">
        <strong>${stats.percentage}%</strong>
        <span>選擇相同區間</span>
      </div>
      <div class="body-choice-progress" aria-label="選擇相同體脂區間比例">
        <span style="width: ${stats.percentage}%"></span>
      </div>
      <p class="body-choice-stat-count">${stats.sameRangeCount} / ${stats.totalCount} 人選擇這個體脂區間</p>
      <p>目前共有 ${stats.totalCount} 位使用者完成選擇。其中有 ${stats.sameRangeCount} 位使用者也選擇了 ${IdealBodySelector.selectedBodyImage.bodyFatRange} 體脂區間，約佔所有選擇的 ${stats.percentage}%。</p>
      <p>這個比例只代表目前收集到的選擇分布，不代表健康程度或最佳體態。</p>
    </article>
  `;
}

function renderBodyOptions() {
  const optionGrid = document.getElementById('bodyOptionGrid');
  if (!optionGrid) return;

  optionGrid.innerHTML = '';
  const visibleOptions = IdealBodySelector.selectedBodyImage
    ? [IdealBodySelector.selectedBodyImage]
    : bodyOptions[IdealBodySelector.selectedGender];

  visibleOptions.forEach((option) => {
    const button = document.createElement('button');
    button.className = 'body-option-card';
    button.type = 'button';
    button.dataset.optionId = option.id;
    button.classList.toggle('active', option.id === IdealBodySelector.selectedOptionId);
    button.innerHTML = `
      <span class="body-option-image">
        <img src="${option.src}" alt="${option.label}" loading="lazy" />
      </span>
    `;
    optionGrid.appendChild(button);
  });
}

async function initIdealBodySelector() {
  const optionGrid = document.getElementById('bodyOptionGrid');
  const choiceResult = document.getElementById('choiceResult');
  if (!optionGrid) return;

  let firebase;
  try {
    firebase = await import('./src/firebase.js?v=20260606-1');
  } catch {
    console.warn('Firebase config missing, skip saving.');
    firebase = {
      isFirebaseReady: () => false,
      addBodyShapeVote: async () => {
        console.warn('Firebase config missing, skip saving.');
      },
      listenBodyShapeVotes: (onVotesChange) => {
        onVotesChange([]);
        return () => {};
      },
      saveBodyChoiceStat: async () => {
        console.warn('Firebase config missing, skip saving.');
      },
      listenBodyChoiceStats: (onStatsChange) => {
        onStatsChange(readLocalBodyChoiceStats());
        return () => {};
      }
    };
    renderBodyOptions();
  }

  const genderButtons = document.querySelectorAll('.body-gender-button');

  function setGender(gender) {
    IdealBodySelector.selectedGender = gender;
    IdealBodySelector.selectedOptionId = null;
    IdealBodySelector.selectedBodyImage = null;
    genderButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.gender === gender);
    });
    renderBodyOptions();
    updateBodyChoiceResult();
  }

  genderButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const gender = button.dataset.gender;
      if (!gender || gender === IdealBodySelector.selectedGender) return;
      setGender(gender);
    });
  });

  optionGrid.addEventListener('click', async (event) => {
    const card = event.target.closest('.body-option-card');
    if (!card) return;

    IdealBodySelector.selectedOptionId = card.dataset.optionId;
    IdealBodySelector.selectedBodyImage = bodyFatImages.find((image) => image.id === IdealBodySelector.selectedOptionId) || null;
    renderBodyOptions();
    updateBodyChoiceResult();

    if (!IdealBodySelector.selectedBodyImage) return;

    const localStats = writeLocalBodyChoiceStat(IdealBodySelector.selectedBodyImage);
    IdealBodySelector.voteCounts = localStats;
    IdealBodySelector.statsSource = 'local';
    updateBodyChoiceResult();

    try {
      if (firebase.isFirebaseReady()) {
        await firebase.saveBodyChoiceStat({
          clientId: getBodyChoiceClientId(),
          choiceId: IdealBodySelector.selectedBodyImage.id,
          bodyFatRange: IdealBodySelector.selectedBodyImage.bodyFatRange,
          bodyFatMin: IdealBodySelector.selectedBodyImage.bodyFatMin,
          bodyFatMax: IdealBodySelector.selectedBodyImage.bodyFatMax,
          gender: IdealBodySelector.selectedBodyImage.gender
        });
        IdealBodySelector.statsSource = 'firebase';
      }
    } catch {
      console.warn('Firebase config missing, skip saving.');
      IdealBodySelector.statsSource = 'local';
      IdealBodySelector.voteCounts = readLocalBodyChoiceStats();
      updateBodyChoiceResult();
    }
  });

  firebase.listenBodyChoiceStats(
    (stats) => {
      IdealBodySelector.statsSource = firebase.isFirebaseReady() ? 'firebase' : 'local';
      IdealBodySelector.voteCounts = stats.length ? stats : readLocalBodyChoiceStats();
      updateBodyChoiceResult();
    },
    () => {
      console.warn('Firebase config missing, skip saving.');
      IdealBodySelector.statsSource = 'local';
      IdealBodySelector.voteCounts = readLocalBodyChoiceStats();
      updateBodyChoiceResult();
    }
  );

  renderBodyOptions();
}

initIdealBodySelector();

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

function initBodyMangaScroll() {
  const section = document.querySelector('[data-manga-scroll], #body-manga-scroll');
  if (!section) return;

  const panels = Array.from(section.querySelectorAll('[data-manga-panel]'));
  const videoOrbit = section.querySelector('[data-video-orbit]');
  const typingSearchFields = Array.from(section.querySelectorAll('[data-typing-search]'));

  const videoCards = [
    { type: 'video', src: './video/body-feed/weightloss.m4v', title: '減脂訓練' },
    { type: 'video', src: './video/body-feed/butttraining.m4v', title: '臀腿訓練' },
    { type: 'video', src: './video/body-feed/healthyfood.m4v', title: '健康飲食' },
    { type: 'video', src: './video/body-feed/chesttraining.m4v', title: '胸部訓練' },
    { type: 'video', src: './video/body-feed/moremusle.m4v', title: '增肌訓練' }
  ];

  const searchTerms = [
    '7天內瘦5公斤',
    '如何減大腿肉',
    '體脂怎麼降最快',
    '女生如何練腹肌',
    '瘦手臂最快方法',
    '不吃晚餐會瘦嗎',
    '如何改善梨形身材',
    '短時間變瘦方法',
    '男生胸肌怎麼練',
    '怎麼讓肩膀變寬',
    '怎麼瘦小腹',
    '一個月可以瘦幾公斤',
    '早餐不吃會變瘦嗎',
    '低碳飲食有效嗎',
    '每天量體重正常嗎',
    'BMI正常但看起來胖',
    '體脂多少才算好看',
    '怎麼練出腰線',
    '如何消除副乳',
    '小腿肌怎麼消',
    '增肌一定要喝乳清嗎',
    '吃健康餐真的會瘦嗎',
    '每天運動多久才會瘦',
    '怎麼避免復胖',
    '體重沒變但看起來變胖',
    '如何快速增加肌肉',
    '瘦瘦針效果多久',
    '網紅減脂菜單可以照吃嗎',
    '晚上幾點後不能吃東西',
    '怎麼停止和別人比較身材'
  ];

  if (videoOrbit) {
    videoOrbit.innerHTML = videoCards.map((card) => `
      <article class="video-card" data-video-src="${card.src}">
        <video
          class="video-card-media"
          src="${card.src}"
          aria-label="${card.title}"
          muted
          loop
          autoplay
          playsinline
          preload="metadata"
        ></video>
        <span class="video-card-title">${card.title}</span>
      </article>
    `).join('');
  }

  if ('IntersectionObserver' in window) {
    const mangaObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const videos = entry.target.querySelectorAll('.video-card-media');
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          videos.forEach((video) => video.play().catch(() => {}));
        } else {
          entry.target.classList.remove('is-visible');
          videos.forEach((video) => video.pause());
        }
      });
    }, { threshold: 0.22 });

    panels.forEach((panel) => mangaObserver.observe(panel));
  } else {
    panels.forEach((panel) => panel.classList.add('is-visible'));
  }

  if (typingSearchFields.length) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

    typingSearchFields.forEach((field, fieldIndex) => {
      const assignedTerms = searchTerms.filter((_, termIndex) => termIndex % typingSearchFields.length === fieldIndex);
      if (prefersReducedMotion) {
        field.textContent = assignedTerms[0];
        return;
      }

      const runTypingLoop = async () => {
        let termIndex = 0;
        await wait(fieldIndex * 320);
        while (document.documentElement.contains(field)) {
          const term = assignedTerms[termIndex % assignedTerms.length];
          for (let characterIndex = 1; characterIndex <= term.length; characterIndex += 1) {
            field.textContent = term.slice(0, characterIndex);
            await wait(75 + fieldIndex * 4);
          }
          await wait(1150 + fieldIndex * 130);
          for (let characterIndex = term.length - 1; characterIndex >= 0; characterIndex -= 1) {
            field.textContent = term.slice(0, characterIndex);
            await wait(34);
          }
          await wait(280);
          termIndex += 1;
        }
      };

      runTypingLoop();
    });
  }
}

class HealthMagnifierChallenge {
  constructor(root) {
    this.root = root;
    this.selectedPerson = null;
    this.people = [
      {
        id: 'outdoor-student',
        name: '戶外活動型學生',
        image: './pic/health-magnifier/A.png',
        behindImage: './pic/health-magnifier/behindA.png',
        visual: '襯衫與休閒長褲，外表斯文，看不出明顯運動習慣',
        impression: '外表偏瘦、穿著日常，看起來不像經常運動的人',
        facts: [
          ['睡眠', '大多維持約 7 小時'],
          ['活動', '週末健行，平日步行移動'],
          ['恢復', '會依疲勞程度調整行程'],
          ['飲食', '三餐規律，不刻意極端限制'],
          ['心理狀態', '重視體能感受多於外觀']
        ],
        conclusion: '外表看不出肌肉線條，也可能擁有穩定而充足的日常活動。'
      },
      {
        id: 'high-intensity-student',
        name: '高強度健身型學生',
        image: './pic/health-magnifier/B.png',
        behindImage: './pic/health-magnifier/behindB.png',
        visual: '貼身運動上衣與短褲，肌肉線條明顯',
        impression: '體態精實、肌肉明顯，看起來非常自律',
        facts: [
          ['睡眠', '經常只有 4–5 小時'],
          ['運動', '頻繁安排高強度訓練'],
          ['恢復', '疲累時仍擔心中斷進度'],
          ['飲食', '長期嚴格控制份量'],
          ['心理狀態', '害怕體態與表現退步']
        ],
        conclusion: '看起來最強壯的人，也可能正在承受恢復不足與維持體態的壓力。'
      },
      {
        id: 'steady-training-student',
        name: '規律重訓型學生',
        image: './pic/health-magnifier/C.png',
        behindImage: './pic/health-magnifier/behindC.png',
        visual: '寬鬆帽 T 與長褲，穿著看不出身體線條',
        impression: '日常穿搭寬鬆，外表看不出固定重訓習慣',
        facts: [
          ['睡眠', '平均維持 6–7 小時'],
          ['運動', '每週規律重訓 2–3 次'],
          ['恢復', '訓練日之間安排休息'],
          ['飲食', '維持日常飲食與基本份量'],
          ['心理狀態', '重視力量進步，不追求快速改變']
        ],
        conclusion: '寬鬆衣著遮住了訓練痕跡，也提醒我們無法只靠外表理解一個人的生活。'
      }
    ];
  }

  personVisual(person, revealLife = false) {
    const image = revealLife ? person.behindImage : person.image;
    return `
      <div class="health-person-visual ${revealLife ? 'is-life-revealed' : ''}">
        <img
          src="${image}"
          alt="${revealLife ? `${person.name}的生活狀態` : `${person.name}人物圖`}"
          onerror="this.hidden=true;this.parentElement.classList.add('is-placeholder')"
        />
        <span class="health-person-silhouette" aria-hidden="true"></span>
        <small>圖片預留位置</small>
      </div>
    `;
  }

  selectionCards() {
    return this.people.map((person, index) => `
      <button class="health-person-card" type="button" data-select-health-person="${person.id}" style="--card-order:${index}">
        ${this.personVisual(person)}
        <div class="health-person-card-copy">
          <p>角色 ${String.fromCharCode(65 + index)}</p>
          <h3>${person.name}</h3>
          <span>${person.visual}</span>
        </div>
      </button>
    `).join('');
  }

  storyText() {
    return `
      <article class="health-magnifier-story">
        <p>長期面臨體型過瘦的 Sam（化名），一直都被增肌所困擾。對他而言，理想中的身材不需要非常壯碩，只需要擁有適量的肌肉線條，能夠支撐起衣服的版型，展現出好看的體態即可。</p>
        <p>Sam 主要透過抖音及小紅書建立增肌相關的知識，從中學習健身訓練動作與飲食攝取建議。然而，增肌的過程並不比減重簡單。他坦言，自己食量並不小，也有努力健身，但效果卻沒有預想中明顯。</p>
        <p>隨著增肌逐漸成為生活的一部分，Sam 每個月生活支出也隨之增加，其中包括健身房會費與乳清蛋白粉。在飲食質與量的雙重要求下，日常開銷的提高幾乎無法避免。</p>
        <p>面對社群媒體對「男性應擁有肌肉身材」的標準，Sam 認為每個人都能追求自己想要的理想身材；但他也坦言，社群審美確實在無形中提高了他對自身體態的要求。</p>
        <p class="health-magnifier-final-note">健康不一定只用體態來判斷，請勿將體態作為唯一判斷標準，進而影響心理健康。</p>
      </article>
    `;
  }

  renderSelection() {
    return `
      <div class="health-magnifier-inner health-magnifier-step">
        <header class="health-magnifier-heading">
          <p>健康放大鏡挑戰</p>
          <h2>誰看起來最健康？</h2>
          <span>如果只能看外表，你會選哪一位？</span>
          <small>
            體態與健康確實存在關係。但當對體態的在意逐漸變成壓力，
            影響睡眠、飲食、情緒與生活，追求健康的過程也可能反過來消耗健康。
          </small>
        </header>
        <div class="health-person-grid">${this.selectionCards()}</div>
        <p class="health-magnifier-caption">直接點選一位角色，用放大鏡看看外表背後的生活狀態。</p>
        ${this.storyText()}
      </div>
    `;
  }

  renderMagnifier() {
    const person = this.people.find((item) => item.id === this.selectedPerson);
    return `
      <div class="health-magnifier-inner health-magnifier-step">
        <header class="health-magnifier-heading health-magnifier-heading-compact">
          <p>你選擇了「${person?.name || ''}」</p>
          <h2>你看到的，真的是健康的全部嗎？</h2>
          <span>把滑鼠移到圖片上，放大鏡範圍會顯示外表背後的生活狀態。</span>
        </header>
        <section class="health-magnifier-viewer">
          <div class="health-magnifier-stage" data-health-lens-stage>
            <img class="health-magnifier-front" src="${person?.image || ''}" alt="${person?.name || ''}人物外觀" />
            <img class="health-magnifier-behind" src="${person?.behindImage || ''}" alt="${person?.name || ''}生活狀態" />
            <span class="health-magnifier-lens" aria-hidden="true"></span>
          </div>
          <article class="health-magnifier-detail" aria-live="polite">
            <header>
              <span class="health-magnifier-icon" aria-hidden="true"></span>
              <div>
                <p>健康放大鏡看到</p>
                <h3>${person?.name || ''}</h3>
              </div>
            </header>
            <div class="health-magnifier-facts">
              ${(person?.facts || []).map(([label, value]) => `
                <div>
                  <span>${label}</span>
                  <b>${value}</b>
                </div>
              `).join('')}
            </div>
            <p class="health-magnifier-conclusion">${person?.conclusion || ''}</p>
          </article>
        </section>
        ${this.storyText()}
      </div>
    `;
  }

  render() {
    this.root.classList.remove('is-ready');
    this.root.innerHTML = this.selectedPerson ? this.renderMagnifier() : this.renderSelection();
    window.requestAnimationFrame(() => this.root.classList.add('is-ready'));
  }

  handleClick(event) {
    const selectButton = event.target.closest('[data-select-health-person]');
    if (selectButton) {
      this.selectedPerson = selectButton.dataset.selectHealthPerson;
      this.render();
    }
  }

  handlePointerMove(event) {
    const stage = event.target.closest('[data-health-lens-stage]');
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    stage.style.setProperty('--lens-x', `${Math.max(0, Math.min(100, x))}%`);
    stage.style.setProperty('--lens-y', `${Math.max(0, Math.min(100, y))}%`);
    stage.classList.add('is-lens-active');
  }

  handlePointerLeave(event) {
    const stage = event.target.closest('[data-health-lens-stage]');
    if (stage) stage.classList.remove('is-lens-active');
  }

  mount() {
    this.root.addEventListener('click', (event) => this.handleClick(event));
    this.root.addEventListener('pointermove', (event) => this.handlePointerMove(event));
    this.root.addEventListener('pointerleave', (event) => this.handlePointerLeave(event), true);
    this.render();
  }
}

function initHealthMagnifierChallenge() {
  const root = document.querySelector('[data-health-magnifier-challenge]');
  if (!root) return;
  window.healthMagnifierChallenge = new HealthMagnifierChallenge(root);
  window.healthMagnifierChallenge.mount();
}

class BodyManagementExperienceHub {
  constructor(root) {
    this.root = root;
    this.activeMethod = null;
    this.selectedChoice = null;
    this.completedMethods = [];
    this.lastFocusedElement = null;
    this.mealStep = 'base';
    this.mealBowl = {
      base: null,
      protein: null,
      veggies: [],
      sauce: null
    };
    this.mealOptions = {
      base: [
        { name: '紫米飯', icon: '🍚', image: './pic/poke-ingredients/1-1.png', price: 25, kcal: 210, protein: 5, carb: 43, fat: 2, color: '#8d6a96' },
        { name: '地瓜', icon: '🍠', image: './pic/poke-ingredients/1-2.png', price: 25, kcal: 165, protein: 2, carb: 38, fat: 0, color: '#e69b43' },
        { name: '生菜', icon: '🥬', image: './pic/poke-ingredients/1-3.png', price: 0, kcal: 35, protein: 2, carb: 7, fat: 0, color: '#91bd64' },
        { name: '生菜飯各半', icon: '🥗', image: './pic/poke-ingredients/1-4.png', price: 15, kcal: 125, protein: 4, carb: 25, fat: 1, color: '#b9c879' }
      ],
      protein: [
        { name: '蝦仁', icon: '🦐', image: './pic/poke-ingredients/2-1.png', price: 70, kcal: 120, protein: 24, carb: 1, fat: 2, color: '#f39a7a' },
        { name: '鮭魚', icon: '🍣', image: './pic/poke-ingredients/2-2.png', price: 95, kcal: 235, protein: 25, carb: 0, fat: 15, color: '#ee8f73' },
        { name: '雞胸肉', icon: '🍗', image: './pic/poke-ingredients/2-3.png', price: 65, kcal: 165, protein: 31, carb: 0, fat: 4, color: '#dfb887' },
        { name: '鮪魚', icon: '🐟', image: './pic/poke-ingredients/2-4.png', price: 80, kcal: 150, protein: 30, carb: 0, fat: 3, color: '#b95d61' },
        { name: '牛肉', icon: '🥩', image: './pic/poke-ingredients/2-5.png', price: 85, kcal: 230, protein: 25, carb: 0, fat: 14, color: '#bd7358' }
      ],
      veggies: [
        { name: '玉米筍', icon: '🌽', image: './pic/poke-ingredients/3-1.png', price: 15, kcal: 28, protein: 1, carb: 6, fat: 0, color: '#f2cc67' },
        { name: '豆腐', icon: '◻️', image: './pic/poke-ingredients/3-2.png', price: 20, kcal: 95, protein: 10, carb: 3, fat: 5, color: '#f0e6d8' },
        { name: '番茄', icon: '🍅', image: './pic/poke-ingredients/3-3.png', price: 15, kcal: 22, protein: 1, carb: 5, fat: 0, color: '#de5f4a' },
        { name: '小黃瓜', icon: '🥒', image: './pic/poke-ingredients/3-4.png', price: 15, kcal: 18, protein: 1, carb: 4, fat: 0, color: '#82b96f' },
        { name: '馬鈴薯沙拉', icon: '🥔', image: './pic/poke-ingredients/3-5.png', price: 25, kcal: 130, protein: 2, carb: 18, fat: 6, color: '#e2c57b' },
        { name: '洋蔥', icon: '🧅', image: './pic/poke-ingredients/3-6.png', price: 10, kcal: 20, protein: 1, carb: 5, fat: 0, color: '#d9b7d2' },
        { name: '甜椒', icon: '🫑', image: './pic/poke-ingredients/3-7.png', price: 15, kcal: 20, protein: 1, carb: 5, fat: 0, color: '#e48248' },
        { name: '毛豆', icon: '🫘', image: './pic/poke-ingredients/3-8.png', price: 25, kcal: 95, protein: 9, carb: 8, fat: 4, color: '#8abd63' },
        { name: '海藻沙拉', icon: '🌿', image: './pic/poke-ingredients/3-9.png', price: 20, kcal: 35, protein: 1, carb: 7, fat: 1, color: '#4f8e69' },
        { name: '鳳梨', icon: '🍍', image: './pic/poke-ingredients/3-10.png', price: 20, kcal: 50, protein: 1, carb: 13, fat: 0, color: '#eec85a' },
        { name: '蘋果', icon: '🍎', image: './pic/poke-ingredients/3-11.png', price: 20, kcal: 48, protein: 0, carb: 13, fat: 0, color: '#d95555' },
        { name: '玉米', icon: '🌽', image: './pic/poke-ingredients/3-12.png', price: 15, kcal: 70, protein: 2, carb: 16, fat: 1, color: '#f1c64f' },
        { name: '海帶', icon: '🟩', image: './pic/poke-ingredients/3-13.png', price: 15, kcal: 25, protein: 1, carb: 5, fat: 0, color: '#416d59' },
        { name: '秋葵', icon: '🌱', image: './pic/poke-ingredients/3-14.png', price: 15, kcal: 30, protein: 2, carb: 6, fat: 0, color: '#6da356' },
        { name: '泡菜', icon: '🥬', image: './pic/poke-ingredients/3-15.png', price: 20, kcal: 35, protein: 2, carb: 7, fat: 0, color: '#d65d43' },
        { name: '花椰菜', icon: '🥦', image: './pic/poke-ingredients/3-16.png', price: 20, kcal: 35, protein: 3, carb: 7, fat: 0, color: '#79b35c' },
        { name: '杏鮑菇', icon: '🍄', image: './pic/poke-ingredients/3-17.png', price: 20, kcal: 36, protein: 2, carb: 7, fat: 0, color: '#d6bd92' }
      ],
      sauce: [
        { name: '辣美乃滋', icon: '🌶️', image: './pic/poke-ingredients/4-1.png', price: 15, kcal: 115, protein: 0, carb: 3, fat: 11, color: '#e27a55' },
        { name: '胡麻醬', icon: '🥜', image: './pic/poke-ingredients/4-2.png', price: 15, kcal: 95, protein: 2, carb: 4, fat: 8, color: '#cfa35d' },
        { name: '油醋醬', icon: '🫒', image: './pic/poke-ingredients/4-3.png', price: 10, kcal: 70, protein: 0, carb: 2, fat: 7, color: '#a8a85a' },
        { name: '優格醬', icon: '🥛', image: './pic/poke-ingredients/4-4.png', price: 15, kcal: 60, protein: 3, carb: 5, fat: 3, color: '#efe6d7' },
        { name: '柚香甜醬油', icon: '🍊', image: './pic/poke-ingredients/4-5.png', price: 10, kcal: 45, protein: 1, carb: 10, fat: 0, color: '#d7a35f' },
        { name: '墨西哥辣醬', icon: '🔥', image: './pic/poke-ingredients/4-6.png', price: 10, kcal: 35, protein: 1, carb: 7, fat: 0, color: '#ce5748' }
      ]
    };
    this.methods = [
      {
        id: 'meal',
        title: '夏威夷碗',
        image: './pic/product-experience/healthmeal.png',
        description: '用夾取食材的方式，看看看似健康的一碗是否符合自己的需求。',
        cost: '每餐約 NT$190－330',
        prompt: '今天中午，你會怎麼選？',
        choices: ['仔細搭配營養與份量', '先看價格再決定', '選最像社群健康餐的組合'],
        result: '同一份「健康餐」，可能同時牽涉營養需求、預算與外表想像。'
      },
      {
        id: 'gym',
        title: '演算法把我送進健身房',
        image: './pic/product-experience/gym.png',
        description: '會員費之外，時間、疲勞與社交安排也會影響能否持續。',
        cost: '每月約 NT$1,000－1,800',
        prompt: '忙碌的一天結束後，你會怎麼做？',
        choices: ['照原訂計畫去健身', '改成短時間活動', '今天休息，明天再安排'],
        result: '健身的成本不只在月費，也包含時間、恢復與持續執行的壓力。'
      },
      {
        id: 'influencer',
        title: '爆紅之後',
        image: './pic/product-experience/influencerchallenge.png',
        description: '看似簡單的挑戰，可能改變飢餓、情緒與看待自己的方式。',
        cost: '看似低成本',
        prompt: '看到「七天快速改變」貼文時，你會？',
        choices: ['完全照著挑戰執行', '先查資料再調整', '收藏但不立刻開始'],
        result: '低金錢門檻不代表沒有代價，焦慮、飢餓與反覆失控也值得被計入。'
      },
      {
        id: 'injection',
        title: '施打瘦瘦針',
        image: './pic/product-experience/silmshot.png',
        description: '快速改變的期待，也伴隨費用、身體反應與醫療評估。',
        cost: '每月約 NT$6,000－15,000',
        prompt: '面對快速見效的資訊，你第一步會？',
        choices: ['先尋求合格醫療評估', '詢問使用過的朋友', '只比較價格與效果'],
        result: '涉及藥物的體態管理，需要把身體狀況、風險與專業評估放在效果之前。'
      }
    ];
    this.resetGymGame();
    this.resetInfluencerGame();
    this.resetInjectionGame();
  }

  cards() {
    return this.methods.map((method, index) => `
      <article class="body-experience-card" style="--experience-order:${index}">
        <div class="body-experience-card-image">
          <img src="${method.image}" alt="${method.title}體驗封面" />
          ${this.completedMethods.includes(method.id) ? '<span>已體驗</span>' : ''}
        </div>
        <div class="body-experience-card-copy">
          <p>0${index + 1}</p>
          <h3>${method.title}</h3>
          <span>${method.description}</span>
          <small>${method.cost}</small>
          <button type="button" data-open-body-experience="${method.id}">開始體驗</button>
        </div>
      </article>
    `).join('');
  }

  mealProfile() {
    try {
      return JSON.parse(localStorage.getItem('bodyHealthProfile')) || null;
    } catch {
      return null;
    }
  }

  mealItems() {
    return [this.mealBowl.base, this.mealBowl.protein, ...this.mealBowl.veggies, this.mealBowl.sauce].filter(Boolean);
  }

  mealTotals() {
    return this.mealItems().reduce(
      (total, item) => ({
        price: total.price + item.price,
        kcal: total.kcal + item.kcal,
        protein: total.protein + item.protein,
        carb: total.carb + item.carb,
        fat: total.fat + item.fat
      }),
      { price: 160, kcal: 0, protein: 0, carb: 0, fat: 0 }
    );
  }

  mealTargets() {
    const profile = this.mealProfile();
    if (!profile) return { kcal: 650, protein: 25, carb: 70, veggie: 3 };
    const genderOffset = profile.gender === 'male' ? 5 : profile.gender === 'female' ? -161 : -80;
    const activity = { low: 1.2, medium: 1.375, high: 1.55 }[profile.activityLevel] || 1.2;
    const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + genderOffset;
    const mealKcal = Math.round((bmr * activity) / 3);
    return {
      kcal: mealKcal,
      protein: Math.round((profile.weight * 1.2) / 3),
      carb: Math.round(profile.weight),
      veggie: 3
    };
  }

  mealJudgement() {
    const totals = this.mealTotals();
    const targets = this.mealTargets();
    const kcalStatus = totals.kcal < targets.kcal * 0.8 ? '偏低' : totals.kcal > targets.kcal * 1.2 ? '偏高' : '接近';
    const proteinStatus = totals.protein < targets.protein * 0.8 ? '不足' : '足夠';
    const carbStatus = totals.carb < targets.carb * 0.7 ? '不足' : totals.carb > targets.carb * 1.3 ? '偏高' : '接近';
    const veggieStatus = this.mealBowl.veggies.length >= targets.veggie ? '足夠' : '不足';
    return { totals, targets, kcalStatus, proteinStatus, carbStatus, veggieStatus };
  }

  mealStepConfig() {
    return {
      base: { order: 1, title: '澱粉', category: 'base', hint: '選 1 種' },
      protein: { order: 2, title: '主食', category: 'protein', hint: '選 1 種' },
      veggies: { order: 3, title: '蔬菜', category: 'veggies', hint: '選 3 到 5 種' },
      sauce: { order: 4, title: '醬料', category: 'sauce', hint: '選 1 種' }
    };
  }

  canFinishMeal() {
    return Boolean(this.mealBowl.base)
      && Boolean(this.mealBowl.protein)
      && this.mealBowl.veggies.length >= 3
      && Boolean(this.mealBowl.sauce);
  }

  mealIcon(item) {
    if (!item) return '';
    return item.image
      ? `<img class="body-poke-food-img" src="${item.image}" alt="${item.name}" loading="lazy" />`
      : item.icon;
  }

  mealBowlMarkup(isResult = false) {
    const veggies = this.mealBowl.veggies.map((item, index) => `
      <span class="body-poke-piece body-poke-veggie piece-${index + 1}" style="--piece-color:${item.color}" title="${item.name}">${this.mealIcon(item)}</span>
    `).join('');
    return `
      <div class="body-poke-bowl ${isResult ? 'is-result' : ''}">
        <div class="body-poke-base" style="--piece-color:${this.mealBowl.base?.color || '#f5e8ce'}">
          ${this.mealBowl.base ? `<span>${this.mealIcon(this.mealBowl.base)}</span><small>${this.mealBowl.base.name}</small>` : '<small>空碗</small>'}
        </div>
        ${veggies}
        ${this.mealBowl.protein ? `<span class="body-poke-piece body-poke-protein" style="--piece-color:${this.mealBowl.protein.color}" title="${this.mealBowl.protein.name}">${this.mealIcon(this.mealBowl.protein)}</span>` : ''}
        ${this.mealBowl.sauce ? `<span class="body-poke-sauce" style="--piece-color:${this.mealBowl.sauce.color}">${this.mealIcon(this.mealBowl.sauce)} <span>${this.mealBowl.sauce.name}</span></span>` : ''}
      </div>
    `;
  }

  mealOptionButtons(category) {
    return this.mealOptions[category].map((item) => {
      const selected = category === 'veggies'
        ? this.mealBowl.veggies.some((selectedItem) => selectedItem.name === item.name)
        : this.mealBowl[category]?.name === item.name;
      const disabled = category === 'veggies' && this.mealBowl.veggies.length >= 5 && !selected;
      return `
        <button class="${selected ? 'is-selected' : ''}" type="button" data-body-meal-option="${category}" data-body-meal-name="${item.name}" ${disabled ? 'disabled' : ''}>
          <span style="--piece-color:${item.color}">${this.mealIcon(item)}</span>
          <b>${item.name}</b>
          <small>${item.kcal} kcal / +${item.price} 元</small>
        </button>
      `;
    }).join('');
  }

  mealGameContent() {
    if (this.mealStep === 'result') return this.mealResultContent();
    const steps = this.mealStepConfig();
    const selectedCount = [
      this.mealBowl.base,
      this.mealBowl.protein,
      ...this.mealBowl.veggies,
      this.mealBowl.sauce
    ].filter(Boolean).length;
    return `
      <div class="body-poke-game">
        <div class="body-poke-layout">
          ${this.mealBowlMarkup(false)}
          <section class="body-poke-options">
            <h3>直接把食材夾進碗裡</h3>
            <p>點選食材會立即放進碗裡；選完澱粉、主食、3 到 5 種蔬菜與醬料後，再生成結果。</p>
            ${Object.values(steps).map((step) => `
              <div class="body-poke-option-section">
                <div>
                  <b>${step.title}</b>
                  <span>${step.hint}</span>
                </div>
                <div class="body-poke-option-grid">${this.mealOptionButtons(step.category)}</div>
              </div>
            `).join('')}
          </section>
        </div>
        <div class="body-poke-summary">
          <span>已放入 ${selectedCount} 項</span>
          <span>${this.canFinishMeal() ? '可以生成結果' : '選完後再計算營養與價格'}</span>
        </div>
        <div class="body-experience-modal-actions">
          <button type="button" data-body-meal-restart>重新夾一碗</button>
          <button type="button" data-body-meal-next ${this.canFinishMeal() ? '' : 'disabled'}>生成結果</button>
        </div>
      </div>
    `;
  }

  mealResultContent() {
    const { totals, targets, kcalStatus, proteinStatus, carbStatus, veggieStatus } = this.mealJudgement();
    const monthly = totals.price * 22;
    const rows = [
      ['熱量', `${totals.kcal} kcal`, `建議 ${targets.kcal} kcal`, kcalStatus],
      ['蛋白質', `${totals.protein} g`, `建議 ${targets.protein} g 以上`, proteinStatus],
      ['碳水', `${totals.carb} g`, `建議約 ${targets.carb} g`, carbStatus],
      ['蔬菜', `${this.mealBowl.veggies.length} 種`, `建議至少 ${targets.veggie} 種`, veggieStatus]
    ];
    return `
      <div class="body-poke-result">
        ${this.mealBowlMarkup(true)}
        <section>
          <h3>你的夏威夷碗完成了</h3>
          <p>這碗約 NT$${totals.price}、${totals.kcal} kcal。若 22 個上課／上班日都吃，約 NT$${monthly}。</p>
          <div class="body-poke-result-grid">
            ${rows.map(([label, value, target, status]) => `
              <article>
                <span>${label}</span>
                <b>${value}</b>
                <small>${target}</small>
                <em>${status}</em>
              </article>
            `).join('')}
          </div>
          <p>營養與價格皆為估算，之後可再用你生成的正式食材圖片與更精準資料替換。</p>
          <div class="body-experience-modal-actions">
            <button type="button" data-body-meal-restart>重新夾一碗</button>
            <button type="button" data-body-meal-finish>完成體驗</button>
          </div>
        </section>
      </div>
    `;
  }

  clampStat(value) {
    return Math.max(0, Math.min(100, value));
  }

  formatMoney(value) {
    return `NT$${Math.abs(value).toLocaleString('zh-TW')}`;
  }

  statBars(stats) {
    return `
      <div class="body-sim-stats">
        ${stats.map((stat) => {
          const isMoney = stat.type === 'money';
          const raw = isMoney ? Math.min(100, Math.abs(stat.value) / (stat.max || 300)) : this.clampStat(stat.value);
          return `
            <div class="body-sim-stat">
              <span>${stat.label}</span>
              <b>${isMoney ? this.formatMoney(stat.value) : stat.value}</b>
              <i><em style="width:${raw}%"></em></i>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  choiceButtons(choices, action) {
    return `
      <div class="body-sim-choice-grid">
        ${choices.map((choice, index) => `
          <button type="button" data-body-sim-action="${action}" data-body-sim-choice="${index}">
            <b>${choice.label}</b>
            ${choice.hint ? `<small>${choice.hint}</small>` : ''}
          </button>
        `).join('')}
      </div>
    `;
  }

  // 之後若要改三個互動遊戲的核心提示文字，可以先改這裡。
  simTradeoffText() {
    return {
      gym: 'Trade-off：健康期待、金錢支出、自信與焦慮會互相拉扯。',
      influencer: 'Trade-off：流量、生活、信任與真實感不會同時滿分。',
      injection: 'Trade-off：短期變化、預算、身體反應與長期維持成本會一起出現。'
    }[this.activeMethod] || '';
  }

  phoneFrame(title, subtitle, body, stats, message = '') {
    const slotLabel = this.activeMethod === 'gym' ? '健身房背景預留' : '照片預留';
    const slotNote = this.activeMethod === 'gym'
      ? '之後可放健身房環境照，讓玩家知道自己正在進入哪一種消費場景。'
      : '之後可放對應的情境照片，不會影響目前互動流程。';
    return `
      <div class="body-sim-game">
        <div class="body-sim-wide">
          <aside class="body-sim-photo-slot ${this.activeMethod === 'gym' ? 'is-gym-bg' : ''}" aria-label="${slotLabel}">
            <b>${slotLabel}</b>
            <span>${slotNote}</span>
          </aside>
          <div class="body-sim-phone">
            <div class="body-sim-tradeoff">${this.simTradeoffText()}</div>
            <header>
              <span>${subtitle}</span>
              <h3>${title}</h3>
            </header>
            ${body}
            ${message ? `<p class="body-sim-message">${message}</p>` : ''}
          </div>
        </div>
        ${this.statBars(stats)}
      </div>
    `;
  }

  resetGymGame() {
    this.gymGame = {
      phase: 'feed',
      feedIndex: 0,
      homeStep: 0,
      salesStep: 0,
      gymVisitCount: 0,
      anxiety: 20,
      money: 0,
      energy: 100,
      confidence: 80,
      signedContract: false,
      selectedItems: [],
      lastMessage: ''
    };
  }

  gymStats() {
    const g = this.gymGame;
    return [
      { label: '焦慮值', value: g.anxiety },
      { label: '累積花費', value: g.money, type: 'money', max: 26000 },
      { label: '精力', value: g.energy },
      { label: '自信', value: g.confidence }
    ];
  }

  gymGameContent() {
    const g = this.gymGame;
    const feed = ['朋友聚餐', '貓咪影片', '旅遊照片', '日常生活', '7天瘦3公斤', '健身網紅的一天', '高蛋白飲食', '體脂率挑戰', '練出馬甲線', '健身房體驗課'];
    const salesLines = [
      '你這樣自己練很難有效果。',
      '如果沒有教練，其實很容易受傷。',
      '你如果真的想改變，兩年約比較划算。',
      '預算不夠的話，可能要先想清楚自己有多想改變。'
    ];
    if (g.phase === 'feed') {
      const visible = feed.slice(Math.max(0, g.feedIndex - 2), g.feedIndex + 4);
      return this.phoneFrame('演算法把我送進健身房', '滑手機 Feed', `
        <p class="body-sim-copy">你以為你只是想變健康，其實你正在被推進一套消費系統。</p>
        <div class="body-sim-feed">${visible.map((item, index) => `<article class="${index === visible.length - 1 ? 'is-hot' : ''}">${item}</article>`).join('')}</div>
        <div class="body-sim-scroll-zone" data-body-gym-scroll tabindex="0">
          <b>往下滑手機</b>
          <span>在這個區域滑動，演算法會繼續推內容給你。</span>
        </div>
      `, this.gymStats(), g.lastMessage);
    }
    if (g.phase === 'home') {
      const tasks = [
        { title: 'Day 1', text: '你打開手機運動影片。', choices: ['跟著影片運動 20 分鐘', '先收藏影片明天做'] },
        { title: 'Day 3', text: '下課後，你看到瑜珈墊還攤在房間。', choices: ['下課後運動', '太累了，先休息'] },
        { title: 'Day 5', text: '朋友約你聚餐，但今天原本排了訓練。', choices: ['拒絕朋友聚餐去運動', '去聚餐，明天再補'] }
      ][g.homeStep];
      return this.phoneFrame('在家運動挑戰', tasks.title, `
        <div class="body-sim-room">🧘‍♀️<span>房間 / 瑜珈墊 / 手機運動影片</span></div>
        <p class="body-sim-copy">${tasks.text}</p>
        ${this.choiceButtons(tasks.choices.map((label) => ({ label })), 'gym-home')}
      `, this.gymStats(), g.lastMessage);
    }
    if (g.phase === 'flyer') {
      return this.phoneFrame('樓下健身房傳單', '免費體驗', `
        <div class="body-sim-flyer">
          <b>首月 299</b><span>專人指導</span><span>快速達成目標</span>
        </div>
        ${this.choiceButtons([{ label: '只是看看' }, { label: '預約免費體驗' }], 'gym-flyer')}
      `, this.gymStats(), g.lastMessage);
    }
    if (g.phase === 'sales') {
      if (g.salesStep < salesLines.length) {
        return this.phoneFrame('推銷壓力互動', '合約桌', `
          <div class="body-sim-contract">
            <span>基本月費：1288 / 月</span><span>兩年合約：綁約 24 個月</span><span>教練課：2400 / 堂</span>
            <span>體組成分析：免費但會被解讀</span><span>飲食計畫：1800 / 月</span><span>補充品：2500</span>
          </div>
          <article class="body-sim-sales-line">${salesLines[g.salesStep]}</article>
          <button class="body-sim-primary" type="button" data-body-gym-sales>繼續聽</button>
        `, this.gymStats(), g.lastMessage);
      }
      return this.phoneFrame('你要怎麼回應？', '諮詢結尾', `
        ${this.choiceButtons([
          { label: '只買月費', hint: '+1288' },
          { label: '加購教練課', hint: '+四堂課' },
          { label: '加購完整方案', hint: '+飲食與補充品' },
          { label: '離開', hint: '不簽約' }
        ], 'gym-contract')}
      `, this.gymStats(), g.lastMessage);
    }
    if (g.phase === 'visit') {
      return this.phoneFrame('健身房內部', `第 ${g.gymVisitCount + 1} 次選擇`, `
        <div class="body-sim-zone-grid">
          ${['跑步機', '重訓區', '鏡子', '自拍區', '教練區'].map((label, index) => `
            <button type="button" data-body-sim-action="gym-zone" data-body-sim-choice="${index}">${['🏃', '🏋️', '🪞', '📱', '🧑‍🏫'][index]}<span>${label}</span></button>
          `).join('')}
        </div>
      `, this.gymStats(), g.lastMessage);
    }
    return this.phoneFrame('你原本只是想變健康。', '結局', `
      <div class="body-sim-result-list">
        <p>累積花費：${this.formatMoney(g.money)}</p>
        <p>焦慮值：${g.anxiety}</p>
        <p>精力值：${g.energy}</p>
        <p>自信值：${g.confidence}</p>
        <p>已選擇項目：${g.selectedItems.length ? g.selectedItems.join('、') : '沒有簽約'}</p>
      </div>
      <p class="body-sim-copy">這個遊戲不是在否定健身，而是在呈現：當健康被包裝成消費承諾時，普通人可能會承擔看不見的時間、金錢與心理成本。</p>
      <div class="body-sim-actions"><button type="button" data-body-gym-reset>重新體驗</button><button type="button" data-body-sim-scroll>回到健身房區塊開頭</button></div>
    `, this.gymStats(), g.lastMessage);
  }

  handleGymAction(action, choiceIndex = 0) {
    const g = this.gymGame;
    if (action === 'feed') {
      g.feedIndex += 1;
      g.anxiety += 8;
      g.confidence -= 5;
      g.lastMessage = '滑到越多健身內容，你越覺得自己是不是也該開始改變。';
      if (g.feedIndex > 6) g.phase = 'home';
    }
    if (action === 'home') {
      const didExercise = choiceIndex === 0;
      g.energy += didExercise ? -20 : 5;
      g.anxiety += didExercise ? -5 : 8;
      g.confidence += didExercise ? 5 : -5;
      g.lastMessage = didExercise ? '你完成了訓練，但精力也被消耗。' : '你休息了一下，卻又開始覺得自己不夠努力。';
      g.homeStep += 1;
      if (g.homeStep >= 3) g.phase = 'flyer';
    }
    if (action === 'flyer') {
      g.lastMessage = choiceIndex === 0 ? '你只是想了解一下，但櫃台說今天剛好有優惠。' : '你以為只是體驗，但諮詢從體脂分析開始。';
      g.phase = 'sales';
    }
    if (action === 'sales') {
      g.salesStep += 1;
      g.anxiety += 10;
      g.confidence -= 8;
    }
    if (action === 'contract') {
      const plans = [
        { money: 1288, anxiety: 10, confidence: -5, items: ['基本月費'], msg: '你只買月費，但仍開始擔心自己會不會浪費這筆錢。' },
        { money: 1288 + 2400 * 4, anxiety: 20, confidence: -10, items: ['基本月費', '教練課四堂'], msg: '你買下教練課，也買下了每週都要證明自己有進步的壓力。' },
        { money: 1288 + 2400 * 8 + 1800 + 2500, anxiety: 35, confidence: -20, items: ['基本月費', '教練課八堂', '飲食計畫', '補充品'], msg: '完整方案看起來最有保障，也讓花費和壓力一起變大。' },
        { money: 0, anxiety: 15, confidence: -15, items: [], msg: '你沒有花錢，但開始懷疑是不是自己不夠努力。' }
      ][choiceIndex];
      g.money += plans.money;
      g.anxiety += plans.anxiety;
      g.confidence += plans.confidence;
      g.selectedItems = plans.items;
      g.signedContract = choiceIndex !== 3;
      g.lastMessage = plans.msg;
      g.phase = 'visit';
    }
    if (action === 'zone') {
      const zones = [
        { confidence: -8, anxiety: 8, money: 0, msg: '旁邊的人跑得比你快。' },
        { confidence: -10, anxiety: 12, money: 0, msg: '你不知道器材怎麼調，後面有人在等。' },
        { confidence: -12, anxiety: 15, money: 0, msg: '你開始反覆檢查自己的身形。' },
        { confidence: -10, anxiety: 10, money: 0, msg: '你看到別人拍出漂亮的健身成果照。' },
        { confidence: 0, anxiety: 10, money: 2400, msg: '教練提醒你，如果沒有持續上課，很難看到成果。' }
      ][choiceIndex];
      g.confidence += zones.confidence;
      g.anxiety += zones.anxiety;
      g.money += zones.money;
      g.lastMessage = zones.msg;
      g.gymVisitCount += 1;
      if (g.gymVisitCount >= 3) g.phase = 'result';
    }
    g.anxiety = this.clampStat(g.anxiety);
    g.energy = this.clampStat(g.energy);
    g.confidence = this.clampStat(g.confidence);
    this.isUpdatingSim = true;
    this.render();
  }

  resetInfluencerGame() {
    this.influencerGame = {
      phase: 'post',
      postSelected: '',
      eventIndex: 0,
      traffic: 20,
      bodyImage: 60,
      life: 70,
      stress: 20,
      trust: 70,
      authenticity: 70,
      money: 0,
      lastMessage: '',
      selectedChoices: []
    };
  }

  influencerStats() {
    const s = this.influencerGame;
    return [
      { label: '流量', value: s.traffic },
      { label: '體態', value: s.bodyImage },
      { label: '生活', value: s.life },
      { label: '心理壓力', value: s.stress },
      { label: '信任感', value: s.trust },
      { label: '真實感', value: s.authenticity },
      { label: '金錢', value: s.money, type: 'money', max: 5000 }
    ];
  }

  influencerEnding() {
    const s = this.influencerGame;
    if (s.traffic >= 80 && s.stress >= 60) return ['你維持住了流量，但失去生活。', '你看起來越來越成功，但每天都在擔心身材、觀看數和下一支影片。'];
    if (s.traffic < 60 && s.life >= 70) return ['你沒有成為大網紅，但生活回來了。', '你失去了一部分關注，但重新拿回時間、睡眠和朋友關係。'];
    if (s.trust >= 75 && s.traffic >= 50) return ['你選擇慢慢經營。', '你沒有最快爆紅，但你的內容比較接近真實生活，也比較能長期維持。'];
    if (s.money > 0 && s.trust < 60) return ['你把焦慮變成了商品。', '你的帳戶開始賺錢，但你也開始懷疑：自己是在分享健康，還是在販賣不安？'];
    return ['你還在交換不同代價。', '你沒有明確失敗，也沒有完全成功。你只是發現，維持一個健身人設比想像中更耗費生活。'];
  }

  influencerGameContent() {
    const s = this.influencerGame;
    if (s.phase === 'post') {
      return this.phoneFrame('爆紅之後', '普通大學生', `
        <p class="body-sim-copy">你原本只是想紀錄自己開始運動，沒有想過這支影片會被這麼多人看到。</p>
        ${this.choiceButtons(['今天第一次去健身房', '七天體態變化', '學生也能做到的自律生活', '我如何開始控制飲食'].map((label) => ({ label })), 'influencer-post')}
      `, this.influencerStats(), s.lastMessage);
    }
    if (s.phase === 'event') {
      const events = [
        {
          title: '同學約吃宵夜',
          sub: '爆紅後的第一週',
          body: '<div class="body-sim-notifications"><span>求飲食菜單</span><span>可以分享訓練課表嗎</span><span>你是不是瘦很多？</span><span>拜託更新 Day 8</span><span>你以前比較胖欸</span></div>',
          choices: [{ label: '去吃' }, { label: '拒絕' }]
        },
        {
          title: '今晚要不要拍片？',
          sub: '演算法開始要求你更新',
          body: '<p class="body-sim-copy">你今天有期中報告，但昨天影片觀看數很好。留言開始問你什麼時候更新。</p>',
          choices: [{ label: '熬夜剪片' }, { label: '先做報告' }]
        },
        {
          title: '接不接業配？',
          sub: '品牌私訊',
          body: '<div class="body-sim-dm">我們想找你合作一款代餐／燃脂產品／健身課程。</div>',
          choices: [{ label: '接代餐合作' }, { label: '拒絕合作' }, { label: '接合作但誠實標註限制' }]
        },
        {
          title: '你今天狀態很差',
          sub: '人設壓力',
          body: '<p class="body-sim-copy">但粉絲期待你更新「自律的一天」。</p>',
          choices: [{ label: '照樣拍完美版本' }, { label: '拍真實版本' }, { label: '不更新' }]
        }
      ][s.eventIndex];
      return this.phoneFrame(events.title, events.sub, `${events.body}${this.choiceButtons(events.choices, 'influencer-event')}`, this.influencerStats(), s.lastMessage);
    }
    const [title, text] = this.influencerEnding();
    return this.phoneFrame(title, '結局', `
      <p class="body-sim-copy">${text}</p>
      <div class="body-sim-result-list">
        ${['流量', '體態', '生活', '心理壓力', '信任感', '真實感'].map((label, index) => `<p>${label}：${[s.traffic, s.bodyImage, s.life, s.stress, s.trust, s.authenticity][index]}</p>`).join('')}
        <p>金錢：${this.formatMoney(s.money)}</p>
        <p>選擇紀錄：${s.selectedChoices.join('、') || '尚無'}</p>
      </div>
      <p class="body-sim-copy">這個遊戲不是在否定健身內容創作者，而是在呈現：當自律、體態與健康被放進流量系統裡，創作者也可能被迫在生活、信任、金錢與心理壓力之間交換。</p>
      <div class="body-sim-actions"><button type="button" data-body-influencer-reset>重新體驗</button><button type="button" data-body-sim-scroll>回到網紅挑戰區塊開頭</button></div>
    `, this.influencerStats(), s.lastMessage);
  }

  handleInfluencerAction(action, choiceIndex = 0) {
    const s = this.influencerGame;
    if (action === 'post') {
      const posts = ['今天第一次去健身房', '七天體態變化', '學生也能做到的自律生活', '我如何開始控制飲食'];
      s.postSelected = posts[choiceIndex];
      s.traffic += 50;
      s.stress += 15;
      s.bodyImage += 20;
      s.lastMessage = '這支影片意外爆紅。觀看數不是結束，而是下一支影片的壓力。';
      s.selectedChoices.push(s.postSelected);
      s.phase = 'event';
    } else {
      const changes = [
        [
          { life: 20, stress: -5, bodyImage: -10, traffic: -5, msg: '你很開心，但隔天拍攝時開始在意自己的臉是不是腫了。', label: '去吃宵夜' },
          { bodyImage: 10, traffic: 5, life: -15, stress: 10, msg: '你維持住了計畫，但朋友說你最近變得很難約。', label: '拒絕宵夜' }
        ],
        [
          { traffic: 25, life: -20, stress: 15, bodyImage: -5, msg: '影片成績很好，但你隔天上課幾乎睡著。', label: '熬夜剪片' },
          { life: 20, stress: -5, traffic: -15, msg: '你完成了該做的事，但留言開始問你是不是放棄了。', label: '先做報告' }
        ],
        [
          { traffic: 20, money: 3000, stress: 20, trust: -15, msg: '你賺到了錢，但開始擔心自己是不是在推一個你也沒完全相信的東西。', label: '接代餐合作' },
          { trust: 15, stress: -5, traffic: -10, msg: '你保留了界線，但也錯過第一次變現的機會。', label: '拒絕合作' },
          { money: 1500, trust: 5, traffic: 5, stress: 10, msg: '你試著負責任地溝通，但品牌覺得文案不夠有銷售力。', label: '誠實標註合作限制' }
        ],
        [
          { traffic: 20, bodyImage: 5, stress: 25, authenticity: -20, msg: '畫面很好看，但你知道這不是你今天真正的生活。', label: '拍完美版本' },
          { authenticity: 20, traffic: -10, stress: -10, msg: '有人說你很真實，也有人說你變懶了。', label: '拍真實版本' },
          { stress: -5, life: 10, traffic: -20, msg: '你休息了一天，但演算法沒有等你。', label: '不更新' }
        ]
      ][s.eventIndex][choiceIndex];
      Object.entries(changes).forEach(([key, value]) => {
        if (['msg', 'label'].includes(key)) return;
        s[key] += value;
      });
      s.lastMessage = changes.msg;
      s.selectedChoices.push(changes.label);
      s.eventIndex += 1;
      if (s.eventIndex >= 4) s.phase = 'result';
    }
    ['traffic', 'bodyImage', 'life', 'stress', 'trust', 'authenticity'].forEach((key) => { s[key] = this.clampStat(s[key]); });
    this.isUpdatingSim = true;
    this.render();
  }

  resetInjectionGame() {
    this.injectionGame = {
      phase: 'choice',
      money: 12000,
      bodyExpectation: 45,
      anxiety: 25,
      satisfaction: 45,
      sideEffect: 10,
      energy: 75,
      socialLife: 65,
      maintenance: 40,
      reboundRisk: 30,
      routinePressure: 20,
      lastMessage: ''
    };
  }

  injectionStats() {
    const s = this.injectionGame;
    return [
      { label: '預算', value: s.money, type: 'money', max: 12000 },
      { label: '外表期待', value: s.bodyExpectation },
      { label: '焦慮', value: s.anxiety },
      { label: '滿意度', value: s.satisfaction },
      { label: '副作用', value: s.sideEffect },
      { label: '精力', value: s.energy },
      { label: '社交', value: s.socialLife },
      { label: '維持能力', value: s.maintenance },
      { label: '復胖風險', value: s.reboundRisk },
      { label: '維持壓力', value: s.routinePressure }
    ];
  }

  injectionEnding() {
    const s = this.injectionGame;
    if (s.money < 1000) return ['你變瘦了一點，但生活被預算壓縮。', '療程讓你看見變化，也讓你開始取消購物、聚餐和其他日常支出。真正困難的不是開始，而是每個月都要重新計算自己還能不能負擔。'];
    if (s.sideEffect >= 45 || s.energy <= 35) return ['身體變化比想像中更複雜。', '你期待的是體態改變，但真正影響每天生活的，是頭暈、疲憊、食慾下降和不確定感。體重下降不代表生活品質一定上升。'];
    if (s.socialLife <= 45) return ['你省下了熱量，也錯過了一些生活。', '你不是不想和朋友見面，而是每一次吃飯、聚餐、出門，都開始和療程、食慾、預算與復胖焦慮綁在一起。'];
    if (s.reboundRisk >= 60) return ['停止之後，焦慮沒有停止。', '你原本以為療程結束就能鬆一口氣，但真正困難的是後續維持。當飲食、運動和作息沒有一起改變，復胖風險又變成新的壓力來源。'];
    if (s.maintenance >= 65 && s.routinePressure >= 50) return ['你維持住了變化，但付出新的時間成本。', '你不只是花錢打針，也開始花時間備餐、運動、安排作息。體態變化留下來了，但生活被新的維持規則重新分配。'];
    if (s.satisfaction >= 65 && s.sideEffect < 35 && s.reboundRisk < 60) return ['你把決定權慢慢拿回來。', '你沒有把療程當成唯一答案，而是開始觀察身體、預算與生活能不能承受。這不代表問題消失，而是你不再只用體重判斷自己。'];
    return ['你還在計算這一針值不值得。', '變瘦、花錢、副作用、社交缺席、復胖風險與外表期待混在一起。這不是單一選擇，而是一串持續發生的生活取捨。'];
  }

  injectionGameContent() {
    const s = this.injectionGame;
    if (s.phase === 'choice') {
      return this.phoneFrame('施打瘦瘦針', '醫療與生活取捨', `
        <p class="body-sim-copy">短期變化不是故事的結尾。停止或減少療程後，仍然需要飲食、運動與生活習慣維持。</p>
        ${this.choiceButtons([{ label: '先做醫療評估' }, { label: '比較價格與效果' }, { label: '問朋友經驗' }], 'injection-start')}
      `, this.injectionStats(), s.lastMessage);
    }
    if (s.phase === 'week4') {
      return this.phoneFrame('第四週，成果與維持壓力', '體重紀錄 / 留言 / 預算表', `
        <div class="body-sim-notifications"><span>你是不是瘦了？</span><span>效果也太明顯</span><span>停掉之後會不會復胖？</span><span>再瘦一點應該更好看</span></div>
        <p class="body-sim-copy">你開始看到一些變化，但新的問題也出現了：如果不繼續花錢、控制飲食、安排運動，這些變化可能很難維持。</p>
        ${this.choiceButtons([
          { label: '繼續下一個月療程' },
          { label: '停止療程，改成自己安排飲食和運動' },
          { label: '停止療程，也不特別維持' },
          { label: '把錢改拿去買衣服和正常吃飯' }
        ], 'injection-week4')}
      `, this.injectionStats(), s.lastMessage);
    }
    if (s.phase === 'maintain') {
      return this.phoneFrame('停下來之後', '一個月後的日常行事曆', `
        <div class="body-sim-calendar"><span>早八</span><span>打工</span><span>小組報告</span><span>朋友聚餐</span><span>運動</span><span>備餐</span><span>睡覺</span></div>
        <p class="body-sim-copy">療程不是故事的最後一頁。停止或減少療程後，你還是要決定怎麼維持。</p>
        ${this.choiceButtons([
          { label: '每週安排三次運動＋簡單備餐' },
          { label: '只靠少吃，不運動' },
          { label: '恢復原本生活節奏' },
          { label: '回診詢問如何調整後續計畫' }
        ], 'injection-maintain')}
      `, this.injectionStats(), s.lastMessage);
    }
    const [title, text] = this.injectionEnding();
    return this.phoneFrame(title, '結局', `
      <p class="body-sim-copy">${text}</p>
      <div class="body-sim-result-list">
        <p>維持能力：${s.maintenance}</p><p>復胖風險：${s.reboundRisk}</p><p>維持壓力：${s.routinePressure}</p>
        <p>預算：${this.formatMoney(s.money)}</p><p>副作用：${s.sideEffect}</p><p>社交：${s.socialLife}</p>
      </div>
      <p class="body-sim-copy">這個遊戲不是在鼓勵或否定任何療程，而是在呈現：當減重被包裝成快速改變時，大學生可能同時承擔金錢壓力、身體反應、社交缺席、復胖焦慮與長期維持成本。</p>
      <div class="body-sim-actions"><button type="button" data-body-injection-reset>重新體驗</button><button type="button" data-body-sim-scroll>回到瘦瘦針區塊開頭</button></div>
    `, this.injectionStats(), s.lastMessage);
  }

  handleInjectionAction(action, choiceIndex = 0) {
    const s = this.injectionGame;
    if (action === 'start') {
      s.money -= choiceIndex === 0 ? 500 : 0;
      s.anxiety += choiceIndex === 1 ? 10 : 3;
      s.lastMessage = choiceIndex === 0 ? '你先把問題帶回醫療評估，而不是只靠網路經驗。' : '你開始比較效果，但也更在意自己是不是該快點改變。';
      s.phase = 'week4';
    }
    if (action === 'week4') {
      const changes = [
        { money: -6500, bodyExpectation: 15, anxiety: 15, satisfaction: 3, reboundRisk: -10, routinePressure: 10, msg: '你暫時降低了復胖焦慮，但下個月的預算更緊。你發現維持變瘦，也是一筆持續支出。' },
        { maintenance: 20, reboundRisk: -5, routinePressure: 20, energy: -10, satisfaction: 5, anxiety: 8, msg: '你沒有繼續花療程費，但開始發現維持體重需要備餐、運動、規律作息。省下錢，不代表省下時間。' },
        { satisfaction: 10, routinePressure: -10, reboundRisk: 25, bodyExpectation: -10, anxiety: 15, msg: '你拿回一點生活自由，但也開始擔心體重慢慢回來。原本以為結束療程就結束，結果焦慮沒有真的消失。' },
        { money: -2500, socialLife: 10, satisfaction: 15, bodyExpectation: -10, reboundRisk: 15, anxiety: 8, msg: '你拿回一點大學生的生活感，但也發現自己已經很難不去注意體態變化。' }
      ][choiceIndex];
      Object.entries(changes).forEach(([key, value]) => { if (key !== 'msg') s[key] += value; });
      s.lastMessage = changes.msg;
      s.phase = 'maintain';
    }
    if (action === 'maintain') {
      const changes = [
        { maintenance: 25, reboundRisk: -15, routinePressure: 20, energy: -10, socialLife: -5, satisfaction: 5, msg: '你比較有機會維持成果，但時間被壓縮。維持體態變成另一份固定功課。' },
        { maintenance: -5, reboundRisk: 10, energy: -15, sideEffect: 5, anxiety: 10, msg: '短期看起來比較省事，但精神變差，也更容易陷入反覆控制飲食的壓力。' },
        { socialLife: 15, satisfaction: 10, maintenance: -15, reboundRisk: 25, anxiety: 15, msg: '你生活比較自由，但體重變化讓你開始懷疑：是不是之前花的錢都白費了。' },
        { money: -500, maintenance: 10, reboundRisk: -10, anxiety: -5, satisfaction: 5, msg: '你沒有只靠網路經驗判斷，而是把問題帶回專業討論。這花錢也花時間，但比較不容易只被焦慮推著走。' }
      ][choiceIndex];
      Object.entries(changes).forEach(([key, value]) => { if (key !== 'msg') s[key] += value; });
      s.lastMessage = changes.msg;
      s.phase = 'result';
    }
    ['bodyExpectation', 'anxiety', 'satisfaction', 'sideEffect', 'energy', 'socialLife', 'maintenance', 'reboundRisk', 'routinePressure'].forEach((key) => { s[key] = this.clampStat(s[key]); });
    this.isUpdatingSim = true;
    this.render();
  }

  modal() {
    const method = this.methods.find((item) => item.id === this.activeMethod);
    if (!method) return '';
    const isMealGame = method.id === 'meal';
    const isSimGame = ['gym', 'influencer', 'injection'].includes(method.id);
    const gameContent = method.id === 'meal'
      ? this.mealGameContent()
      : method.id === 'gym'
        ? this.gymGameContent()
        : method.id === 'influencer'
          ? this.influencerGameContent()
          : method.id === 'injection'
            ? this.injectionGameContent()
            : '';
    const finished = this.selectedChoice !== null;
    return `
      <div class="body-experience-modal" data-body-experience-modal>
        <button class="body-experience-backdrop" type="button" data-close-body-experience aria-label="關閉體驗"></button>
        <section class="body-experience-dialog ${isMealGame || isSimGame ? 'is-meal-dialog' : ''} ${isSimGame ? 'is-sim-dialog' : ''}" role="dialog" aria-modal="true" aria-labelledby="bodyExperienceTitle">
          <button class="body-experience-close" type="button" data-close-body-experience aria-label="關閉體驗">×</button>
          ${isMealGame || isSimGame ? '' : `
            <div class="body-experience-dialog-media">
              <img src="${method.image}" alt="" />
            </div>
          `}
          <div class="body-experience-dialog-content">
            <p>體態管理方式體驗</p>
            <h2 id="bodyExperienceTitle">${method.title}</h2>
            ${gameContent || (finished ? `
              <div class="body-experience-result" aria-live="polite">
                <span>你的選擇</span>
                <h3>${method.choices[this.selectedChoice]}</h3>
                <p>${method.result}</p>
              </div>
              <div class="body-experience-modal-actions">
                <button type="button" data-continue-report>繼續向下閱讀</button>
              </div>
            ` : `
              <h3 class="body-experience-prompt">${method.prompt}</h3>
              <div class="body-experience-choices">
                ${method.choices.map((choice, index) => `
                  <button type="button" data-body-experience-choice="${index}">
                    <span>${String.fromCharCode(65 + index)}</span>
                    ${choice}
                  </button>
                `).join('')}
              </div>
              <small>這一版先建立互動骨架，後續可在此擴充完整小遊戲。</small>
            `)}
          </div>
        </section>
      </div>
    `;
  }

  render() {
    this.root.innerHTML = `
      <div class="body-experience-inner">
        <header class="body-experience-heading">
          <p>從搜尋走向選擇</p>
          <h2>如果現在要管理體態，你會選哪一種方式？</h2>
          <span>點開圖卡進入短體驗。你可以隨時退出，也可以完成後嘗試其他方式。</span>
        </header>
        <div class="body-experience-grid">${this.cards()}</div>
        <a class="body-experience-skip" href="#manga-panel-after-experience">先不體驗，繼續向下閱讀</a>
      </div>
      ${this.modal()}
    `;
    document.body.classList.toggle('has-body-experience-modal', Boolean(this.activeMethod));
    if (this.activeMethod && !this.isUpdatingMeal && !this.isUpdatingSim) {
      window.requestAnimationFrame(() => {
        this.root.querySelector('.body-experience-close')?.focus();
      });
    }
    this.isUpdatingMeal = false;
    this.isUpdatingSim = false;
  }

  open(methodId, trigger) {
    this.activeMethod = methodId;
    this.selectedChoice = null;
    if (methodId === 'meal') this.resetMealGame();
    if (methodId === 'gym') this.resetGymGame();
    if (methodId === 'influencer') this.resetInfluencerGame();
    if (methodId === 'injection') this.resetInjectionGame();
    this.lastFocusedElement = trigger;
    this.render();
  }

  close() {
    this.activeMethod = null;
    this.selectedChoice = null;
    this.render();
    this.lastFocusedElement?.focus();
  }

  finish(choiceIndex) {
    this.selectedChoice = choiceIndex;
    if (!this.completedMethods.includes(this.activeMethod)) {
      this.completedMethods = [...this.completedMethods, this.activeMethod];
    }
    this.render();
  }

  resetMealGame() {
    this.mealStep = 'base';
    this.mealBowl = {
      base: null,
      protein: null,
      veggies: [],
      sauce: null
    };
  }

  chooseMealOption(category, name) {
    const option = this.mealOptions[category]?.find((item) => item.name === name);
    if (!option) return;
    if (category === 'veggies') {
      const index = this.mealBowl.veggies.findIndex((item) => item.name === name);
      if (index >= 0) {
        this.mealBowl.veggies.splice(index, 1);
      } else if (this.mealBowl.veggies.length < 5) {
        this.mealBowl.veggies.push(option);
      }
    } else {
      this.mealBowl[category] = this.mealBowl[category]?.name === name ? null : option;
    }
    this.updateMealSelectionDom();
  }

  updateMealSelectionDom() {
    const bowl = this.root.querySelector('.body-poke-bowl');
    if (bowl) bowl.outerHTML = this.mealBowlMarkup(false);

    this.root.querySelectorAll('[data-body-meal-option]').forEach((button) => {
      const category = button.dataset.bodyMealOption;
      const name = button.dataset.bodyMealName;
      const selected = category === 'veggies'
        ? this.mealBowl.veggies.some((item) => item.name === name)
        : this.mealBowl[category]?.name === name;
      button.classList.toggle('is-selected', selected);
      if (category === 'veggies') {
        button.disabled = this.mealBowl.veggies.length >= 5 && !selected;
      }
    });

    const selectedCount = this.mealItems().length;
    const summary = this.root.querySelector('.body-poke-summary');
    if (summary) {
      summary.innerHTML = `
        <span>已放入 ${selectedCount} 項</span>
        <span>${this.canFinishMeal() ? '可以生成結果' : '選完後再計算營養與價格'}</span>
      `;
    }

    const nextButton = this.root.querySelector('[data-body-meal-next]');
    if (nextButton) nextButton.disabled = !this.canFinishMeal();
  }

  advanceMealGame() {
    if (!this.canFinishMeal()) return;
    this.mealStep = 'result';
    this.render();
  }

  finishMealGame() {
    if (!this.completedMethods.includes('meal')) {
      this.completedMethods = [...this.completedMethods, 'meal'];
    }
    this.close();
  }

  continueReading() {
    this.activeMethod = null;
    this.selectedChoice = null;
    this.render();
    document.getElementById('manga-panel-after-experience')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  handleClick(event) {
    const openButton = event.target.closest('[data-open-body-experience]');
    if (openButton) {
      this.open(openButton.dataset.openBodyExperience, openButton);
      return;
    }
    if (event.target.closest('[data-close-body-experience]')) {
      this.close();
      return;
    }
    const choiceButton = event.target.closest('[data-body-experience-choice]');
    if (choiceButton) {
      this.finish(Number(choiceButton.dataset.bodyExperienceChoice));
      return;
    }
    const mealOption = event.target.closest('[data-body-meal-option]');
    if (mealOption) {
      this.chooseMealOption(mealOption.dataset.bodyMealOption, mealOption.dataset.bodyMealName);
      return;
    }
    if (event.target.closest('[data-body-meal-next]')) {
      this.advanceMealGame();
      return;
    }
    if (event.target.closest('[data-body-meal-prev]')) {
      this.mealStep = this.mealStepConfig()[this.mealStep]?.previous || this.mealStep;
      this.render();
      return;
    }
    if (event.target.closest('[data-body-meal-restart]')) {
      this.resetMealGame();
      this.render();
      return;
    }
    if (event.target.closest('[data-body-meal-finish]')) {
      this.finishMealGame();
      return;
    }
    if (event.target.closest('[data-body-gym-feed]')) {
      this.handleGymAction('feed');
      return;
    }
    if (event.target.closest('[data-body-gym-sales]')) {
      this.handleGymAction('sales');
      return;
    }
    if (event.target.closest('[data-body-gym-reset]')) {
      this.resetGymGame();
      this.render();
      return;
    }
    if (event.target.closest('[data-body-influencer-reset]')) {
      this.resetInfluencerGame();
      this.render();
      return;
    }
    if (event.target.closest('[data-body-injection-reset]')) {
      this.resetInjectionGame();
      this.render();
      return;
    }
    if (event.target.closest('[data-body-sim-scroll]')) {
      this.root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const simChoice = event.target.closest('[data-body-sim-action]');
    if (simChoice) {
      const choiceIndex = Number(simChoice.dataset.bodySimChoice || 0);
      const action = simChoice.dataset.bodySimAction;
      if (action.startsWith('gym-')) this.handleGymAction(action.replace('gym-', ''), choiceIndex);
      if (action.startsWith('influencer-')) this.handleInfluencerAction(action.replace('influencer-', ''), choiceIndex);
      if (action.startsWith('injection-')) this.handleInjectionAction(action.replace('injection-', ''), choiceIndex);
      return;
    }
    if (event.target.closest('[data-continue-report]')) this.continueReading();
  }

  handleWheel(event) {
    const scrollZone = event.target.closest('[data-body-gym-scroll]');
    if (!scrollZone || this.activeMethod !== 'gym' || this.gymGame.phase !== 'feed') return;
    event.preventDefault();
    if (Math.abs(event.deltaY) < 8) return;
    const now = Date.now();
    if (this.lastGymScrollAt && now - this.lastGymScrollAt < 420) return;
    this.lastGymScrollAt = now;
    this.handleGymAction('feed');
  }

  handleTouchStart(event) {
    if (!event.target.closest('[data-body-gym-scroll]')) return;
    this.gymScrollTouchY = event.touches?.[0]?.clientY || 0;
  }

  handleTouchEnd(event) {
    const scrollZone = event.target.closest('[data-body-gym-scroll]');
    if (!scrollZone || this.activeMethod !== 'gym' || this.gymGame.phase !== 'feed') return;
    const endY = event.changedTouches?.[0]?.clientY || 0;
    if (this.gymScrollTouchY - endY < 16) return;
    const now = Date.now();
    if (this.lastGymScrollAt && now - this.lastGymScrollAt < 420) return;
    this.lastGymScrollAt = now;
    this.handleGymAction('feed');
  }

  mount() {
    this.root.addEventListener('click', (event) => this.handleClick(event));
    this.root.addEventListener('wheel', (event) => this.handleWheel(event), { passive: false });
    this.root.addEventListener('touchstart', (event) => this.handleTouchStart(event), { passive: true });
    this.root.addEventListener('touchend', (event) => this.handleTouchEnd(event));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.activeMethod) this.close();
    });
    this.render();
  }
}

function initBodyManagementExperienceHub() {
  const root = document.querySelector('[data-body-management-experience]');
  if (!root) return;
  window.bodyManagementExperienceHub = new BodyManagementExperienceHub(root);
  window.bodyManagementExperienceHub.mount();
}

initDynamicContentTransitions();
initHealthMagnifierChallenge();
initBodyManagementExperienceHub();
initBodyMangaScroll();
initSitePreloader();
