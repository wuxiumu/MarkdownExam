(function () {
  const views = {
    home: document.getElementById('homeView'),
    exam: document.getElementById('examView'),
    result: document.getElementById('resultView'),
    news: document.getElementById('newsView'),
    about: document.getElementById('aboutView'),
  };
  const themeToggle = document.getElementById('themeToggle');
  const menuToggle = document.getElementById('menuToggle');

  const state = {
    exams: [],
    paper: null,
    questions: [],
    currentIndex: 0,
    answers: {},
    submitted: false,
    mode: localStorage.getItem('markdown_exam_mode') || 'exam',
    startTime: null,
    bank: {
      keyword: '',
      tag: '',
      sort: 'recommended'
    },
    news: {
      items: [],
      cacheTime: 0,
      keyword: '',
      site: '',
      sort: 'default'
    },
  };

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function showView(name) {
    Object.keys(views).forEach((key) => views[key].classList.toggle('hidden', key !== name));
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('markdown_exam_theme', theme);
  }

  function getAnswer(question) {
    return state.answers[question.id] || [];
  }

  function isAnswered(question) {
    return getAnswer(question).length > 0;
  }

  function canScore(question) {
    return Array.isArray(question.answer) && question.answer.length > 0;
  }

  function isCorrect(question) {
    if (!canScore(question)) {
      return false;
    }

    const userAnswer = getAnswer(question).slice().sort().join(',');
    const rightAnswer = question.answer.slice().sort().join(',');
    return userAnswer === rightAnswer;
  }

  function persistProgress() {
    if (!state.paper || state.submitted) {
      return;
    }

    localStorage.setItem('markdown_exam_progress', JSON.stringify({
      paperId: state.paper.id,
      mode: state.mode,
      currentIndex: state.currentIndex,
      answers: state.answers,
      startTime: state.startTime
    }));
  }

  function clearProgress() {
    localStorage.removeItem('markdown_exam_progress');
  }

  async function requestJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('请求失败：' + response.status);
    }

    return response.json();
  }

  // ---- Hash-based routing ----
  let pendingRoute = false;

  function navigateTo(hash, replace) {
    if (pendingRoute) {
      return;
    }
    pendingRoute = true;
    const newUrl = window.location.pathname + '#' + hash;
    if (replace) {
      history.replaceState({ route: hash }, '', newUrl);
    } else {
      history.pushState({ route: hash }, '', newUrl);
    }
    pendingRoute = false;
  }

  function parseRoute(hash) {
    if (!hash || hash === '#' || hash === '#/') {
      return { view: 'home', params: {}, query: {} };
    }
    const hashContent = hash.replace('#/', '');
    const [pathPart, queryPart] = hashContent.split('?');
    const parts = pathPart.split('/');
    const view = parts[0] || 'home';
    const params = {};
    if (parts.length > 1) params.id = parts.slice(1).join('/');
    const query = {};
    if (queryPart) {
      queryPart.split('&').forEach((pair) => {
        const [key, val] = pair.split('=');
        if (key) query[decodeURIComponent(key)] = decodeURIComponent(val || '');
      });
    }
    return { view, params, query };
  }

  function setActiveNav(view) {
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.toggle('active', link.dataset.nav === view);
    });
  }

  function handleRoute(hash) {
    const { view, params } = parseRoute(hash);

    setActiveNav(view);

    if (view === 'home') {
      showView('home');
      renderHome();
    } else if (view === 'bank') {
      showView('home');
      renderBank();
    } else if (view === 'exam') {
      if (params.id && state.paper && state.paper.id === params.id) {
        showView('exam');
        renderExam();
      } else if (params.id) {
        const progress = JSON.parse(localStorage.getItem('markdown_exam_progress') || 'null');
        const shouldResume = progress && progress.paperId === params.id && confirm('检测到上次进度，是否继续？');
        startExam(params.id, shouldResume ? progress : null).catch((error) => {
          views.exam.innerHTML = '<div class="notice danger">' + escapeHtml(error.message) + '</div>';
        });
      }
    } else if (view === 'result') {
      showView('result');
      renderResult();
    } else if (view === 'news') {
      showView('news');
      renderNews();
    } else if (view === 'about') {
      showView('about');
      renderAbout();
    } else {
      showView('home');
      renderHome();
    }
  }

  window.addEventListener('hashchange', () => {
    if (pendingRoute) {
      return;
    }
    handleRoute(window.location.hash);
  });

  // Mobile menu toggle
  menuToggle.addEventListener('click', () => {
    document.body.classList.toggle('mobile-menu-open');
  });

  async function loadExams() {
    try {
      const payload = await requestJson('./api/index.php');
      state.exams = payload.data || [];
    } catch (error) {
      state.exams = [];
    }
    handleRoute(window.location.hash);
  }

  function renderHome() {
    if (state.exams.length === 0) {
      views.home.innerHTML = '<div class="notice">还没有可用题库，请在 api/exam 目录新增 Markdown 文件。</div>';
      return;
    }

    const totalQuestions = state.exams.reduce((sum, exam) => sum + Number(exam.questionCount || 0), 0);
    const seriesCount = new Set(state.exams.map((exam) => exam.series).filter(Boolean)).size;
    const tagCount = getAllTags().length;
    const recommended = getRecommendedExams();
    const seriesGroups = getSeriesGroups().slice(0, 4);

    views.home.innerHTML = `
      <section class="home-hero">
        <div>
          <p class="eyebrow">51吃瓜 · MarkdownExam</p>
          <h1>面向持续学习的题库自测中心</h1>
          <p class="hero-copy">把 Markdown 题库组织成可搜索、可筛选、可持续扩展的考试系列，适合读书训练、岗位能力和知识复盘。吃瓜看热点，刷题涨知识。</p>
          <div class="hero-actions">
            <a class="button-link primary" href="#/bank">进入题库</a>
            ${recommended[0] ? `<button type="button" data-start="${escapeHtml(recommended[0].id)}">开始推荐</button>` : ''}
          </div>
        </div>
        <div class="stats-grid" aria-label="题库统计">
          <div class="stat-item"><strong>${state.exams.length}</strong><span>套题库</span></div>
          <div class="stat-item"><strong>${totalQuestions}</strong><span>道题目</span></div>
          <div class="stat-item"><strong>${seriesCount}</strong><span>个系列</span></div>
          <div class="stat-item"><strong>${tagCount}</strong><span>个标签</span></div>
        </div>
      </section>

      <section class="section-block">
        <div class="section-head">
          <div>
            <h2>推荐练习</h2>
            <p class="muted">优先展示系列化、题量完整、适合连续训练的题库。</p>
          </div>
          <a href="#/bank">查看全部</a>
        </div>
        <div class="exam-grid compact-grid">${recommended.map(renderExamCard).join('')}</div>
      </section>

      <section class="section-block">
        <div class="section-head">
          <div>
            <h2>系列概览</h2>
            <p class="muted">按目录和元数据归类，后续可以继续扩展更多系列。</p>
          </div>
        </div>
        <div class="series-grid">
          ${seriesGroups.map((group) => `
            <article class="series-item">
              <h3>${escapeHtml(group.name)}</h3>
              <p>${group.exams.length} 套题库 · ${group.questions} 道题</p>
              <button type="button" data-bank-series="${escapeHtml(group.name)}">筛选该系列</button>
            </article>
          `).join('')}
        </div>
      </section>
    `;
  }

  function getAllTags() {
    return Array.from(new Set(state.exams.flatMap((exam) => exam.tags || []))).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }

  function getSeriesGroups() {
    const groups = new Map();
    state.exams.forEach((exam) => {
      const name = exam.series || exam.category || exam.group || '未分组';
      if (!groups.has(name)) {
        groups.set(name, { name, exams: [], questions: 0 });
      }
      const group = groups.get(name);
      group.exams.push(exam);
      group.questions += Number(exam.questionCount || 0);
    });

    return Array.from(groups.values()).sort((a, b) => b.exams.length - a.exams.length || a.name.localeCompare(b.name, 'zh-CN'));
  }

  function getRecommendedExams() {
    return state.exams
      .slice()
      .sort((a, b) => {
        const aSeries = a.series ? 1 : 0;
        const bSeries = b.series ? 1 : 0;
        return bSeries - aSeries || Number(b.questionCount || 0) - Number(a.questionCount || 0) || a.title.localeCompare(b.title, 'zh-CN');
      })
      .slice(0, 6);
  }

  function sortExams(exams) {
    return exams.slice().sort((a, b) => {
      if (state.bank.sort === 'title') {
        return a.title.localeCompare(b.title, 'zh-CN');
      }
      if (state.bank.sort === 'questions-desc') {
        return Number(b.questionCount || 0) - Number(a.questionCount || 0) || a.title.localeCompare(b.title, 'zh-CN');
      }
      if (state.bank.sort === 'duration') {
        const aDuration = parseInt(a.duration, 10) || Number.MAX_SAFE_INTEGER;
        const bDuration = parseInt(b.duration, 10) || Number.MAX_SAFE_INTEGER;
        return aDuration - bDuration || a.title.localeCompare(b.title, 'zh-CN');
      }
      return (a.id || '').localeCompare(b.id || '', 'zh-CN', { numeric: true });
    });
  }

  function getFilteredExams() {
    const keyword = state.bank.keyword.trim().toLowerCase();
    return sortExams(state.exams.filter((exam) => {
      const tags = exam.tags || [];
      const haystack = [
        exam.id,
        exam.title,
        exam.description,
        exam.category,
        exam.group,
        exam.series,
        tags.join(' ')
      ].join(' ').toLowerCase();
      const matchedKeyword = keyword === '' || haystack.includes(keyword);
      const matchedTag = state.bank.tag === '' || tags.includes(state.bank.tag);
      return matchedKeyword && matchedTag;
    }));
  }

  function renderExamCard(exam) {
    return `
      <article class="exam-card">
        <div class="card-head">
          <span class="exam-icon">${escapeHtml(exam.icon)}</span>
          <div>
            <h2>${escapeHtml(exam.title)}</h2>
            <div class="meta-row">
              <span class="pill">${escapeHtml(exam.questionCount)} 题</span>
              <span class="pill">${escapeHtml(exam.duration)}</span>
              <span class="pill">${escapeHtml(exam.difficulty)}</span>
            </div>
          </div>
        </div>
        <p>${escapeHtml(exam.description)}</p>
        <div class="tag-row">${(exam.tags || []).map((tag) => `<button class="tag-chip" type="button" data-filter-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join('')}</div>
        <div class="actions">
          <button class="primary" type="button" data-start="${escapeHtml(exam.id)}">开始自测</button>
        </div>
      </article>
    `;
  }

  function renderBank() {
    if (state.exams.length === 0) {
      views.home.innerHTML = '<div class="notice">还没有可用题库，请在 api/exam 目录新增 Markdown 文件。</div>';
      return;
    }

    const tags = getAllTags();
    const filtered = getFilteredExams();

    views.home.innerHTML = `
      <div class="page-header bank-header">
        <div>
          <h2>题库</h2>
          <p class="muted">共 ${filtered.length} / ${state.exams.length} 套题库，支持搜索、排序和标签筛选。</p>
        </div>
      </div>
      <section class="bank-toolbar">
        <label class="field search-field">
          <span>搜索</span>
          <input id="bankSearch" type="search" value="${escapeHtml(state.bank.keyword)}" placeholder="书名、系列、标签、描述">
        </label>
        <label class="field">
          <span>排序</span>
          <select id="bankSort">
            <option value="recommended" ${state.bank.sort === 'recommended' ? 'selected' : ''}>推荐顺序</option>
            <option value="title" ${state.bank.sort === 'title' ? 'selected' : ''}>标题 A-Z</option>
            <option value="questions-desc" ${state.bank.sort === 'questions-desc' ? 'selected' : ''}>题量从多到少</option>
            <option value="duration" ${state.bank.sort === 'duration' ? 'selected' : ''}>时长从短到长</option>
          </select>
        </label>
        <button type="button" data-clear-filters>清空</button>
      </section>
      <section class="tag-filter" aria-label="标签筛选">
        <button class="tag-chip ${state.bank.tag === '' ? 'active' : ''}" type="button" data-filter-tag="">全部</button>
        ${tags.map((tag) => `<button class="tag-chip ${state.bank.tag === tag ? 'active' : ''}" type="button" data-filter-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join('')}
      </section>
      ${filtered.length > 0 ? `<div class="exam-grid">${filtered.map(renderExamCard).join('')}</div>` : '<div class="notice">没有匹配的题库，请调整搜索词或标签。</div>'}
    `;
  }

  async function startExam(id, resumeProgress) {
    const payload = await requestJson('./api/detail.php?id=' + encodeURIComponent(id));
    const data = payload.data;
    state.paper = {
      id,
      title: data.metadata.title || id,
      description: data.metadata.description || '',
      duration: data.metadata.duration || '未知'
    };
    state.questions = data.questions || [];
    state.currentIndex = 0;
    state.answers = {};
    state.submitted = false;
    state.startTime = Date.now();

    if (resumeProgress) {
      state.currentIndex = resumeProgress.currentIndex || 0;
      state.answers = resumeProgress.answers || {};
      state.startTime = resumeProgress.startTime || Date.now();
    }

    navigateTo('exam/' + id);
    showView('exam');
    renderExam();
    persistProgress();
  }

  function renderExam() {
    const question = state.questions[state.currentIndex];
    if (!question) {
      views.exam.innerHTML = '<div class="notice">题库没有可答题目。</div>';
      return;
    }

    const reveal = state.submitted || state.mode === 'practice';
    const answeredCount = state.questions.filter(isAnswered).length;

    views.exam.innerHTML = `
      <article class="panel exam-header-panel">
        <div class="exam-titlebar">
          <div>
            <p class="eyebrow">${escapeHtml(state.paper.title)}</p>
            <h2 class="question-title">全部题目</h2>
          </div>
          <span class="progress-text">已答 ${answeredCount} / ${state.questions.length}</span>
        </div>
      </article>
      <div class="questions-list">
        ${state.questions.map((q, index) => {
          const userAnswer = getAnswer(q);
          const inputType = q.type === 'multiple' ? 'checkbox' : 'radio';
          return `
            <article class="question-card ${index === state.currentIndex ? 'question-card active-question' : ''}" data-question-index="${index}" id="question-${index}">
              <div class="question-card-header">
                <span class="question-number">${index + 1}</span>
                <span class="question-type">${q.type === 'multiple' ? '多选题' : '单选题'}</span>
              </div>
              <h3 class="question-card-text">${escapeHtml(q.question)}</h3>
              <div class="option-list">
                ${(q.options || []).map((option) => {
                  const checked = userAnswer.includes(option.key);
                  const isRight = canScore(q) && q.answer.includes(option.key);
                  const isWrong = reveal && checked && !isRight;
                  const statusClass = reveal && isRight ? ' correct' : isWrong ? ' wrong' : '';
                  return `
                    <label class="option${statusClass}">
                      <input type="${inputType}" name="answer-${index}" value="${escapeHtml(option.key)}" ${checked ? 'checked' : ''} ${state.submitted ? 'disabled' : ''}>
                      <span><strong>${escapeHtml(option.key)}.</strong> ${escapeHtml(option.text)}</span>
                    </label>
                  `;
                }).join('')}
              </div>
              ${reveal && q.analysis ? `<div class="analysis">${escapeHtml(q.analysis)}</div>` : ''}
              ${reveal && !canScore(q) ? '<div class="analysis">该题库未提供标准答案，当前只记录作答，不自动判分。</div>' : ''}
            </article>
          `;
        }).join('')}
      </div>
      <div class="exam-bottom-bar">
        <div class="sheet-grid">
          ${state.questions.map((item, index) => {
            const q = state.questions[index];
            const isActive = index === state.currentIndex;
            const isDone = isAnswered(q);
            return `<button class="sheet-button ${isActive ? 'active' : ''} ${isDone ? 'answered' : ''}" type="button" data-jump="${index}">${index + 1}</button>`;
          }).join('')}
        </div>
        <button class="primary" type="button" data-submit ${state.submitted ? 'disabled' : ''}>交卷</button>
      </div>
    `;
  }

  function updateAnswer(input) {
    const name = input.name;
    if (!name.startsWith('answer-')) {
      return;
    }
    const index = Number(name.replace('answer-', ''));
    const question = state.questions[index];
    if (!question || state.submitted) {
      return;
    }

    state.currentIndex = index;

    if (question.type === 'multiple') {
      const selected = Array.from(views.exam.querySelectorAll(`input[name="answer-${index}"]:checked`)).map((item) => item.value);
      state.answers[question.id] = selected;
    } else {
      state.answers[question.id] = [input.value];
    }

    persistProgress();

    const sheetButton = views.exam.querySelector(`button[data-jump="${index}"]`);
    if (sheetButton) {
      views.exam.querySelectorAll('.sheet-button').forEach((btn) => btn.classList.remove('active'));
      sheetButton.classList.add('active');
      sheetButton.classList.add('answered');
    }

    const activeCard = views.exam.querySelector('.question-card.active-question');
    if (activeCard) activeCard.classList.remove('active-question');
    const newCard = views.exam.querySelector(`.question-card[data-question-index="${index}"]`);
    if (newCard) newCard.classList.add('active-question');

    const answeredCount = state.questions.filter(isAnswered).length;
    const progressText = views.exam.querySelector('.progress-text');
    if (progressText) {
      progressText.textContent = `已答 ${answeredCount} / ${state.questions.length}`;
    }
  }

  function submitExam() {
    const unanswered = state.questions.filter((question) => !isAnswered(question)).length;
    if (unanswered > 0 && !confirm('还有 ' + unanswered + ' 道题未作答，确认交卷？')) {
      return;
    }

    state.submitted = true;
    clearProgress();
    navigateTo('result');
    renderResult();
  }

  function renderResult() {
    const scoredQuestions = state.questions.filter(canScore);
    const correct = scoredQuestions.filter(isCorrect).length;
    const total = scoredQuestions.length;
    const percent = total ? Math.round((correct / total) * 100) : 0;
    const usedMinutes = Math.max(1, Math.round((Date.now() - state.startTime) / 60000));

    showView('result');
    views.result.innerHTML = `
      <section class="result-panel">
        <p class="eyebrow">${escapeHtml(state.paper.title)}</p>
        <div class="score"><strong>${percent}</strong><span>分</span></div>
        <p class="muted">已答 ${state.questions.filter(isAnswered).length} / ${state.questions.length} 题，用时约 ${usedMinutes} 分钟，自动判分 ${total} 题。</p>
        <div class="toolbar">
          <button class="primary" type="button" data-restart>重新考试</button>
          <button type="button" data-back-home>返回题库</button>
        </div>
        <div class="review-list">
          ${state.questions.map((question, index) => {
            const user = getAnswer(question).join(', ') || '未作答';
            const right = canScore(question) ? question.answer.join(', ') : '未提供';
            const status = !canScore(question) ? 'muted' : isCorrect(question) ? 'success' : 'danger';
            const label = !canScore(question) ? '未判分' : isCorrect(question) ? '正确' : '错误';
            return `
              <article class="review-item">
                <h3>${index + 1}. ${escapeHtml(question.question)}</h3>
                <p class="${status}">${label}</p>
                <p>你的答案：${escapeHtml(user)}；参考答案：${escapeHtml(right)}</p>
                ${question.analysis ? `<p class="muted">${escapeHtml(question.analysis)}</p>` : ''}
              </article>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }

  // ---- Lightbox ----
  function showLightbox(src) {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
      <button class="lightbox-close" aria-label="关闭">&times;</button>
      <img src="${escapeHtml(src)}" alt="预览">
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    const overlay = document.querySelector('.lightbox-overlay');
    if (overlay) overlay.remove();
    document.body.style.overflow = '';
  }

  // ---- News ----
  const NEWS_CACHE_KEY = 'markdown_exam_news';
  const NEWS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  function getNewsFromCache() {
    try {
      const raw = localStorage.getItem(NEWS_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.time > NEWS_CACHE_DURATION) return null;
      return parsed.data;
    } catch {
      return null;
    }
  }

  function saveNewsToCache(data) {
    try {
      localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({ data, time: Date.now() }));
    } catch { /* ignore */ }
  }

  async function fetchNews() {
    const cached = getNewsFromCache();
    if (cached) {
      state.news.items = cached;
      return cached;
    }

    try {
      const response = await fetch('https://api.meiyoufan.com/tophub/');
      const json = await response.json();
      const items = (json.data && json.data.items) || [];
      saveNewsToCache(items);
      state.news.items = items;
      return items;
    } catch {
      return [];
    }
  }

  function formatNewsTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(Number(timestamp) * 1000);
    const now = new Date();
    const diff = Math.floor((now - date) / 60000);
    if (diff < 1) return '刚刚';
    if (diff < 60) return diff + ' 分钟前';
    if (diff < 1440) return Math.floor(diff / 60) + ' 小时前';
    return date.toLocaleDateString('zh-CN');
  }

  function renderNewsCard(item, index) {
    const hasThumbnail = item.thumbnail && item.thumbnail !== '';
    const hasLogo = item.logo && item.logo !== '';
    return `
      <article class="news-card"
        data-news-id="${escapeHtml(item.ID)}"
        data-news-url="${escapeHtml(item.url)}"
        data-news-title="${escapeHtml(item.title)}"
        data-news-site="${escapeHtml(item.sitename || '')}"
        data-news-extra="${escapeHtml(item.extra || '')}"
        data-news-time="${escapeHtml(item.time || '')}"
        data-news-logo="${escapeHtml(item.logo || '')}"
        data-news-thumbnail="${escapeHtml(item.thumbnail || '')}">
        <div class="news-card-main">
          <div class="news-card-info">
            <span class="news-rank ${index < 3 ? 'hot' : ''}">${index + 1}</span>
            <div class="news-card-meta">
              <h3 class="news-card-title">${escapeHtml(item.title)}</h3>
              <div class="news-card-badges">
                ${hasLogo ? `<img class="news-logo" src="${escapeHtml(item.logo)}" alt="${escapeHtml(item.sitename)}" width="14" height="14">` : ''}
                <span class="news-site">${escapeHtml(item.sitename || '')}</span>
                ${item.extra ? `<span class="news-extra">${escapeHtml(item.extra)}</span>` : ''}
                ${item.time ? `<span class="news-time">${formatNewsTime(item.time)}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
        ${hasThumbnail ? `<div class="news-card-thumb" data-lightbox="${escapeHtml(item.thumbnail)}">
          <img src="${escapeHtml(item.thumbnail)}" alt="${escapeHtml(item.title)}" loading="lazy">
        </div>` : ''}
        <div class="news-card-actions">
          <a class="news-direct-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener" data-direct>直接跳转</a>
        </div>
      </article>
    `;
  }

  function getFilteredNews(items) {
    const keyword = state.news.keyword.trim().toLowerCase();
    const site = state.news.site;
    const sort = state.news.sort;

    let filtered = items.filter((item) => {
      const matchedKeyword = keyword === '' || (item.title || '').toLowerCase().includes(keyword) || (item.sitename || '').toLowerCase().includes(keyword);
      const matchedSite = site === '' || item.sitename === site;
      return matchedKeyword && matchedSite;
    });

    if (sort === 'time') {
      filtered.sort((a, b) => (Number(b.time) || 0) - (Number(a.time) || 0));
    } else if (sort === 'heat') {
      filtered.sort((a, b) => {
        const parseHeat = (v) => {
          const extra = v.extra || '';
          const m = extra.match(/(\d+(?:\.\d+)?)/);
          const num = m ? Number(m[1]) : 0;
          return extra.includes('万') ? num : num;
        };
        return parseHeat(b) - parseHeat(a);
      });
    }

    return filtered;
  }

  function getUniqueNewsSites(items) {
    const sites = new Map();
    items.forEach((item) => {
      const name = item.sitename || '';
      if (name && !sites.has(name)) {
        sites.set(name, item.logo || '');
      }
    });
    return Array.from(sites.entries()).map(([name, logo]) => ({ name, logo }));
  }

  async function renderNews() {
    views.news.innerHTML = `
      <div class="page-header news-header">
        <div>
          <h2>热搜</h2>
          <p class="muted">全网热点聚合，每 10分钟自动刷新。</p>
        </div>
        <button type="button" data-refresh-news>刷新</button>
      </div>
      <section class="news-toolbar" id="newsToolbar">
        <label class="field search-field">
          <span>搜索</span>
          <input id="newsSearch" type="search" value="${escapeHtml(state.news.keyword)}" placeholder="标题、来源">
        </label>
        <label class="field">
          <span>排序</span>
          <select id="newsSort">
            <option value="default" ${state.news.sort === 'default' ? 'selected' : ''}>默认排序</option>
            <option value="time" ${state.news.sort === 'time' ? 'selected' : ''}>时间排序</option>
            <option value="heat" ${state.news.sort === 'heat' ? 'selected' : ''}>热度排序</option>
          </select>
        </label>
        <button type="button" data-clear-news>清空</button>
      </section>
      <div class="news-loading" id="newsLoading">
        <div class="loading-spinner"></div>
        <p>正在加载热点...</p>
      </div>
      <div class="news-grid hidden" id="newsGrid"></div>
    `;

    const items = await fetchNews();

    // Build site chips
    const sites = getUniqueNewsSites(items);

    // Insert site filter chips after toolbar
    const toolbar = document.getElementById('newsToolbar');
    if (toolbar && sites.length > 0) {
      const chipContainer = document.createElement('div');
      chipContainer.className = 'tag-filter';
      chipContainer.setAttribute('aria-label', '来源筛选');
      chipContainer.innerHTML = sites.map((s) =>
        `<button class="tag-chip ${state.news.site === s.name ? 'active' : ''}" type="button" data-news-site="${escapeHtml(s.name)}">${escapeHtml(s.name)}</button>`
      ).join('');
      toolbar.after(chipContainer);
    }

    const grid = document.getElementById('newsGrid');
    const loading = document.getElementById('newsLoading');

    if (loading) loading.classList.add('hidden');

    // Render filtered results
    if (grid) {
      const filtered = getFilteredNews(items);
      if (filtered.length === 0) {
        grid.innerHTML = '<div class="notice">没有匹配的结果，请调整筛选条件。</div>';
      } else {
        grid.innerHTML = filtered.map((item, index) => renderNewsCard(item, index));
      }
      grid.classList.remove('hidden');
    }
  }

  function truncateUrl(url) {
    try {
      const u = new URL(url);
      const path = u.pathname === '/' ? '' : u.pathname;
      return u.hostname + path;
    } catch {
      return url.length > 60 ? url.substring(0, 60) + '…' : url;
    }
  }

  function updateMetaDescription(content) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = content || '51吃瓜 MarkdownExam 在线题库自测平台，全网热点聚合。';
  }

  // ---- About page ----
  function renderAbout() {
    views.about.innerHTML = `
      <div class="page-header">
        <h2>关于我们</h2>
        <p class="muted">了解 51吃瓜（51chigua）MarkdownExam 项目。</p>
      </div>
      <div class="about-content">
        <h3>51吃瓜 · MarkdownExam</h3>
        <p>一个基于 Markdown 的在线题库自测与热点聚合平台，由 51吃瓜（51chigua）驱动。题库内容使用 Markdown 格式编写，通过简单的解析器转换为在线测试。</p>
        <h3>功能特点</h3>
        <ul>
          <li>支持单选/多选题型</li>
          <li>考试模式与练习模式切换</li>
          <li>暗色/亮色主题切换</li>
          <li>进度本地保存，支持续答</li>
          <li>URL 路由记录，支持浏览器前进/后退</li>
          <li>全部题目一览作答</li>
        </ul>
      </div>
    `;
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const lightbox = document.querySelector('.lightbox-overlay');
      if (lightbox) {
        closeLightbox();
        return;
      }
    }
  });

  // ---- Global image error fallback (capture phase) ----
  document.addEventListener('error', (event) => {
    const img = event.target;
    if (img.tagName !== 'IMG') return;
    event.stopPropagation();

    if (img.classList.contains('news-logo') || img.closest('.redirect-info')) {
      img.style.display = 'none';
      return;
    }

    const thumb = img.closest('.news-card-thumb, .redirect-image, .lightbox-overlay');
    if (thumb) {
      img.style.display = 'none';
      if (thumb.classList.contains('news-card-thumb') || thumb.classList.contains('redirect-image')) {
        if (!thumb.querySelector('.img-fallback')) {
          const fallback = document.createElement('div');
          fallback.className = 'img-fallback';
          thumb.appendChild(fallback);
        }
      }
    } else {
      img.style.display = 'none';
    }
  }, true);

  document.addEventListener('click', (event) => {
    // ---- Lightbox image click ----
    const lightboxTarget = event.target.closest('[data-lightbox]');
    if (lightboxTarget && !event.target.closest('[data-direct]')) {
      event.stopPropagation();
      showLightbox(lightboxTarget.dataset.lightbox);
      return;
    }

    // ---- News card click (not direct button, not lightbox) ----
    const newsCard = event.target.closest('.news-card');
    if (newsCard && !event.target.closest('[data-direct]') && !event.target.closest('[data-lightbox]')) {
      const targetUrl = newsCard.dataset.newsUrl || '';
      const params = new URLSearchParams();
      params.set('id', newsCard.dataset.newsId || '');
      params.set('title', newsCard.dataset.newsTitle || '');
      params.set('site', newsCard.dataset.newsSite || '');
      params.set('extra', newsCard.dataset.newsExtra || '');
      params.set('time', newsCard.dataset.newsTime || '');
      params.set('logo', newsCard.dataset.newsLogo || '');
      params.set('thumbnail', newsCard.dataset.newsThumbnail || '');
      params.set('url', btoa(unescape(encodeURIComponent(targetUrl))));
      window.location.href = 'redirect.html?' + params.toString();
      return;
    }

    // ---- Lightbox close ----
    if (event.target.matches('.lightbox-overlay') || event.target.matches('.lightbox-close')) {
      closeLightbox();
      return;
    }

    const target = event.target.closest('button');
    if (!target) {
      return;
    }

    if (target.dataset.refreshNews !== undefined) {
      // Force refresh news
      try { localStorage.removeItem(NEWS_CACHE_KEY); } catch { /* ignore */ }
      renderNews();
      return;
    }

    if (target.dataset.newsSite !== undefined) {
      state.news.site = target.dataset.newsSite;
      renderNews();
      return;
    }

    if (target.dataset.clearNews !== undefined) {
      state.news.keyword = '';
      state.news.site = '';
      state.news.sort = 'default';
      renderNews();
      return;
    }

    if (target.dataset.mode !== undefined) {
      state.mode = target.dataset.mode;
      localStorage.setItem('markdown_exam_mode', state.mode);
      syncModeTabs();
      if (state.paper && !state.submitted) {
        persistProgress();
        renderExam();
      }
      return;
    }

    if (target.dataset.start) {
      startExam(target.dataset.start).catch((error) => {
        views.home.innerHTML = '<div class="notice danger">' + escapeHtml(error.message) + '</div>';
      });
    } else if (target.dataset.filterTag !== undefined) {
      state.bank.tag = target.dataset.filterTag;
      navigateTo('bank');
      showView('home');
      renderBank();
      setActiveNav('bank');
    } else if (target.dataset.bankSeries) {
      state.bank.keyword = target.dataset.bankSeries;
      state.bank.tag = '';
      navigateTo('bank');
      showView('home');
      renderBank();
      setActiveNav('bank');
    } else if (target.dataset.clearFilters !== undefined) {
      state.bank.keyword = '';
      state.bank.tag = '';
      state.bank.sort = 'recommended';
      renderBank();
    } else if (target.dataset.jump !== undefined) {
      const jumpIndex = Number(target.dataset.jump);
      state.currentIndex = jumpIndex;
      persistProgress();
      renderExam();

      setTimeout(() => {
        const el = document.getElementById('question-' + jumpIndex);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    } else if (target.dataset.submit !== undefined) {
      submitExam();
    } else if (target.dataset.restart !== undefined) {
      startExam(state.paper.id).catch(console.error);
    } else if (target.dataset.backHome !== undefined) {
      navigateTo('bank');
      showView('home');
      renderBank();
      setActiveNav('bank');
    }
  });

  document.addEventListener('input', (event) => {
    if (event.target.id === 'bankSearch') {
      state.bank.keyword = event.target.value;
      renderBank();
      const input = document.getElementById('bankSearch');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
    if (event.target.id === 'newsSearch') {
      state.news.keyword = event.target.value;
      if (state.news.items.length > 0) {
        const grid = document.getElementById('newsGrid');
        if (grid) {
          const filtered = getFilteredNews(state.news.items);
          grid.innerHTML = filtered.length > 0 ? filtered.map((item, index) => renderNewsCard(item, index)).join('') : '<div class="notice">没有匹配的结果，请调整筛选条件。</div>';
        }
      }
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.id === 'bankSort') {
      state.bank.sort = event.target.value;
      renderBank();
    }
    if (event.target.id === 'newsSort') {
      state.news.sort = event.target.value;
      if (state.news.items.length > 0) {
        const grid = document.getElementById('newsGrid');
        if (grid) {
          const filtered = getFilteredNews(state.news.items);
          grid.innerHTML = filtered.length > 0 ? filtered.map((item, index) => renderNewsCard(item, index)).join('') : '<div class="notice">没有匹配的结果，请调整筛选条件。</div>';
        }
      }
    }
  });

  views.exam.addEventListener('change', (event) => {
    if (event.target.matches('input[name^="answer-"]')) {
      updateAnswer(event.target);
    }
  });

  function syncModeTabs() {
    document.querySelectorAll('.mode-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === state.mode);
    });
  }
  syncModeTabs();

  themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });

  setTheme(localStorage.getItem('markdown_exam_theme') || 'light');

  // Initialize route
  if (window.location.hash) {
    handleRoute(window.location.hash);
  } else {
    navigateTo('/', true);
  }
  loadExams();
}());
