const siteAssetManifest = [
  './pic/opening-comic/1.jpg',
  './pic/opening-comic/2.jpg',
  './pic/opening-comic/3.jpg',
  './pic/opening-comic/4.jpg',
  './pic/opening-comic/5.jpg',
  './pic/opening-comic/6.jpg',
  './pic/opening-comic/7.jpg'
];
const gymSequenceManifestPath = './pic/gymanimation/render-webp/sequence-manifest.json';

function refreshLucideIcons() {
  if (window.lucide?.createIcons) {
    window.lucide.createIcons({
      attrs: {
        'aria-hidden': 'true',
        'stroke-width': 2
      }
    });
  }
}

window.addEventListener('load', refreshLucideIcons);

function preloadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = src;
    if (image.complete) resolve();
  });
}

async function loadGymSequenceAssets() {
  try {
    const response = await fetch(gymSequenceManifestPath);
    if (!response.ok) return [];
    const manifest = await response.json();
    if (Array.isArray(manifest.sequence)) return manifest.sequence;

    const basePath = manifest.basePath || '';
    const order = Array.isArray(manifest.order) ? manifest.order : [];
    return order.flatMap((folder) => {
      const files = manifest.folders?.[folder] || [];
      return files.map((file) => `${basePath}/${folder}/${file}`);
    });
  } catch {
    return [];
  }
}

async function initSitePreloader() {
  const preloader = document.querySelector('[data-site-preloader]');
  const progressBar = document.querySelector('[data-preload-progress]');
  const status = document.querySelector('[data-preload-status]');
  if (!preloader) {
    document.documentElement.classList.remove('is-preloading');
    return;
  }

  const gymSequenceAssets = await loadGymSequenceAssets();
  const imageAssets = [...new Set([...siteAssetManifest, ...gymSequenceAssets])];
  const totalAssets = Math.max(1, imageAssets.length);
  const startedAt = performance.now();
  let completed = 0;
  const updateProgress = () => {
    const percentage = Math.round((completed / totalAssets) * 100);
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (status) status.textContent = `載入素材 ${percentage}%`;
  };
  const finishPreloader = () => {
    if (progressBar) progressBar.style.width = '100%';
    if (status) status.textContent = '準備完成';
    document.documentElement.classList.remove('is-preloading');
    preloader.classList.add('is-complete');
    window.setTimeout(() => preloader.remove(), 500);
  };

  const preloadTask = Promise.all(
    [
      ...imageAssets.map((src) => preloadImage(src))
    ].map((task) =>
      task.finally(() => {
        completed += 1;
        updateProgress();
      })
    )
  );
  try {
    await preloadTask;
    await (document.fonts?.ready || Promise.resolve());
  } catch {
    // The article should stay readable even if one optional asset reports late.
  }

  const minimumDisplayTime = Math.max(0, 350 - (performance.now() - startedAt));
  await new Promise((resolve) => window.setTimeout(resolve, minimumDisplayTime));
  finishPreloader();
}

initSitePreloader();

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
  const panelStops = panels.map((_, index) => index / panels.length).concat(1.01);

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
      stage.style.opacity = String(Math.min(1, panelProgress * 10));
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
    src: createBodyImagePath('female8.JPG'),
    gender: 'female',
    bodyFatRange: '8%',
    bodyFatTarget: 8,
    bodyFatMin: 8,
    bodyFatMax: 8,
    selectionNote: '你選擇的是線條較精瘦、肌肉輪廓較明顯的體態。'
  },
  {
    id: 'female-25',
    label: '理想身材選項',
    src: createBodyImagePath('female25.JPG'),
    gender: 'female',
    bodyFatRange: '25%',
    bodyFatTarget: 25,
    bodyFatMin: 25,
    bodyFatMax: 25,
    selectionNote: '你選擇的是線條較柔和、身形曲線較明顯的體態。'
  },
  {
    id: 'female-15-18',
    label: '理想身材選項',
    src: createBodyImagePath('female15.JPG'),
    gender: 'female',
    bodyFatRange: '15%',
    bodyFatTarget: 15,
    bodyFatMin: 15,
    bodyFatMax: 15,
    selectionNote: '你選擇的是保有部分線條、外觀較自然均衡的體態。'
  },
  {
    id: 'male-under-8',
    label: '理想身材選項',
    src: createBodyImagePath('male8.JPG'),
    gender: 'male',
    bodyFatRange: '8%',
    bodyFatTarget: 8,
    bodyFatMin: 8,
    bodyFatMax: 8,
    selectionNote: '你選擇的是線條較精瘦、肌肉輪廓較明顯的體態。'
  },
  {
    id: 'male-20',
    label: '理想身材選項',
    src: createBodyImagePath('male20.JPG'),
    gender: 'male',
    bodyFatRange: '20%',
    bodyFatTarget: 20,
    bodyFatMin: 20,
    bodyFatMax: 20,
    selectionNote: '你選擇的是線條較柔和、整體輪廓較厚實的體態。'
  },
  {
    id: 'male-15-18',
    label: '理想身材選項',
    src: createBodyImagePath('male15.JPG'),
    gender: 'male',
    bodyFatRange: '15%',
    bodyFatTarget: 15,
    bodyFatMin: 15,
    bodyFatMax: 15,
    selectionNote: '你選擇的是保有部分線條、外觀較自然均衡的體態。'
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
  const activeChoiceIds = new Set(bodyFatImages.map((image) => image.id));
  const validStats = stats.filter((item) => activeChoiceIds.has(item.choiceId));

  if (!selectedBodyImage || validStats.length === 0) {
    return {
      totalCount: validStats.length,
      sameChoiceCount: 0,
      percentage: 0
    };
  }

  const sameChoiceCount = validStats.filter((item) => item.choiceId === selectedBodyImage.id).length;
  return {
    totalCount: validStats.length,
    sameChoiceCount,
    percentage: Math.round((sameChoiceCount / validStats.length) * 100)
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
  const hasSharedStats = IdealBodySelector.statsSource === 'firebase';
  const statsSourceText = hasSharedStats ? '所有使用者即時選擇' : '本機即時選擇';

  choiceResult.innerHTML = `
    <article class="body-choice-stat-card">
      <p class="body-choice-selected">你選擇了這個體態</p>
      <p>${IdealBodySelector.selectedBodyImage.selectionNote}</p>
      <p>你選擇的體態大約落在 ${IdealBodySelector.selectedBodyImage.bodyFatRange} 體脂區間。</p>
      <div class="body-choice-stat-main">
        <strong>${stats.percentage}%</strong>
        <span>${statsSourceText}</span>
      </div>
      <div class="body-choice-progress" aria-label="選擇相同理想身材比例">
        <span style="width: ${stats.percentage}%"></span>
      </div>
      <p class="body-choice-stat-count">${stats.sameChoiceCount} / ${stats.totalCount} 人選擇這張理想身材</p>
      <p>目前共有 ${stats.totalCount} 位使用者完成選擇。其中有 ${stats.sameChoiceCount} 位使用者也點選這張理想身材，約佔所有選擇的 ${stats.percentage}%。</p>
      <p>這個比例只代表目前收集到的選擇分布，不代表健康程度或最佳體態。</p>
      ${hasSharedStats ? '' : '<p class="body-choice-local-note">目前僅顯示本機即時回饋；Firebase 連線後會更新為所有使用者資料。</p>'}
    </article>
  `;
}

function formatBodyFatDifference(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatBodyNumber(value, digits = 0) {
  if (!Number.isFinite(value)) return '--';
  return Number(value.toFixed(digits)).toString();
}

function calculateBodyActionPlan(selected, profile) {
  const currentBodyFat = profile.bodyFat;
  const targetBodyFat = selected.bodyFatTarget ?? ((selected.bodyFatMin + selected.bodyFatMax) / 2);
  const delta = currentBodyFat - targetBodyFat;
  const gap = Math.abs(delta);
  const withinRange = gap < 0.5;
  const aboveRange = delta > 0;
  const belowRange = delta < 0;
  const calorieFloor = profile.gender === 'male' ? 1500 : 1200;
  const calorieAdjustment = aboveRange
    ? -Math.min(500, Math.max(250, Math.round(profile.tdee * 0.18)))
    : belowRange
      ? 200
      : 0;
  const calorieTarget = Math.max(calorieFloor, Math.round(profile.tdee + calorieAdjustment));
  const calorieRangeLow = Math.max(calorieFloor, calorieTarget - 100);
  const calorieRangeHigh = calorieTarget + 100;
  const mealCalories = Math.round(calorieTarget / 3);
  const proteinMultiplier = belowRange ? 1.8 : 1.6;
  const proteinTarget = Math.round(profile.weight * proteinMultiplier);
  const fatTarget = Math.max(35, Math.round((calorieTarget * 0.25) / 9));
  const carbTarget = Math.max(80, Math.round((calorieTarget - (proteinTarget * 4) - (fatTarget * 9)) / 4));
  const waterTarget = Math.round(profile.weight * 35);
  const estimatedWeeks = withinRange ? 4 : 12;
  const strengthDays = aboveRange ? 3 : belowRange ? 4 : 3;
  const cardioDays = aboveRange ? (gap >= 8 ? 3 : 2) : 2;
  const dietAdvice = aboveRange
    ? `每日熱量先控制在 ${calorieRangeLow}-${calorieRangeHigh} kcal，約比維持熱量少 ${Math.abs(calorieAdjustment)} kcal；每餐約 ${mealCalories} kcal，蛋白質抓 ${proteinTarget} g / 日，先不要低於 ${calorieFloor} kcal。`
    : belowRange
      ? `每日熱量先抓 ${calorieRangeLow}-${calorieRangeHigh} kcal，約比維持熱量多 ${calorieAdjustment} kcal；每餐約 ${mealCalories} kcal，蛋白質抓 ${proteinTarget} g / 日，搭配足量主食幫助增肌。`
      : `每日熱量先維持在 ${calorieRangeLow}-${calorieRangeHigh} kcal；每餐約 ${mealCalories} kcal，蛋白質抓 ${proteinTarget} g / 日，觀察體重與精神狀態。`;
  const exerciseAdvice = aboveRange
    ? `先以 ${estimatedWeeks} 週為一期：每週 ${strengthDays} 天重量訓練，安排深蹲、硬舉、推、拉等全身動作；另外 ${cardioDays} 天做 30 分鐘快走、腳踏車或橢圓機，其餘天保留恢復。`
    : belowRange
      ? `先以 ${estimatedWeeks} 週為一期：每週 ${strengthDays} 天重量訓練，逐週增加重量或組數；有氧維持每週 1-2 天輕量即可，把恢復和進食放在優先。`
      : `先維持 4 週：每週 ${strengthDays} 天重量訓練，加上 ${cardioDays} 天輕有氧，重點放在穩定作息和避免過度限制飲食。`;
  const direction = aboveRange
    ? `先以 ${estimatedWeeks} 週為一期，目標是穩定降低體脂，而不是快速節食。`
    : belowRange
      ? `先以 ${estimatedWeeks} 週為一期，目標是增加肌肉與能量攝取，不需要再降低體脂。`
      : `先維持 4 週，每週 ${strengthDays} 天重量訓練，加上 2 天輕有氧，觀察力量與精神狀態。`;

  return {
    targetBodyFat,
    delta,
    gap,
    withinRange,
    aboveRange,
    belowRange,
    estimatedWeeks,
    strengthDays,
    cardioDays,
    calorieRangeLow,
    calorieRangeHigh,
    calorieTarget,
    calorieAdjustment,
    mealCalories,
    proteinTarget,
    carbTarget,
    fatTarget,
    waterTarget,
    dietAdvice,
    exerciseAdvice,
    direction
  };
}

function updateBodyCheckResult() {
  const result = document.getElementById('bodyCheckResult');
  const heightInput = document.getElementById('bodyHeightInput');
  const weightInput = document.getElementById('bodyWeightInput');
  const bodyFatInput = document.getElementById('bodyFatInput');
  if (!result || !heightInput || !weightInput || !bodyFatInput) return;

  const selected = IdealBodySelector.selectedBodyImage;
  const height = Number(heightInput.value);
  const weight = Number(weightInput.value);
  const currentBodyFat = Number(bodyFatInput.value);
  if (!selected && !height && !weight && !currentBodyFat) {
    result.textContent = '選擇理想身材並輸入身高、體重、體脂率後，就可以開始整理行動建議。';
    return;
  }
  if (!selected) {
    result.textContent = '請先點選一張理想身材圖片。';
    return;
  }
  if (!height || height < 80 || !weight || weight <= 0 || !currentBodyFat || currentBodyFat <= 0) {
    result.textContent = `你選擇的理想身材約落在體脂 ${selected.bodyFatRange}，請完整輸入身高、體重、體脂率來計算。`;
    return;
  }

  const gender = IdealBodySelector.selectedGender === 'male' ? 'male' : 'female';
  const heightMeter = height / 100;
  const bmi = weight / (heightMeter * heightMeter);
  const age = 20;
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);
  const tdee = bmr * 1.375;
  const profile = {
    height,
    weight,
    bodyFat: currentBodyFat,
    gender,
    age,
    activityLevel: 'medium',
    bmi,
    bmr,
    tdee
  };
  const plan = calculateBodyActionPlan(selected, profile);
  const savedProfile = {
    ...profile,
    selectedIdealBodyId: selected.id,
    selectedIdealBodyRange: selected.bodyFatRange,
    estimatedCalories: plan.calorieTarget,
    mealCalories: plan.mealCalories,
    proteinTarget: plan.proteinTarget,
    carbTarget: plan.carbTarget,
    fatTarget: plan.fatTarget,
    waterTarget: plan.waterTarget,
    bodyActionPlan: plan
  };
  localStorage.setItem('bodyHealthProfile', JSON.stringify(savedProfile));

  const rangeMessage = plan.withinRange
    ? `你目前已接近目標體脂 ${selected.bodyFatRange}。`
    : plan.aboveRange
      ? `你目前體脂 ${formatBodyNumber(currentBodyFat, 1)}%，和目標 ${selected.bodyFatRange} 約差 ${formatBodyFatDifference(plan.gap)} 個體脂百分點。`
      : `你目前體脂 ${formatBodyNumber(currentBodyFat, 1)}%，比目標 ${selected.bodyFatRange} 低約 ${formatBodyFatDifference(plan.gap)} 個體脂百分點。`;

  result.innerHTML = `
    <article class="body-check-summary">
      <p><strong>${rangeMessage}</strong></p>
      <p>${plan.direction}</p>
      <p><strong>飲食建議：</strong>${plan.dietAdvice}</p>
      <p><strong>運動安排：</strong>${plan.exerciseAdvice}</p>
      <div class="body-check-metrics">
        <span>BMI：${formatBodyNumber(bmi, 1)}</span>
        <span>維持熱量：約 ${Math.round(tdee)} kcal</span>
        <span>建議熱量：${plan.calorieRangeLow}-${plan.calorieRangeHigh} kcal</span>
        <span>每餐約：${plan.mealCalories} kcal</span>
        <span>蛋白質：${plan.proteinTarget} g / 日</span>
        <span>碳水：${plan.carbTarget} g / 日</span>
        <span>脂肪：約 ${plan.fatTarget} g / 日</span>
        <span>喝水：約 ${plan.waterTarget} ml / 日</span>
      </div>
      <p class="body-check-note">已儲存這份資料，後面的健康餐與互動遊戲會優先使用這組身體數值。</p>
    </article>
  `;
}

function renderBodyOptions() {
  const optionGrid = document.getElementById('bodyOptionGrid');
  if (!optionGrid) return;

  optionGrid.innerHTML = '';
  const visibleOptions = bodyOptions[IdealBodySelector.selectedGender];

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
    updateBodyCheckResult();
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
    updateBodyCheckResult();

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

function initBodyCheckForm() {
  const form = document.getElementById('bodyCheckForm');
  const inputs = ['bodyHeightInput', 'bodyWeightInput', 'bodyFatInput']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!form || !inputs.length) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    updateBodyCheckResult();
  });
  inputs.forEach((input) => input.addEventListener('input', updateBodyCheckResult));
}

initBodyCheckForm();

function initCaseFloatMenu() {
  const menu = document.querySelector('[data-case-menu]');
  if (!menu) return;

  const toggle = menu.querySelector('.case-menu-toggle');
  const panel = menu.querySelector('.case-menu-panel');
  const storiesToggle = menu.querySelector('[data-case-stories-toggle]');
  const storiesPanel = menu.querySelector('[data-case-stories]');
  const searchInput = menu.querySelector('#caseSearchInput');
  const hashtagButtons = menu.querySelectorAll('[data-case-tag]');
  const caseCards = menu.querySelectorAll('[data-case-card]');
  if (!toggle || !panel) return;

  function setOpen(isOpen) {
    panel.hidden = !isOpen;
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  function filterCases(query) {
    const normalizedQuery = query.trim().replace(/^#/, '').toLowerCase();
    caseCards.forEach((card) => {
      const haystack = `${card.textContent} ${card.dataset.tags || ''}`.toLowerCase();
      card.hidden = Boolean(normalizedQuery) && !haystack.includes(normalizedQuery);
    });
  }

  toggle.addEventListener('click', () => {
    setOpen(panel.hidden);
  });

  storiesToggle?.addEventListener('click', () => {
    if (!storiesPanel) return;
    const isOpen = storiesPanel.hidden;
    storiesPanel.hidden = !isOpen;
    storiesToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (isOpen) searchInput?.focus({ preventScroll: true });
  });

  searchInput?.addEventListener('input', () => {
    filterCases(searchInput.value);
  });

  hashtagButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const tag = button.dataset.caseTag || '';
      if (searchInput) searchInput.value = tag ? `#${tag}` : '';
      filterCases(tag);
      hashtagButtons.forEach((item) => item.classList.toggle('active', item === button));
    });
  });

  panel.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      setOpen(false);
      if (storiesPanel) storiesPanel.hidden = true;
      storiesToggle?.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target)) setOpen(false);
  });
}

initCaseFloatMenu();



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
  const videoOrbits = Array.from(document.querySelectorAll('[data-video-orbit]'));
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

  videoOrbits.forEach((videoOrbit) => {
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
  });

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
    videoOrbits.forEach((orbit) => mangaObserver.observe(orbit));
  } else {
    panels.forEach((panel) => panel.classList.add('is-visible'));
    videoOrbits.forEach((orbit) => orbit.classList.add('is-visible'));
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

function initModelPostVideos() {
  const sections = Array.from(document.querySelectorAll('[data-model-post-videos]'));
  if (!sections.length) return;
  const videos = sections.flatMap((section) => Array.from(section.querySelectorAll('video')));
  videos.forEach((video) => {
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.load();
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const sectionVideos = Array.from(entry.target.querySelectorAll('video'));
        sectionVideos.forEach((video) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      });
    },
    { threshold: 0.18 }
  );

  sections.forEach((section) => observer.observe(section));
}

function initXinmiIntroCards() {
  const stack = document.querySelector('[data-xinmi-card-stack]');
  if (!stack) return;

  const panels = Array.from(stack.querySelectorAll('[data-xinmi-panel]'));
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  function setActivePanel() {
    const rect = stack.getBoundingClientRect();
    const stackTop = rect.top + window.scrollY;
    const scrollable = Math.max(1, stack.offsetHeight - window.innerHeight);
    const rawProgress = clamp((window.scrollY - stackTop) / scrollable, 0, 0.999);
    const cardProgress = (rawProgress - 0.1) / 0.88;
    const activeIndex = clamp(Math.floor(clamp(cardProgress, 0, 0.999) * panels.length), 0, panels.length - 1);
    panels.forEach((panel, index) => {
      const isActive = rawProgress >= 0.1 && rawProgress <= 0.985 && index === activeIndex;
      panel.classList.toggle('is-active', isActive);
      panel.style.zIndex = String(isActive ? 5 : 0);
    });
  }

  function setComparisonReveal(comparison, value) {
    if (!comparison) return;
    comparison.style.setProperty('--reveal', `${value}%`);
  }

  stack.querySelectorAll('[data-xinmi-compare-range]').forEach((range) => {
    const comparison = range.closest('[data-xinmi-comparison]');
    setComparisonReveal(comparison, range.value);
    range.addEventListener('input', (event) => {
      setComparisonReveal(comparison, event.target.value);
    });
  });

  function tickActivePanel() {
    const rect = stack.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.2 && rect.bottom > -window.innerHeight * 0.2) {
      setActivePanel();
    }
    window.requestAnimationFrame(tickActivePanel);
  }

  window.addEventListener('scroll', setActivePanel, { passive: true });
  window.addEventListener('resize', setActivePanel);
  setActivePanel();
  window.requestAnimationFrame(tickActivePanel);
}

function initWeightStorySection() {
  const comicScroll = document.querySelector('[data-haocheng-comic-scroll]');
  if (comicScroll) {
    const panels = Array.from(comicScroll.querySelectorAll('[data-haocheng-comic-panel]'));
    const progressBar = comicScroll.querySelector('[data-haocheng-comic-progress]');
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    function updateComicScroll() {
      const rect = comicScroll.getBoundingClientRect();
      const scrollable = Math.max(1, comicScroll.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / scrollable, 0, 0.999);
      const activeIndex = clamp(Math.floor(progress * panels.length), 0, panels.length - 1);
      panels.forEach((panel, index) => panel.classList.toggle('is-active', index === activeIndex));
      const percent = Math.round(progress * 1000) / 10;
      comicScroll.style.setProperty('--haocheng-comic-progress', `${percent}%`);
      if (progressBar) progressBar.style.width = `${percent}%`;
    }

    updateComicScroll();
    window.addEventListener('scroll', updateComicScroll, { passive: true });
    window.addEventListener('resize', updateComicScroll);
  }

  document.querySelectorAll('[data-haocheng-compare-range]').forEach((range) => {
    const comparison = range.closest('[data-haocheng-comparison]');
    if (!comparison) return;
    const updateReveal = () => comparison.style.setProperty('--reveal', `${range.value}%`);
    range.addEventListener('input', updateReveal);
    updateReveal();
  });

  const planner = document.querySelector('[data-haocheng-meal-planner]');
  if (!planner) return;
  if (planner.dataset.mealPlannerInitialized === 'true') return;

  const mealItems = [
    { id: 'brown-rice', category: 'base', name: '糙米飯', calories: 220, protein: 5, carbs: 46, note: '穩定碳水', image: './pic/meal-foods/brown-rice.png' },
    { id: 'sweet-potato', category: 'base', name: '地瓜', calories: 165, protein: 2, carbs: 38, note: '低脂澱粉', image: './pic/meal-foods/sweet-potato.png' },
    { id: 'multigrain-rice', category: 'base', name: '五穀飯', calories: 240, protein: 6, carbs: 48, note: '纖維較高', image: './pic/meal-foods/multigrain-rice.png' },
    { id: 'white-rice', category: 'base', name: '白飯', calories: 260, protein: 5, carbs: 58, note: '常見主食', image: './pic/meal-foods/white-rice.png' },
    { id: 'chicken', category: 'protein', name: '雞胸肉', calories: 165, protein: 31, carbs: 0, note: '高蛋白', image: './pic/meal-foods/chicken.png' },
    { id: 'egg', category: 'protein', name: '水煮蛋', calories: 78, protein: 6, carbs: 1, note: '補蛋白', image: './pic/meal-foods/egg.png' },
    { id: 'salmon', category: 'protein', name: '鮭魚', calories: 230, protein: 25, carbs: 0, note: '脂肪較高', image: './pic/meal-foods/salmon.png' },
    { id: 'fried-chicken-leg', category: 'protein', name: '炸雞腿', calories: 320, protein: 22, carbs: 8, note: '油炸主菜', image: './pic/meal-foods/fried-chicken-leg.png' },
    { id: 'broccoli', category: 'side', name: '花椰菜', calories: 35, protein: 3, carbs: 7, note: '纖維來源', image: './pic/meal-foods/broccoli.png' },
    { id: 'cabbage', category: 'side', name: '高麗菜', calories: 45, protein: 2, carbs: 9, note: '蔬菜', image: './pic/meal-foods/cabbage.png' },
    { id: 'mushroom', category: 'side', name: '菇類', calories: 40, protein: 3, carbs: 6, note: '低熱量配菜', image: './pic/meal-foods/mushroom.png' },
    { id: 'tofu', category: 'side', name: '豆腐', calories: 95, protein: 10, carbs: 3, note: '植物蛋白', image: './pic/meal-foods/tofu.png' },
    { id: 'corn', category: 'side', name: '玉米', calories: 110, protein: 4, carbs: 24, note: '澱粉配菜', image: './pic/meal-foods/corn.png' },
    { id: 'fries', category: 'side', name: '薯條', calories: 310, protein: 4, carbs: 41, note: '油炸澱粉', image: './pic/meal-foods/fries.png' },
    { id: 'milk-tea', category: 'side', name: '微糖奶茶', calories: 240, protein: 4, carbs: 38, note: '飲料熱量', image: './pic/meal-foods/milk-tea.png' },
    { id: 'sugar-free-tea', category: 'side', name: '無糖茶', calories: 0, protein: 0, carbs: 0, note: '低熱量飲品', image: './pic/meal-foods/sugar-free-tea.png' }
  ];

  const selectedIds = new Set();
  const optionTargets = {
    base: planner.querySelector('[data-meal-options="base"]'),
    protein: planner.querySelector('[data-meal-options="protein"]'),
    side: planner.querySelector('[data-meal-options="side"]')
  };
  const selectedList = planner.querySelector('[data-meal-selected-list]');
  const stickerBox = planner.querySelector('[data-meal-sticker-box]');
  const feedback = planner.querySelector('[data-meal-feedback]');
  const resetButton = planner.querySelector('[data-meal-reset]');
  const sectionElements = {
    base: planner.querySelector('[data-meal-section="base"]'),
    protein: planner.querySelector('[data-meal-section="protein"]'),
    side: planner.querySelector('[data-meal-section="side"]')
  };
  const sectionSummaries = {
    base: planner.querySelector('[data-meal-section-summary="base"]'),
    protein: planner.querySelector('[data-meal-section-summary="protein"]'),
    side: planner.querySelector('[data-meal-section-summary="side"]')
  };
  const collapsedSections = new Set();
  const totalTargets = {
    calories: planner.querySelector('[data-meal-total="calories"]'),
    protein: planner.querySelector('[data-meal-total="protein"]'),
    carbs: planner.querySelector('[data-meal-total="carbs"]')
  };
  const targetLabels = {
    calories: planner.querySelector('[data-meal-target="calories"]'),
    protein: planner.querySelector('[data-meal-target="protein"]'),
    carbs: planner.querySelector('[data-meal-target="carbs"]')
  };

  function savedMealTargets() {
    let profile = null;
    try {
      profile = JSON.parse(localStorage.getItem('bodyHealthProfile'));
    } catch {
      profile = null;
    }

    if (!profile || !Number(profile.weight)) {
      return {
        isPersonalized: false,
        calories: 600,
        protein: 25,
        carbs: 60
      };
    }

    const calories = Number(profile.mealCalories)
      || Math.round((Number(profile.estimatedCalories) || Number(profile.tdee) || 1800) / 3);
    const protein = Math.round((Number(profile.proteinTarget) || Number(profile.weight) * 1.2) / 3);
    const carbs = Math.round((Number(profile.carbTarget) || Number(profile.weight) * 3) / 3);
    return {
      isPersonalized: true,
      calories: Math.max(320, calories),
      protein: Math.max(12, protein),
      carbs: Math.max(30, carbs)
    };
  }

  function selectedItems() {
    return mealItems.filter((item) => selectedIds.has(item.id));
  }

  function renderStickerBox(items) {
    if (!stickerBox) return;
    if (!items.length) {
      stickerBox.innerHTML = '<span>尚未選擇食材</span>';
      return;
    }
    stickerBox.innerHTML = items.map((item) => `
      <figure class="meal-sticker" title="${item.name}">
        <img src="${item.image}" alt="${item.name}" />
        <figcaption>${item.name}</figcaption>
      </figure>
    `).join('');
  }

  function flyStickerToBox(button, item) {
    if (!stickerBox || !item.image || !button) return;
    const sourceImage = button.querySelector('img');
    const sourceRect = (sourceImage || button).getBoundingClientRect();
    const targetRect = stickerBox.getBoundingClientRect();
    const fromX = sourceRect.left + sourceRect.width / 2;
    const fromY = sourceRect.top + sourceRect.height / 2;
    const toX = targetRect.left + targetRect.width / 2;
    const toY = targetRect.top + Math.min(targetRect.height * 0.62, 128);
    const sticker = document.createElement('img');
    sticker.className = 'meal-sticker-fly';
    sticker.src = item.image;
    sticker.alt = '';
    sticker.style.setProperty('--from-x', `${fromX}px`);
    sticker.style.setProperty('--from-y', `${fromY}px`);
    sticker.style.setProperty('--mid-x', `${(fromX + toX) / 2}px`);
    sticker.style.setProperty('--mid-y', `${(fromY + toY) / 2 - 48}px`);
    sticker.style.setProperty('--to-x', `${toX}px`);
    sticker.style.setProperty('--to-y', `${toY}px`);
    document.body.appendChild(sticker);
    sticker.addEventListener('animationend', () => sticker.remove(), { once: true });
  }

  function renderMealPlanner() {
    const items = selectedItems();
    const totals = items.reduce(
      (sum, item) => ({
        calories: sum.calories + item.calories,
        protein: sum.protein + item.protein,
        carbs: sum.carbs + item.carbs
      }),
      { calories: 0, protein: 0, carbs: 0 }
    );
    const targets = savedMealTargets();
    const carbLow = Math.round(targets.carbs * 0.75);
    const carbHigh = Math.round(targets.carbs * 1.25);

    totalTargets.calories.textContent = `${totals.calories} kcal`;
    totalTargets.protein.textContent = `${totals.protein} g`;
    totalTargets.carbs.textContent = `${totals.carbs} g`;
    targetLabels.calories.textContent = targets.isPersonalized ? `你的每餐建議約 ${targets.calories} kcal` : '未填資料時暫用 600 kcal';
    targetLabels.protein.textContent = `建議 ${targets.protein} g 以上`;
    targetLabels.carbs.textContent = `建議 ${carbLow}-${carbHigh} g`;
    selectedList.textContent = items.length ? items.map((item) => item.name).join('、') : '尚未選擇食材';
    renderStickerBox(items);

    const hasBase = items.some((item) => item.category === 'base');
    const hasProtein = items.some((item) => item.category === 'protein');
    const hasSide = items.some((item) => item.category === 'side');
    const messages = [];
    if (!hasBase) messages.push('缺少主食，可能比較不耐餓。');
    if (!hasProtein || totals.protein < targets.protein) messages.push('蛋白質不足，可以增加雞胸肉、蛋、豆腐或瘦肉。');
    if (!hasSide) messages.push('缺少蔬菜或配菜，纖維量偏少。');
    if (totals.carbs > carbHigh) messages.push('碳水高於建議，可以減少澱粉或含糖飲料。');
    if (totals.carbs > 0 && totals.carbs < carbLow) messages.push('碳水偏低，若下午容易餓可補一點主食。');
    if (totals.calories > targets.calories) messages.push('熱量超過你的一餐建議，若想減重可以減少油炸或含糖飲料。');
    if (totals.calories > 0 && totals.calories < targets.calories * 0.65) messages.push('熱量偏低，長期可能難以維持。');
    if (!messages.length) messages.push('這份餐盒大致兼顧熱量赤字、蛋白質和碳水比例。');
    feedback.textContent = messages.join(' ');

    Object.entries(sectionElements).forEach(([category, section]) => {
      if (!section) return;
      const selectedInSection = items.filter((item) => item.category === category);
      const summary = sectionSummaries[category];
      if (summary) {
        summary.textContent = selectedInSection.length
          ? `已選：${selectedInSection.map((item) => item.name).join('、')}`
          : '尚未選擇';
      }
      section.classList.toggle('is-collapsed', collapsedSections.has(category) && selectedInSection.length > 0);
    });

    planner.querySelectorAll('[data-meal-choice]').forEach((button) => {
      button.classList.toggle('is-selected', selectedIds.has(button.dataset.mealChoice));
    });
  }

  mealItems.forEach((item) => {
    const button = document.createElement('button');
    button.className = 'meal-choice-button';
    button.type = 'button';
    button.dataset.mealChoice = item.id;
    button.innerHTML = `
      <span class="meal-choice-art" aria-hidden="true"><img src="${item.image}" alt="" /></span>
      <b>${item.name}</b>
      <small>${item.calories} kcal / 蛋白質 ${item.protein}g / 碳水 ${item.carbs}g</small>
      <small>${item.note}</small>
    `;
    button.addEventListener('click', () => {
      const wasSelected = selectedIds.has(item.id);
      if (selectedIds.has(item.id)) {
        selectedIds.delete(item.id);
      } else {
        if (item.category === 'base') {
          mealItems.filter((mealItem) => mealItem.category === 'base').forEach((mealItem) => selectedIds.delete(mealItem.id));
        }
        if (item.category === 'protein') {
          mealItems.filter((mealItem) => mealItem.category === 'protein').forEach((mealItem) => selectedIds.delete(mealItem.id));
        }
        selectedIds.add(item.id);
        collapsedSections.add(item.category);
      }
      if (!wasSelected) flyStickerToBox(button, item);
      renderMealPlanner();
    });
    optionTargets[item.category]?.appendChild(button);
  });

  planner.querySelectorAll('[data-meal-section-toggle]').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const category = toggle.dataset.mealSectionToggle;
      if (!category) return;
      if (collapsedSections.has(category)) {
        collapsedSections.delete(category);
      } else {
        collapsedSections.add(category);
      }
      renderMealPlanner();
    });
  });

  resetButton?.addEventListener('click', () => {
    selectedIds.clear();
    collapsedSections.clear();
    renderMealPlanner();
  });

  renderMealPlanner();
  planner.dataset.mealPlannerInitialized = 'true';
}

function initSocialPhoneScroll() {
  const frame = document.querySelector('[data-social-phone-scroll]');
  if (!frame || frame.dataset.socialPhoneInitialized === 'true') return;

  const thread = frame.querySelector('[data-social-message-thread]');
  const messages = Array.from(frame.querySelectorAll('.social-message-group'));
  const questionButtons = Array.from(frame.querySelectorAll('[data-social-question-target]'));
  if (!thread || !messages.length) return;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  let visibleCount = 0;
  let requestedVisibleCount = 0;

  function updateVisibleMessages() {
    const rect = frame.getBoundingClientRect();
    const scrollable = Math.max(1, frame.offsetHeight - window.innerHeight);
    const progress = clamp(-rect.top / scrollable, 0, 1);
    const scrollVisibleCount = Math.floor(progress * messages.length) + 1;
    const nextVisibleCount = clamp(Math.max(scrollVisibleCount, requestedVisibleCount), 1, messages.length);

    if (nextVisibleCount === visibleCount) return;
    visibleCount = nextVisibleCount;
    messages.forEach((message, index) => {
      message.classList.toggle('is-visible', index < visibleCount);
    });
    window.requestAnimationFrame(() => {
      thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
    });
  }

  updateVisibleMessages();
  window.addEventListener('scroll', updateVisibleMessages, { passive: true });
  window.addEventListener('resize', updateVisibleMessages);
  questionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetCount = Number.parseInt(button.dataset.socialQuestionTarget || '1', 10);
      requestedVisibleCount = clamp(targetCount, 1, messages.length);
      questionButtons.forEach((item) => item.classList.toggle('is-selected', item === button));
      visibleCount = 0;
      updateVisibleMessages();
    });
  });
  frame.dataset.socialPhoneInitialized = 'true';
}

const bodyCostItems = [
  {
    id: 'gym',
    name: '健身房月費',
    icon: 'dumbbell',
    monthlyCost: 1200,
    calculation: '以一般連鎖健身房月費估算',
    description: '健身房月費會依地點、合約長度、設備與品牌不同而變動。'
  },
  {
    id: 'personalTrainer',
    name: '私人健身教練課',
    icon: 'clipboard-check',
    monthlyCost: 14400,
    calculation: '以每堂 NT$1,800、一週 2 堂、每月 8 堂估算',
    description: '若以規律訓練頻率計算，教練課通常會成為體態管理中最高的固定支出之一。'
  },
  {
    id: 'glp1Injection',
    name: '瘦瘦針／GLP-1 類自費療程',
    icon: 'syringe',
    monthlyCost: 12000,
    calculation: '以每月 NT$6,000–18,000 的常見區間取中間偏保守值估算',
    description: '不同藥品、劑量、診所方案與是否包含檢查費，皆會影響實際支出。此項目僅作自費療程支出估算，不構成醫療建議。'
  },
  {
    id: 'dietMedication',
    name: '口服減重藥物／減重門診藥物',
    icon: 'pill',
    monthlyCost: 7000,
    calculation: '以每月約 NT$5,000–10,000 的自費藥物區間估算',
    description: '實際費用會依醫師評估、藥物種類、劑量與是否包含檢查費而不同。'
  },
  {
    id: 'enzyme',
    name: '減肥酵素／代謝保健品',
    icon: 'leaf',
    monthlyCost: 1000,
    calculation: '以每月購買一盒保健品估算',
    description: '此類產品價格差異較大，且效果不宜視為醫療或減重保證。'
  },
  {
    id: 'pilates',
    name: '皮拉提斯課程',
    icon: 'stretch-horizontal',
    monthlyCost: 4800,
    calculation: '以每堂 NT$600、一週 2 堂、每月 8 堂估算',
    description: '此處以團體或小班課程作保守估算；若為一對一器械皮拉提斯，費用可能大幅提高。'
  },
  {
    id: 'yoga',
    name: '瑜伽課程',
    icon: 'flower-2',
    monthlyCost: 3200,
    calculation: '以每堂 NT$400、一週 2 堂、每月 8 堂估算',
    description: '瑜伽費用會依課程型態、地點與購課方案不同而變動。'
  },
  {
    id: 'whey',
    name: '乳清蛋白',
    icon: 'package',
    monthlyCost: 1650,
    calculation: '以每份 NT$55、每月 30 份估算',
    description: '若每天補充一次乳清蛋白，每月花費約為 NT$1,500–1,800；實際支出依品牌、包裝與蛋白質含量而不同。'
  },
  {
    id: 'healthyMeal',
    name: '健康餐／健身餐',
    icon: 'salad',
    monthlyCost: 4500,
    calculation: '以每餐 NT$150、每月 30 餐估算',
    description: '此處不是以三餐皆吃健康餐計算，而是以每天一餐估算，較接近學生或年輕族群的部分替代飲食情境。'
  },
  {
    id: 'nutritionist',
    name: '營養師諮詢',
    icon: 'messages-square',
    monthlyCost: 2000,
    calculation: '以每月一次諮詢估算',
    description: '營養諮詢費用會依機構、諮詢時間與是否搭配方案而不同。'
  },
  {
    id: 'inbody',
    name: 'InBody 體組成測量',
    icon: 'scan-line',
    monthlyCost: 200,
    calculation: '以每月測量一次估算',
    description: '體組成測量通常不是主要支出，但常被納入體態管理追蹤流程。'
  },
  {
    id: 'workoutClothes',
    name: '運動服飾與裝備',
    icon: 'shirt',
    monthlyCost: 1000,
    calculation: '以鞋子、運動服、瑜伽墊等消耗與添購平均攤提估算',
    description: '此項目反映體態管理周邊消費，實際金額差異較大。'
  }
];

function initBodyCostCalculator() {
  const root = document.querySelector('[data-body-cost-calculator]');
  if (!root) return;

  const numberFormatter = new Intl.NumberFormat('zh-TW');
  const percentFormatter = new Intl.NumberFormat('zh-TW', {
    maximumFractionDigits: 1
  });
  const budgetInput = root.querySelector('[data-body-cost-budget]');
  const list = root.querySelector('[data-body-cost-list]');
  const clearButton = root.querySelector('[data-body-cost-clear]');
  const studentButton = root.querySelector('[data-body-cost-student]');
  const totalTarget = root.querySelector('[data-body-cost-total]');
  const percentageTarget = root.querySelector('[data-body-cost-percentage]');
  const remainingTarget = root.querySelector('[data-body-cost-remaining]');
  const progressTarget = root.querySelector('[data-body-cost-progress]');
  const progressNote = root.querySelector('[data-body-cost-progress-note]');
  const messageTarget = root.querySelector('[data-body-cost-message]');

  const formatCurrency = (value) => `NT$${numberFormatter.format(Math.round(value))}`;
  const formatPercentage = (value) => `${percentFormatter.format(value)}%`;

  function currentBudget() {
    const parsed = Number.parseInt(budgetInput.value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 12000;
  }

  function resultMessage(percentage, selectedTotal) {
    if (selectedTotal === 0) return '尚未選擇任何支出項目。';
    if (percentage <= 20) return '此支出已佔生活費的一部分，但仍屬相對可控範圍。';
    if (percentage <= 50) return '此支出已佔生活費相當比例，可能開始壓縮日常飲食、交通與社交等基本開銷。';
    if (percentage <= 100) return '此支出已接近或超過生活費的一半，對多數學生或初入職場者而言，可能形成明顯經濟壓力。';
    return '此支出已超過輸入的每月生活費。這表示體態管理相關消費不只是個人選擇，也可能涉及所得、階級與消費能力差異。';
  }

  function selectedItems() {
    return Array.from(root.querySelectorAll('[data-body-cost-item]:checked'))
      .map((checkbox) => bodyCostItems.find((item) => item.id === checkbox.value))
      .filter(Boolean);
  }

  function renderResults() {
    const budget = currentBudget();
    const selectedTotal = selectedItems().reduce((sum, item) => sum + item.monthlyCost, 0);
    const percentage = selectedTotal / budget * 100;
    const remainingBudget = budget - selectedTotal;
    const cappedProgress = Math.min(100, percentage);

    totalTarget.textContent = formatCurrency(selectedTotal);
    percentageTarget.textContent = formatPercentage(percentage);
    remainingTarget.textContent = formatCurrency(remainingBudget);
    progressTarget.style.width = `${cappedProgress}%`;
    progressNote.textContent = percentage > 100 ? `超過生活費（${formatPercentage(percentage)}）` : formatPercentage(percentage);
    messageTarget.textContent = resultMessage(percentage, selectedTotal);
  }

  list.innerHTML = bodyCostItems.map((item) => `
    <label class="body-cost-item">
      <input type="checkbox" value="${item.id}" data-body-cost-item />
      <span class="body-cost-item-check" aria-hidden="true"></span>
      <span class="body-cost-item-copy">
        <span class="body-cost-item-icon" aria-hidden="true">
          <i data-lucide="${item.icon}"></i>
        </span>
        <span class="body-cost-item-title">
          <b>${item.name}</b>
          <span>${formatCurrency(item.monthlyCost)} / 月</span>
        </span>
        <small>${item.calculation}</small>
        <p>${item.description}</p>
      </span>
    </label>
  `).join('');
  refreshLucideIcons();

  budgetInput.addEventListener('input', () => {
    budgetInput.value = budgetInput.value.replace(/[^\d]/g, '');
    renderResults();
  });

  budgetInput.addEventListener('blur', () => {
    if (!budgetInput.value || Number.parseInt(budgetInput.value, 10) <= 0) {
      budgetInput.value = '12000';
    }
    renderResults();
  });

  list.addEventListener('change', (event) => {
    if (event.target.matches('[data-body-cost-item]')) renderResults();
  });

  clearButton?.addEventListener('click', () => {
    root.querySelectorAll('[data-body-cost-item]').forEach((checkbox) => {
      checkbox.checked = false;
    });
    renderResults();
  });

  studentButton?.addEventListener('click', () => {
    budgetInput.value = '12000';
    renderResults();
  });

  renderResults();
}

function initGymScrollSequence() {
  const section = document.querySelector('[data-gym-scroll-sequence]');
  if (!section) return;
  if (section.dataset.sequenceInitialized === 'true') return;
  section.dataset.sequenceInitialized = 'true';

  const canvas = section.querySelector('[data-gym-sequence-canvas]');
  const dialogueCues = Array.from(section.querySelectorAll('[data-gym-dialogue-cue]'));
  const dialogueCompare = section.querySelector('[data-gym-dialogue-compare]');
  const manifestPath = section.dataset.sequenceManifest;
  if (!canvas || !manifestPath) return;

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const state = {
    frames: [],
    frameIndex: -1,
    isReady: false,
    rafId: 0,
    dpr: 1,
    canvasWidth: 0,
    canvasHeight: 0
  };

  function setScrollHeight(frameCount) {
    const pixelsPerFrame = window.matchMedia('(max-width: 720px)').matches ? 8 : 10;
    const scrollDistance = Math.max(window.innerHeight * 2.5, Math.max(1, frameCount - 1) * pixelsPerFrame);
    section.style.setProperty('--gym-sequence-height', `${Math.round(window.innerHeight + scrollDistance)}px`);
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (width === state.canvasWidth && height === state.canvasHeight && dpr === state.dpr) return;

    state.dpr = dpr;
    state.canvasWidth = width;
    state.canvasHeight = height;
    canvas.width = width;
    canvas.height = height;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.frameIndex = -1;
  }

  function drawFrame(index) {
    if (!state.isReady || !state.frames.length) return;
    resizeCanvas();

    const image = state.frames[clamp(index, 0, state.frames.length - 1)];
    const rect = canvas.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const canvasRatio = canvasWidth / canvasHeight;
    let drawWidth = canvasWidth;
    let drawHeight = canvasHeight;

    if (imageRatio > canvasRatio) {
      drawHeight = drawWidth / imageRatio;
    } else {
      drawWidth = drawHeight * imageRatio;
    }

    const x = (canvasWidth - drawWidth) / 2;
    const y = (canvasHeight - drawHeight) / 2;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.drawImage(image, x, y, drawWidth, drawHeight);
  }

  function currentFrameIndex() {
    if (!state.frames.length) return 0;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
    const progress = clamp((window.scrollY - sectionTop) / scrollable, 0, 1);
    return Math.round(progress * (state.frames.length - 1));
  }

  function requestDraw() {
    if (state.rafId) return;
    state.rafId = window.requestAnimationFrame(() => {
      state.rafId = 0;
      const index = currentFrameIndex();
      if (index !== state.frameIndex) {
        state.frameIndex = index;
        section.dataset.sequenceFrame = String(index);
        updateDialogueCue(index);
        drawFrame(index);
      }
    });
  }

  function updateDialogueCue(index) {
    if (!dialogueCues.length || !state.frames.length) return;
    const progress = state.frames.length <= 1 ? 0 : index / (state.frames.length - 1);
    const cueBreakpoints = [0, 0.18, 0.38, 0.62, 0.82];
    const activeIndex = cueBreakpoints.reduce((current, breakpoint, cueIndex) => {
      return progress >= breakpoint ? cueIndex : current;
    }, 0);
    dialogueCues.forEach((cue, cueIndex) => {
      cue.classList.toggle('is-active', cueIndex === activeIndex);
    });
    if (dialogueCompare) {
      const revealProgress = clamp((progress - 0.18) / 0.2, 0, 1);
      dialogueCompare.style.setProperty('--reveal', `${Math.round(revealProgress * 100)}%`);
    }
    section.dataset.sequenceCue = String(activeIndex);
  }

  function buildSequence(manifest) {
    if (Array.isArray(manifest.sequence) && manifest.sequence.length) return manifest.sequence;
    const basePath = manifest.basePath || '';
    const order = Array.isArray(manifest.order) ? manifest.order : [];
    return order.flatMap((folder) => {
      const files = manifest.folders?.[folder] || [];
      return files.map((file) => `${basePath}/${folder}/${file}`);
    });
  }

  function preloadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  fetch(manifestPath)
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load sequence manifest: ${response.status}`);
      return response.json();
    })
    .then((manifest) => {
      const sequence = buildSequence(manifest);
      setScrollHeight(sequence.length);
      resizeCanvas();
      const uniqueSources = Array.from(new Set(sequence));
      return Promise.all(uniqueSources.map((src) => preloadImage(src).then((image) => [src, image])))
        .then((entries) => {
          const imageMap = new Map(entries);
          state.frames = sequence.map((src) => imageMap.get(src)).filter(Boolean);
          section.dataset.sequenceTotalFrames = String(state.frames.length);
          state.isReady = state.frames.length > 0;
          requestDraw();
        });
    })
    .catch((error) => {
      console.warn(error);
    });

  window.addEventListener('scroll', requestDraw, { passive: true });
  window.addEventListener('resize', () => {
    setScrollHeight(state.frames.length);
    resizeCanvas();
    state.frameIndex = -1;
    requestDraw();
  });
}

initDynamicContentTransitions();
initBodyManagementExperienceHub();
initBodyMangaScroll();
initModelPostVideos();
initXinmiIntroCards();
initWeightStorySection();
document.addEventListener('DOMContentLoaded', initWeightStorySection);
window.addEventListener('load', initWeightStorySection);
initSocialPhoneScroll();
document.addEventListener('DOMContentLoaded', initSocialPhoneScroll);
initBodyCostCalculator();
initGymScrollSequence();
document.addEventListener('DOMContentLoaded', initGymScrollSequence);
