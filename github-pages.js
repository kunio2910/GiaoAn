(function () {
  const storageKey = 'giaoan-child-plans-v3';
  const themeStorageKey = 'giaoan-theme';
  let weekLabels = ['Tuần 1 - 2', 'Tuần 3 - 4', 'Tuần 5 - 6', 'Tuần 7 - 8'];
  const statuses = ['Đạt', 'Manh nha', 'Chưa đạt'];
  let domains = ['Tương tác xã hội', 'Chú ý chung', 'Giao tiếp', 'Kỹ năng tự phục vụ'];
  const domainIconOptions = [
    { value: 'group', label: 'Cùng nhau', tone: 'violet' },
    { value: 'target', label: 'Mục tiêu', tone: 'blue' },
    { value: 'eye', label: 'Chú ý', tone: 'teal' },
    { value: 'children', label: 'Trẻ em', tone: 'orange' },
    { value: 'calendar', label: 'Thói quen', tone: 'pink' },
    { value: 'note', label: 'Giao tiếp', tone: 'green' },
    { value: 'overview', label: 'Khám phá', tone: 'indigo' },
    { value: 'plan', label: 'Học tập', tone: 'yellow' },
    { value: 'heart', label: 'Cảm xúc', tone: 'pink' },
    { value: 'star', label: 'Tiến bộ', tone: 'yellow' },
    { value: 'puzzle', label: 'Kỹ năng', tone: 'indigo' },
    { value: 'music', label: 'Âm nhạc', tone: 'teal' },
    { value: 'brain', label: 'Tư duy', tone: 'blue' },
    { value: 'hand', label: 'Vận động', tone: 'orange' }
  ];
  const defaultDomainIcons = { 'Tương tác xã hội': 'group', 'Chú ý chung': 'eye', 'Giao tiếp': 'note', 'Kỹ năng tự phục vụ': 'children' };
  const scheduleColorOptions = [
    { value: 'blue', label: 'Xanh dương' },
    { value: 'purple', label: 'Tím' },
    { value: 'teal', label: 'Xanh ngọc' },
    { value: 'orange', label: 'Cam' },
    { value: 'pink', label: 'Hồng' },
    { value: 'green', label: 'Xanh lá' }
  ];
  const teachingDayLabels = { 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7', 7: 'Chủ nhật' };
  const defaults = {
    evaluationPeriods: [...weekLabels],
    evaluationPeriodsByChild: {},
    domains: [...domains],
    domainIcons: { ...defaultDomainIcons },
    collapsedGoalIds: [],
    children: [],
    goals: []
  };
  const loaded = (() => { try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; } })();
  const normalizePeriods = (value, fallback = weekLabels) => {
    const periods = Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : [];
    return periods.length ? periods : [...fallback];
  };
  const initialChildren = Array.isArray(loaded?.children) ? loaded.children : defaults.children;
  const legacyPeriods = normalizePeriods(loaded?.evaluationPeriods || defaults.evaluationPeriods);
  const rawPeriodsByChild = loaded?.evaluationPeriodsByChild && typeof loaded.evaluationPeriodsByChild === 'object' ? loaded.evaluationPeriodsByChild : {};
  const initialPeriodsByChild = Object.fromEntries(initialChildren.map((child) => [String(child.id), normalizePeriods(rawPeriodsByChild[String(child.id)], legacyPeriods)]));
  const state = { ...(loaded && typeof loaded === 'object' ? loaded : {}), evaluationPeriods: legacyPeriods, evaluationPeriodsByChild: initialPeriodsByChild, domains: loaded?.domains || defaults.domains, domainIcons: { ...defaultDomainIcons, ...(loaded?.domainIcons || {}) }, collapsedGoalIds: Array.isArray(loaded?.collapsedGoalIds) ? loaded.collapsedGoalIds : [], planNewOpenDomainsByChild: loaded?.planNewOpenDomainsByChild && typeof loaded.planNewOpenDomainsByChild === 'object' ? loaded.planNewOpenDomainsByChild : {}, planNewOpenDomains: loaded?.planNewOpenDomains && typeof loaded.planNewOpenDomains === 'object' ? loaded.planNewOpenDomains : {}, children: initialChildren, goals: loaded?.goals || defaults.goals, selectedChildId: initialChildren[0]?.id || 0, view: 'plan-new' };
  let planNewOpenDomains = state.planNewOpenDomainsByChild?.[String(state.selectedChildId)] || state.planNewOpenDomains || {};
  let planNewSearch = '';
  let planNewFilter = '';
  let planNewPendingDomain = '';
  const planNewHiddenDomainsStorageKey = 'giaoan-plan-new-hidden-domains';
  let planNewHiddenDomainsByChild = (() => { try { const parsed = JSON.parse(localStorage.getItem(planNewHiddenDomainsStorageKey) || '{}'); return parsed && typeof parsed === 'object' ? parsed : {}; } catch { return {}; } })();
  const hiddenPlanNewDomainsForChild = (childId) => Array.isArray(planNewHiddenDomainsByChild[String(childId)]) ? planNewHiddenDomainsByChild[String(childId)] : [];
  const persistPlanNewHiddenDomains = () => localStorage.setItem(planNewHiddenDomainsStorageKey, JSON.stringify(planNewHiddenDomainsByChild));
  const periodsForChild = (childId) => normalizePeriods(state.evaluationPeriodsByChild?.[String(childId)], state.evaluationPeriods || weekLabels);
  const setPeriodsForChild = (childId, periods) => {
    const nextPeriods = normalizePeriods(periods);
    state.evaluationPeriodsByChild = { ...(state.evaluationPeriodsByChild || {}), [String(childId)]: nextPeriods };
    if (Number(childId) === Number(state.selectedChildId)) {
      state.evaluationPeriods = [...nextPeriods];
      weekLabels = [...nextPeriods];
    }
  };
  weekLabels = periodsForChild(state.selectedChildId);
  domains = state.domains;
  const childNameSlug = (name) => String(name ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const shareChildSlug = (() => { const value = new URLSearchParams(window.location.search).get('share'); return value?.trim().toLowerCase() || null; })();
  const shareMode = shareChildSlug !== null;
  let darkMode = localStorage.getItem(themeStorageKey) === 'dark';
  const defaultShortGoals = ['Ngồi tại bàn 2–3 phút.', 'Ngồi học 5 phút.', 'Duy trì hoạt động 10 phút (có đổi trò chơi).'];
  const defaultLongTerm = 'Duy trì tương tác với giáo viên 5–10 phút';
  let draftShortGoals = [...defaultShortGoals];
  let draftLongTerm = defaultLongTerm;
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const icon = (name, className = '') => `<svg class="${className}"><use href="#icon-${name}"></use></svg>`;
  const domainIconOption = (value) => domainIconOptions.find((option) => option.value === value) || domainIconOptions[0];
  const domainIconBadge = (value, size = '') => { const option = domainIconOption(value); return `<span class="domain-icon-badge ${option.tone}">${icon(option.value, size ? `icon-${size}` : '')}</span>`; };
  const domainIconPicker = (selected, action = 'select-domain-icon') => `<div class="domain-icon-picker" role="group" aria-label="Chọn icon lĩnh vực">${domainIconOptions.map((option) => `<button type="button" class="domain-icon-choice ${option.value === selected ? 'selected' : ''}" data-action="${action}" data-domain-icon="${option.value}" aria-label="${option.label}" title="${option.label}">${domainIconBadge(option.value)}</button>`).join('')}</div>`;
  const initials = (name) => String(name).split(' ').map((part) => part[0]).slice(-2).join('');
  const persistentData = () => {
    const data = { ...state };
    delete data.view;
    delete data.selectedChildId;
    return data;
  };
  const persist = () => {
    const data = persistentData();
    localStorage.setItem(storageKey, JSON.stringify(data));
    if (window.GiaoAnCloud) {
      window.GiaoAnCloud.save(data).catch((error) => {
        console.error('Không thể đồng bộ dữ liệu lên Google Sheet:', error);
      });
    }
  };
  const childById = (id) => state.children.find((child) => child.id === Number(id));
  const selectedChild = () => childById(state.selectedChildId) || state.children[0];
  const childChoiceButtons = (label, action) => `<div class="child-choice-field"><span class="field-label">${label}</span><div class="child-choice-buttons" role="group" aria-label="${label}">${state.children.map((child) => `<button type="button" class="child-choice-button ${child.id === state.selectedChildId ? 'selected' : ''}" data-child-choice="${action}" data-child-id="${child.id}" aria-pressed="${child.id === state.selectedChildId}"><span class="child-choice-avatar">${esc(initials(child.name))}</span><span>${esc(child.name)}</span></button>`).join('')}</div></div>`;
  const childShareUrl = (childName) => { const url = new URL(window.location.href); url.search = ''; url.hash = ''; url.searchParams.set('share', childNameSlug(childName)); return url.toString(); };
  const copyChildShareLink = (childId) => { const child = childById(childId); if (!child) return; const url = childShareUrl(child.name); const fallback = () => window.prompt(`Đường dẫn chia sẻ của ${child.name}`, url); if (!navigator.clipboard?.writeText) { fallback(); return; } navigator.clipboard.writeText(url).then(() => window.alert(`Đã sao chép đường dẫn của ${child.name}.`)).catch(fallback); };
  function applyTheme() {
    document.documentElement.classList.toggle('dark-mode', darkMode);
    localStorage.setItem(themeStorageKey, darkMode ? 'dark' : 'light');
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      toggle.setAttribute('aria-label', darkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối');
      toggle.innerHTML = `${icon(darkMode ? 'sun' : 'moon')}<span>${darkMode ? 'Giao diện sáng' : 'Giao diện tối'}</span>`;
    }
    const settingsToggle = document.querySelector('[data-theme-toggle]');
    if (settingsToggle) settingsToggle.checked = darkMode;
  }
  function setTheme(value) { darkMode = value; applyTheme(); }

  function header(title, subtitle, action) {
    return `<header class="topbar"><div class="topbar-title"><div><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div></div>${action || ''}</header>`;
  }
  function button(label, action, primary = false) { return `<button type="button" class="button ${primary ? 'primary' : ''}" data-action="${action}">${label}</button>`; }
  function avatar(child, small = false) { return `<div class="child-avatar ${small ? 'small' : ''}"><span>${esc(initials(child.name))}</span></div>`; }
  function selectField(label, id, options, selected, extra = '') { return `<label class="field"><span>${label}</span><div class="select-wrap"><select id="${id}" ${extra}>${options.map((option) => `<option value="${esc(option.value ?? option)}" ${String(option.value ?? option) === String(selected) ? 'selected' : ''}>${esc(option.label ?? option)}</option>`).join('')}</select>${icon('chevron')}</div></label>`; }

  function decorateNotes() {
    document.querySelectorAll('.row-note').forEach((cell) => {
      const select = cell.closest('tr')?.querySelector('[data-goal-id]');
      const goal = select && state.goals.find((item) => item.id === Number(select.dataset.goalId));
      if (goal?.note && !cell.querySelector('.note-content')) cell.insertAdjacentHTML('beforeend', `<span class="note-content" title="${esc(goal.note)}">${esc(goal.note)}</span>`);
    });
  }

  const tableAdd = (label, action) => `<button type="button" class="table-add-button" data-action="${action}">${icon('plus')}${label}</button>`;
  const statusMarkup = (status, goalId, periodIndex, readOnly) => readOnly ? `<div class="status-readonly ${status === 'Đạt' ? 'achieved' : status === 'Manh nha' ? 'emerging' : 'not-achieved'}"><span class="status-dot"></span><span>${esc(status)}</span></div>` : `<label class="status-select ${status === 'Đạt' ? 'achieved' : status === 'Manh nha' ? 'emerging' : 'not-achieved'}"><span class="status-dot"></span><select data-goal-id="${goalId}" data-week="${periodIndex}">${statuses.map((item) => `<option ${item === status ? 'selected' : ''}>${item}</option>`).join('')}</select>${icon('chevron')}</label>`;
  function renderGoalsBoard(goals, childId = state.selectedChildId) {
    const periods = periodsForChild(childId);
    const cards = goals.map((goal) => {
      const shortGoals = goal.shortTerm?.length ? goal.shortTerm.map((item, shortIndex) => `<div class="short-goal-row"><span class="short-goal-bullet"></span><span class="short-goal-text">${esc(item || 'Chưa nhập mục tiêu')}</span><span class="short-goal-actions"><button type="button" class="row-action edit" data-action="edit-short" data-goal-id="${goal.id}" data-short-index="${shortIndex}" aria-label="Sửa mục tiêu ngắn hạn">${icon('edit')}</button><button type="button" class="row-action delete" data-action="delete-short" data-goal-id="${goal.id}" data-short-index="${shortIndex}" aria-label="Xóa mục tiêu ngắn hạn">${icon('trash')}</button></span></div>`).join('') : '<p class="muted-copy">Chưa có mục tiêu ngắn hạn.</p>';
      const searchText = esc(`${goal.domain || ''} ${goal.longTerm || ''} ${(goal.shortTerm || []).join(' ')}`.toLowerCase());
      return `<article class="goal-card" data-goal-card data-search="${searchText}"><header class="goal-card-header"><div class="goal-domain-heading"><span class="goal-domain-icon">${icon(domainIconOption(state.domainIcons?.[goal.domain] || defaultDomainIcons[goal.domain]).value)}</span><div><span class="goal-card-eyebrow">Lĩnh vực</span><h3>${esc(goal.domain || 'Chưa phân loại')}</h3></div></div><div class="goal-card-actions"><button type="button" class="goal-card-action edit" data-action="edit-long" data-goal-id="${goal.id}">${icon('edit')}Sửa</button><button type="button" class="goal-card-action delete" data-action="delete-goal" data-goal-id="${goal.id}">${icon('trash')}Xóa</button><button type="button" class="goal-card-note-button" data-action="open-note" data-goal-id="${goal.id}" aria-label="Ghi chú mục tiêu">${icon('note')}</button></div></header><div class="goal-card-main"><section class="goal-long-section"><div class="goal-card-section-head"><h4>Mục tiêu dài hạn</h4><button type="button" class="outline-button compact goal-long-add-button" data-action="add-long" aria-label="Thêm mục tiêu dài hạn">${icon('plus')}Thêm</button></div><p>${esc(goal.longTerm || 'Chưa nhập mục tiêu')}</p><button type="button" class="text-action" data-action="edit-long" data-goal-id="${goal.id}">${icon('edit')}Chỉnh sửa mục tiêu dài hạn</button></section><section class="goal-short-section"><div class="goal-card-section-head"><h4>Mục tiêu ngắn hạn</h4><button type="button" class="outline-button compact" data-action="add-short" data-goal-id="${goal.id}">${icon('plus')}Thêm</button></div><div class="short-goal-list">${shortGoals}</div></section></div><section class="goal-results-section"><div class="goal-card-section-head"><div><h4>Kết quả theo tuần</h4><p>Cập nhật trạng thái trực tiếp theo từng giai đoạn.</p></div><button type="button" class="outline-button compact" data-action="add-period">${icon('plus')}Thêm thời gian</button></div><div class="goal-period-grid">${periods.map((label, periodIndex) => `<div class="goal-period"><div class="goal-period-label-row"><span class="goal-period-label">${esc(label)}</span><span class="period-actions"><button type="button" class="period-action" data-action="edit-period" data-goal-id="${goal.id}" data-period-index="${periodIndex}" aria-label="Sửa kết quả ${esc(label)}">${icon('edit')}</button><button type="button" class="period-action delete" data-action="delete-period" data-period-index="${periodIndex}" aria-label="Xóa mốc ${esc(label)}">${icon('trash')}</button></span></div>${statusMarkup(goal.statuses?.[periodIndex] || 'Chưa đạt', goal.id, periodIndex, false)}</div>`).join('')}</div></section><footer class="goal-card-footer"><div><h4>Ghi chú</h4><p>${goal.note ? esc(goal.note) : '<span class="cell-placeholder">Chưa có ghi chú.</span>'}</p></div><button type="button" class="note-edit-button" data-action="open-note" data-goal-id="${goal.id}">${icon('note')}${goal.note ? 'Chỉnh sửa ghi chú' : 'Thêm ghi chú'}</button></footer></article>`;
    }).join('');
    const empty = `<div class="board-empty-state"><span class="board-empty-icon">${icon('target')}</span><strong>Chưa có mục tiêu phát triển</strong><span>Bắt đầu bằng cách thêm lĩnh vực hoặc mục tiêu dài hạn.</span><button type="button" class="button primary" data-action="add-long">${icon('plus')}Thêm mục tiêu</button></div>`;
    return `<div class="goals-board"><div class="board-toolbar"><div class="board-search">${icon('overview')}<input type="search" data-goal-search placeholder="Tìm kiếm lĩnh vực, mục tiêu..." aria-label="Tìm kiếm mục tiêu" /></div><span class="board-summary"><strong data-board-count>${goals.length}</strong> mục tiêu đang theo dõi</span><div class="board-actions"><button type="button" class="button board-secondary-action" data-action="add-domain">${icon('plus')}Thêm lĩnh vực</button></div></div><div class="goal-card-list" data-goal-card-list>${cards || empty}</div><div class="board-footer"><span>Hiển thị <strong data-board-footer-count>${goals.length}</strong> mục tiêu</span><span class="board-footer-hint">Mẹo: dùng nút Sửa/Xóa ngay trên từng thẻ để thao tác nhanh.</span></div></div>`;
  }
  function renderGoalsTable(goals, readOnly = false, childId = state.selectedChildId) {
    if (!readOnly) return renderGoalsBoard(goals, childId);
    goals = [...new Set(goals.map((goal) => goal.domain))].flatMap((domain) => goals.filter((goal) => goal.domain === domain));
    const periods = periodsForChild(childId);
    const counts = goals.reduce((result, goal) => { result[goal.domain] = (result[goal.domain] || 0) + 1; return result; }, {});
    const rows = goals.map((goal, index) => {
      const first = index === 0 || goals[index - 1].domain !== goal.domain;
      const domainCell = first ? `<td class="domain-cell" rowspan="${counts[goal.domain]}"><span class="domain-icon">${icon(domainIconOption(state.domainIcons?.[goal.domain] || defaultDomainIcons[goal.domain]).value)}</span><strong>${esc(goal.domain || 'Chưa phân loại')}</strong></td>` : '';
      const longActions = readOnly ? '' : `<div class="goal-inline-actions"><button type="button" class="goal-edit-button" data-action="edit-long" data-goal-id="${goal.id}">${icon('edit')}Sửa</button><button type="button" class="goal-delete-button" data-action="delete-goal" data-goal-id="${goal.id}">${icon('trash')}Xóa</button></div>`;
      const shortItems = goal.shortTerm?.length ? goal.shortTerm.map((item, shortIndex) => `<li><span>${esc(item || 'Chưa nhập mục tiêu')}</span>${readOnly ? '' : `<span class="goal-inline-actions"><button type="button" class="goal-edit-button" data-action="edit-short" data-goal-id="${goal.id}" data-short-index="${shortIndex}">${icon('edit')}Sửa</button><button type="button" class="goal-delete-button" data-action="delete-short" data-goal-id="${goal.id}" data-short-index="${shortIndex}">${icon('trash')}Xóa</button></span>`}</li>`).join('') : `<li class="cell-placeholder">Chưa có mục tiêu ngắn hạn</li>`;
      const note = readOnly ? `<span class="note-icon-display">${icon('note')}</span>${goal.note ? `<span class="note-content" title="${esc(goal.note)}">${esc(goal.note)}</span>` : '<span class="cell-placeholder">Chưa có ghi chú</span>'}` : `<button type="button" aria-label="Ghi chú mục tiêu" data-action="open-note" data-goal-id="${goal.id}">${icon('note')}</button>`;
      return `<tr>${domainCell}<td class="long-term-cell"><div>${esc(goal.longTerm || 'Chưa nhập mục tiêu')}</div>${longActions}</td><td class="short-term-cell"><ul>${shortItems}</ul></td>${periods.map((_, periodIndex) => `<td class="result-cell">${statusMarkup(goal.statuses?.[periodIndex] || 'Chưa đạt', goal.id, periodIndex, readOnly)}</td>`).join('')}<td class="row-note">${note}</td></tr>`;
    }).join('');
    const periodHeaders = periods.map((label) => `<th>${esc(label)}</th>`).join('');
    const body = rows || `<tr><td colspan="${periods.length + 4}"><div class="table-empty-state">${icon('target')}<strong>Chưa có mục tiêu phát triển</strong><span>Nhấn “Thêm” để bắt đầu tạo mục tiêu cho trẻ.</span></div></td></tr>`;
    const colgroup = `<colgroup><col class="goal-col-domain"><col class="goal-col-long"><col class="goal-col-short">${periods.map(() => '<col class="goal-col-period">').join('')}<col class="goal-col-note"></colgroup>`;
    return `<div class="table-scroll"><table class="goals-table">${colgroup}<thead><tr><th><div class="table-head-title">LĨNH VỰC${readOnly ? '' : tableAdd('Thêm', 'add-domain')}</div></th><th><div class="table-head-title">MỤC TIÊU DÀI HẠN${readOnly ? '' : tableAdd('Thêm', 'add-long')}</div></th><th><div class="table-head-title">MỤC TIÊU NGẮN HẠN${readOnly ? '' : tableAdd('Thêm', 'add-short')}</div></th><th colspan="${periods.length}"><div class="table-head-title">KẾT QUẢ${readOnly ? '' : tableAdd('Thêm', 'add-period')}</div></th><th>GHI CHÚ</th></tr><tr class="period-header"><th></th><th></th><th></th>${periodHeaders}<th></th></tr></thead><tbody>${body}</tbody></table><div class="table-footer"><span>Hiển thị ${goals.length} mục tiêu</span><div class="pagination"><button type="button" disabled>|‹</button><button type="button" disabled>‹</button><button type="button" class="active">1</button><button type="button" disabled>›</button><button type="button" disabled>›|</button></div></div></div>`;
  }

  const defaultPlanInfo = { planner: 'Nguyễn Thị Vành Khuyên', planDate: '30/06/2026', evaluationDates: '30/07/2026 và 30/08/2026' };
  const getPlanInfo = (child) => ({ ...defaultPlanInfo, ...(child?.planInfo || {}) });
  function childSummaryMarkup(child, editable = true) {
    const info = getPlanInfo(child);
    return `<section class="child-summary">${avatar(child)}<div class="summary-name"><strong>${esc(child.name)}</strong><span>${icon('calendar')}Ngày sinh: ${esc(child.birthday)}</span><span>${icon('user')}Tuổi thực: 1 tuổi 11 tháng</span></div><div class="summary-meta"><span>${icon('user')}Người lập kế hoạch: ${esc(info.planner)}</span><span>${icon('calendar')}Ngày lập kế hoạch: ${esc(info.planDate)}</span>${editable ? `<button type="button" class="summary-edit-button" data-action="edit-plan-info">${icon('edit')}Chỉnh sửa thông tin</button>` : ''}</div><div class="evaluation-summary"><strong>${icon('calendar')}Thông tin lượng giá</strong><span>Ngày lượng giá:</span><b>${esc(info.evaluationDates)}</b></div></section>`;
  }
  function renderSharePage() {
    const main = $('.main-content');
    const child = state.children.find((item) => childNameSlug(item.name) === shareChildSlug);
    if (!child) { main.innerHTML = `<div class="share-page"><div class="share-loading"><strong>Không tìm thấy hồ sơ</strong><span>Đường dẫn có thể đã hết hiệu lực hoặc hồ sơ không tồn tại.</span></div></div>`; return; }
    const goals = state.goals.filter((goal) => goal.childId === child.id);
    const achieved = goals.reduce((total, goal) => total + (goal.statuses || []).filter((status) => status === 'Đạt').length, 0);
    main.innerHTML = `<div class="share-page"><div class="share-container"><header class="share-header"><div class="share-brand"><span class="share-brand-mark">${icon('target')}</span><div><strong>KẾ HOẠCH GIÁO DỤC</strong><small>Trang chia sẻ hồ sơ trẻ</small></div></div><span class="share-readonly">${icon('file')}Chỉ xem</span></header><section class="share-hero"><span class="share-eyebrow">HỒ SƠ TRẺ</span><h1>${esc(child.name)}</h1><p>Thông tin kế hoạch giáo dục được chia sẻ riêng cho hồ sơ này.</p></section>${childSummaryMarkup(child, false)}<div class="share-summary"><span><strong>${goals.length}</strong> mục tiêu đang theo dõi</span><span><strong>${achieved}</strong> kết quả đạt</span></div><section class="share-goals overview-goals-panel"><div class="share-section-heading"><div><span class="share-eyebrow">KẾ HOẠCH GIÁO DỤC</span><h2>Mục tiêu phát triển</h2><p>Kết quả được hiển thị theo từng giai đoạn đánh giá.</p></div><span class="share-lock">${icon('file')}Chế độ chỉ xem</span></div>${renderGoalsTable(goals, true, child.id)}</section><footer class="share-footer">Đường dẫn này chỉ hiển thị thông tin của <strong>${esc(child.name)}</strong>.</footer></div></div>`;
  }

  const overviewCalendarToday = new Date();
  let overviewCalendarCursor = new Date(overviewCalendarToday.getFullYear(), overviewCalendarToday.getMonth(), 1);
  const birthdayInputValue = (value) => { const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value || '')); return match ? `${match[3]}-${match[2]}-${match[1]}` : String(value || ''); };
  const birthdayDisplayValue = (value) => { const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '')); return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value || ''); };
  function getOverviewCalendarCells(year, month) {
    const firstDay = new Date(year, month, 1);
    const leadingDays = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previousMonthDays = new Date(year, month, 0).getDate();
    const cells = [];
    for (let index = leadingDays - 1; index >= 0; index -= 1) {
      const day = previousMonthDays - index;
      cells.push({ day, date: new Date(year, month - 1, day), muted: true });
    }
    for (let day = 1; day <= daysInMonth; day += 1) cells.push({ day, date: new Date(year, month, day), muted: false });
    let nextDay = 1;
    while (cells.length < 42) {
      cells.push({ day: nextDay, date: new Date(year, month + 1, nextDay), muted: true });
      nextDay += 1;
    }
    return cells;
  }
  const scheduleColorCount = scheduleColorOptions.length;
  const calendarDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  function scheduleEntriesForDate(date) {
    const weekday = date.getDay() === 0 ? 7 : date.getDay();
    return state.children.flatMap((child, childIndex) => (Array.isArray(child.teachingDays) && child.teachingDays.includes(weekday) ? [{ child, time: child.teachingStartTime && child.teachingEndTime ? `${child.teachingStartTime} - ${child.teachingEndTime}` : 'Chưa có giờ dạy', color: child.color || scheduleColorOptions[childIndex % scheduleColorCount].value }] : []));
  }
  function overviewCalendarMarkup() {
    const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const year = overviewCalendarCursor.getFullYear();
    const month = overviewCalendarCursor.getMonth();
    const monthTitle = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(overviewCalendarCursor);
    const title = monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);
    const todayKey = `${overviewCalendarToday.getFullYear()}-${overviewCalendarToday.getMonth()}-${overviewCalendarToday.getDate()}`;
    const cells = getOverviewCalendarCells(year, month);
    return `<section class="overview-calendar" aria-label="Lịch kế hoạch"><div class="overview-calendar-head"><div><span class="overview-calendar-kicker">LỊCH KẾ HOẠCH</span><strong>${title}</strong></div><div class="overview-calendar-controls"><button type="button" class="overview-calendar-today" data-calendar-action="today">Hôm nay</button><button type="button" class="overview-calendar-nav" data-calendar-action="previous" aria-label="Tháng trước">${icon('back')}</button><button type="button" class="overview-calendar-nav is-next" data-calendar-action="next" aria-label="Tháng sau">${icon('back')}</button><button type="button" class="overview-calendar-view">Tháng ${icon('chevron')}</button><span class="overview-calendar-icon">${icon('calendar')}</span></div></div><div class="overview-calendar-weekdays">${weekdays.map((day) => `<span>${day}</span>`).join('')}</div><div class="overview-calendar-days">${cells.map((cell, index) => { const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.day}`; const isToday = key === todayKey; const isSunday = index % 7 === 6; const entries = cell.muted ? [] : scheduleEntriesForDate(cell.date); const isScheduled = entries.length > 0; const classes = [cell.muted ? 'is-muted' : '', isSunday ? 'is-sunday' : '', isScheduled ? 'is-scheduled' : '', entries.length > 1 ? 'is-multi-scheduled' : '', entries.length === 1 ? `schedule-color-${entries[0].color}` : '', isToday ? 'is-today' : ''].filter(Boolean).join(' '); const eventMarkup = entries.length === 1 ? `<small class="calendar-event-name schedule-text-${entries[0].color}">${esc(entries[0].child.name)}</small><small class="calendar-event-time">${esc(entries[0].time)}</small>` : entries.map((entry) => `<small class="calendar-event-name schedule-text-${entry.color}">${esc(entry.child.name)}</small>`).join(''); return `<span class="${classes}" ${isScheduled ? `role="button" tabindex="0" data-calendar-date="${calendarDateKey(cell.date)}"` : ''}><b>${cell.day}</b>${eventMarkup}</span>`; }).join('')}</div></section>`;
  }
  function openCalendarSchedulePopup(dateKey) { const parts = dateKey.split('-').map(Number); const date = new Date(parts[0], parts[1] - 1, parts[2]); const entries = scheduleEntriesForDate(date); $('#calendar-popup-title').textContent = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date); $('#calendar-popup-list').innerHTML = entries.map((entry) => `<div class="calendar-popup-entry"><i class="schedule-dot schedule-color-${entry.color}"></i><div><strong>${esc(entry.child.name)}</strong><span>${esc(entry.time)}</span></div></div>`).join(''); $('#calendar-schedule-popup').removeAttribute('hidden'); }
  function closeCalendarSchedulePopup() { $('#calendar-schedule-popup').setAttribute('hidden', ''); }

  function renderOverview() {
    const child = selectedChild();
    if (!child) { $('#screen-overview').innerHTML = `<div class="empty-state"><h3>Chưa có dữ liệu tổng quan</h3><p>Vào Hồ sơ trẻ để thêm hồ sơ đầu tiên.</p>${button('Thêm trẻ', 'open-child', true)}</div>`; return; }
    const goals = state.goals.filter((goal) => goal.childId === child.id);
    const actions = `<div class="topbar-actions"><div class="date-pill">30/06/2026 ${icon('calendar')}</div>${button(`${icon('file')}Xem kế hoạch`, 'view-plan', true)}</div>`;
    $('#screen-overview').innerHTML = `${header('Tổng quan', 'Theo dõi nhanh kế hoạch giáo dục của các trẻ', actions)}${overviewCalendarMarkup()}<div class="overview-toolbar">${childChoiceButtons('Đang xem tổng quan của', 'overview')}</div>${childSummaryMarkup(child)}<section class="overview-goals-panel"><div class="section-title-row"><div><h2>${icon('overview')}Mục tiêu đang theo dõi</h2><p>Thông tin chỉ hiển thị; chỉnh sửa tại Kế hoạch giáo dục.</p></div><div class="mini-legend"><span><i class="dot green"></i>Đạt</span><span><i class="dot yellow"></i>Manh nha</span><span><i class="dot gray"></i>Chưa đạt</span></div></div>${renderGoalsTable(goals, true, child.id)}</section>`;
  }

  function renderOverviewLegacy() {
    const child = selectedChild();
    if (!child) { $('#screen-overview').innerHTML = `<div class="empty-state"><h3>Chưa có dữ liệu tổng quan</h3><p>Vào Hồ sơ trẻ để thêm hồ sơ đầu tiên.</p>${button('Thêm trẻ', 'open-child', true)}</div>`; return; }
    const goals = state.goals.filter((goal) => goal.childId === child.id);
    const achieved = goals.reduce((total, goal) => total + goal.statuses.filter((status) => status === 'Đạt').length, 0);
    const actions = `<div class="topbar-actions"><div class="date-pill">30/06/2026 ${icon('calendar')}</div>${button(`${icon('file')}Xem kế hoạch`, 'view-plan', true)}</div>`;
    $('#screen-overview').innerHTML = `${header('Tổng quan', 'Theo dõi nhanh kế hoạch giáo dục của các trẻ', actions)}<div class="overview-grid"><article class="overview-card"><span class="overview-card-label">Hồ sơ trẻ</span><strong>${state.children.length}</strong><small>đang được quản lý</small></article><article class="overview-card"><span class="overview-card-label">Mục tiêu đang theo dõi</span><strong>${goals.length}</strong><small>của ${esc(child.name)}</small></article><article class="overview-card success"><span class="overview-card-label">Kết quả đạt</span><strong>${achieved}</strong><small>trạng thái theo tuần</small></article></div><div class="overview-toolbar">${selectField('Đang xem tổng quan của', 'overview-child-select', state.children.map((item) => ({ value: item.id, label: item.name })), child.id)}</div><section class="child-summary">${avatar(child)}<div class="summary-name"><strong>${esc(child.name)}</strong><span>${icon('calendar')}Ngày sinh: ${esc(child.birthday)}</span><span>${icon('user')}Tuổi thực: 1 tuổi 11 tháng</span></div><div class="summary-meta"><span>${icon('user')}Người lập kế hoạch: Nguyễn Thị Vành Khuyên</span><span>${icon('calendar')}Ngày lập kế hoạch: 30/06/2026</span></div><div class="evaluation-summary"><strong>${icon('calendar')}Thông tin lượng giá</strong><span>Ngày lượng giá:</span><b>30/07/2026 và 30/08/2026</b></div></section><div class="section-title-row"><div><h2>${icon('overview')}Mục tiêu đang theo dõi</h2><p>Tổng hợp nhanh các mục tiêu của ${esc(child.name)}.</p></div><div class="mini-legend"><span><i class="dot green"></i>Đạt</span><span><i class="dot yellow"></i>Manh nha</span><span><i class="dot gray"></i>Chưa đạt</span></div></div><div class="overview-note">Chọn <strong>Kế hoạch giáo dục</strong> để cập nhật trạng thái chi tiết theo từng tuần.</div>`;
  }

  function decorateGoalCards() {
    document.querySelectorAll('#screen-plan [data-goal-card]').forEach((card) => {
      const goalId = Number(card.dataset.goalId || card.querySelector('[data-goal-id]')?.dataset.goalId);
      const goal = state.goals.find((item) => item.id === goalId);
      if (!goal) return;
      card.dataset.goalId = String(goal.id);
      card.classList.toggle('is-collapsed', state.collapsedGoalIds.includes(goal.id));
      const oldIcon = card.querySelector('.goal-domain-icon');
      if (oldIcon) oldIcon.outerHTML = domainIconBadge(state.domainIcons?.[goal.domain]);
      const editButton = card.querySelector('.goal-card-actions [data-action="edit-long"]');
      if (editButton) editButton.dataset.action = 'edit-domain';
      const header = card.querySelector('.goal-card-header');
      if (header && !header.querySelector('.goal-card-toggle')) {
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'goal-card-toggle';
        toggle.dataset.action = 'toggle-domain';
        toggle.dataset.goalId = String(goal.id);
        toggle.setAttribute('aria-label', 'Mở rộng hoặc thu gọn lĩnh vực');
        toggle.innerHTML = icon('chevron');
        header.querySelector('.goal-card-actions')?.before(toggle);
      }
      const toggle = card.querySelector('.goal-card-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', String(!state.collapsedGoalIds.includes(goal.id)));
    });
  }

  function renderPlanBase() {
    const child = selectedChild();
    if (!child) { $('#screen-plan').innerHTML = `<div class="empty-state"><h3>Chưa có hồ sơ trẻ</h3><p>Vào Hồ sơ trẻ để thêm thông tin trẻ mới.</p>${button('Thêm trẻ', 'open-child', true)}</div>`; return; }
    const childGoals = state.goals.filter((goal) => goal.childId === child.id);
    const orderedDomains = [...new Set(childGoals.map((goal) => goal.domain))];
    const goals = orderedDomains.flatMap((domain) => childGoals.filter((goal) => goal.domain === domain));
    const actions = `<div class="topbar-actions"><div class="date-pill">30/06/2026 ${icon('calendar')}</div>${button(`${icon('file')}Xuất PDF`, 'print', true)}</div>`;
    $('#screen-plan').innerHTML = `${header('Kế hoạch giáo dục', '', actions)}<div class="plan-toolbar">${childChoiceButtons('Đang xem hồ sơ của', 'plan')}<div class="plan-count"><span class="count-number">${goals.length}</span><span>mục tiêu đang theo dõi</span></div></div>${childSummaryMarkup(child)}<div class="section-title-row"><div><h2>${icon('calendar')}MỤC TIÊU PHÁT TRIỂN</h2></div><div class="mini-legend"><span><i class="dot green"></i>Đạt (Đ)</span><span><i class="dot yellow"></i>Manh nha (MN)</span><span><i class="dot gray"></i>Chưa đạt (CĐ)</span></div></div>${renderGoalsTable(goals, false, child.id)}`;
  }

  // Tương thích với các luồng cũ: mọi điều hướng kế hoạch đều dùng màn hình mới.
  function renderPlan() { renderPlanNew(); }

  function renderPlanNew() {
    const screen = $('#screen-plan-new');
    planNewOpenDomains = state.planNewOpenDomainsByChild?.[String(state.selectedChildId)] || state.planNewOpenDomains || {};
    const child = selectedChild();
    const actions = `<div class="topbar-actions"><div class="date-pill">30/06/2026 ${icon('calendar')}</div>${button(`${icon('save')}Lưu`, 'save-plan-new', true)}${button(`${icon('file')}Xuất PDF`, 'print')}</div>`;
    if (!child) { screen.innerHTML = `${header('Kế hoạch giáo dục', 'Bố cục mới · mục tiêu được tách riêng theo từng trẻ', actions)}<div class="empty-state"><h3>Chưa có hồ sơ trẻ</h3><p>Vào Hồ sơ trẻ để thêm thông tin trẻ mới.</p>${button('Thêm trẻ', 'open-child', true)}</div>`; return; }
    const childGoals = state.goals.filter((goal) => goal.childId === child.id);
    const hiddenDomains = hiddenPlanNewDomainsForChild(child.id);
    const visibleChildGoals = childGoals.filter((goal) => !hiddenDomains.includes(goal.domain));
    const periodLabels = periodsForChild(child.id);
    const allDomains = [...new Set([...(state.domains || domains), ...childGoals.map((goal) => goal.domain)])].filter((domain) => !hiddenDomains.includes(domain));
    const query = planNewSearch.trim().toLowerCase();
    const visibleDomains = allDomains.filter((domain) => {
      if (planNewFilter && planNewFilter !== domain) return false;
      if (!query) return true;
      const domainGoals = childGoals.filter((goal) => goal.domain === domain);
      return `${domain} ${domainGoals.map((goal) => `${goal.longTerm} ${(goal.shortTerm || []).join(' ')}`).join(' ')}`.toLowerCase().includes(query);
    });
    const domainCards = visibleDomains.map((domain, domainIndex) => {
      const domainGoals = childGoals.filter((goal) => goal.domain === domain).filter((goal) => !query || `${goal.longTerm} ${(goal.shortTerm || []).join(' ')}`.toLowerCase().includes(query));
      const open = planNewOpenDomains[domain] ?? domainIndex === 0;
      const targetGoal = childGoals.find((goal) => goal.domain === domain);
      const goalCards = domainGoals.map((goal, goalIndex) => {
        const shortGoals = (goal.shortTerm || []).map((item, shortIndex) => `<li><span class="plan-new-bullet"></span><span>${esc(item || 'Chưa nhập mục tiêu')}</span><span class="plan-new-row-actions"><button type="button" data-action="edit-short" data-goal-id="${goal.id}" data-short-index="${shortIndex}" aria-label="Sửa mục tiêu ngắn hạn">${icon('edit')}</button><button type="button" class="danger" data-action="delete-short" data-goal-id="${goal.id}" data-short-index="${shortIndex}" aria-label="Xóa mục tiêu ngắn hạn">${icon('trash')}</button></span></li>`).join('');
        const results = periodLabels.map((label, periodIndex) => `<div class="plan-new-period"><div class="plan-new-period-label"><span>${esc(label)}</span><button type="button" data-action="edit-period" data-goal-id="${goal.id}" data-period-index="${periodIndex}" aria-label="Sửa kết quả ${esc(label)}">${icon('edit')}</button></div>${statusMarkup(goal.statuses?.[periodIndex] || 'Chưa đạt', goal.id, periodIndex, false)}</div>`).join('');
        return `<article class="plan-new-goal"><div class="plan-new-goal-head"><div><span class="plan-new-goal-label">Mục tiêu dài hạn ${String(goalIndex + 1).padStart(2, '0')}</span><h4>${esc(goal.longTerm || 'Chưa nhập mục tiêu dài hạn')}</h4></div><div class="plan-new-goal-actions"><button class="plan-new-small-action" type="button" data-action="edit-long" data-goal-id="${goal.id}">${icon('edit')}Sửa</button><button class="plan-new-small-action danger" type="button" data-action="delete-goal" data-goal-id="${goal.id}" aria-label="Xóa mục tiêu dài hạn">${icon('trash')}</button></div></div><div class="plan-new-goal-content"><section class="plan-new-short-section"><div class="plan-new-section-head"><h5>Mục tiêu ngắn hạn</h5><button class="plan-new-outline-action" type="button" data-action="add-short" data-goal-id="${goal.id}">${icon('plus')}Thêm</button></div>${shortGoals ? `<ul>${shortGoals}</ul>` : '<p class="plan-new-muted">Chưa có mục tiêu ngắn hạn.</p>'}</section><section class="plan-new-result-section"><div class="plan-new-section-head"><div><h5>Kết quả theo tuần</h5><p>Cập nhật trạng thái theo từng giai đoạn</p></div><button class="plan-new-outline-action" type="button" data-action="add-period">${icon('plus')}Thêm thời gian</button></div><div class="plan-new-period-grid">${results}</div></section></div><footer class="plan-new-goal-footer">Ghi chú: ${esc(goal.note || 'Chưa có ghi chú')}</footer></article>`;
      }).join('');
      const empty = `<div class="plan-new-empty">${icon('target')}<div><strong>${query ? 'Không tìm thấy mục tiêu phù hợp' : 'Chưa có mục tiêu dài hạn'}</strong><span>${query ? 'Thử từ khóa khác hoặc xóa bộ lọc.' : 'Bắt đầu bằng cách thêm mục tiêu dài hạn cho lĩnh vực này.'}</span></div></div>`;
      return `<article class="plan-new-domain ${open ? 'is-open' : 'is-collapsed'}"><header class="plan-new-domain-head" data-action="toggle-new-domain" data-new-domain="${esc(domain)}" role="button" tabindex="0" aria-expanded="${open}"><div class="plan-new-domain-title">${domainIconBadge(state.domainIcons?.[domain] || defaultDomainIcons[domain])}<div><span class="plan-new-eyebrow">Lĩnh vực</span><h3>${esc(domain)}</h3><p>${childGoals.filter((goal) => goal.domain === domain).length} mục tiêu dài hạn <span>·</span> ${childGoals.filter((goal) => goal.domain === domain).length * periodLabels.length} kết quả theo tuần</p></div></div><div class="plan-new-domain-actions"><button class="plan-new-icon-action" type="button" data-action="edit-domain" data-goal-id="${targetGoal?.id || 0}" aria-label="Sửa lĩnh vực ${esc(domain)}">${icon('edit')}</button><button class="plan-new-icon-action danger" type="button" data-action="delete-domain-setting" data-domain-setting-name="${esc(domain)}" aria-label="Xóa lĩnh vực ${esc(domain)}">${icon('trash')}</button><button class="plan-new-toggle" type="button" data-action="toggle-new-domain" data-new-domain="${esc(domain)}" aria-expanded="${open}" aria-label="${open ? 'Thu gọn' : 'Mở rộng'} lĩnh vực ${esc(domain)}">${icon('chevron')}</button></div></header>${open ? `<div class="plan-new-domain-body">${goalCards || empty}<div class="plan-new-domain-footer"><span>${childGoals.filter((goal) => goal.domain === domain).length} mục tiêu dài hạn</span><button class="plan-new-primary-small" type="button" data-action="add-long" data-plan-new-domain="${esc(domain)}">${icon('plus')}Thêm mục tiêu dài hạn</button></div></div>` : ''}</article>`;
    }).join('');
    screen.innerHTML = `${header('Kế hoạch giáo dục', 'Bố cục mới · mục tiêu được tách riêng theo từng trẻ', actions)}<section class="plan-new-child-switcher"><div><span>Đang xem hồ sơ của</span>${childChoiceButtons('Chọn trẻ', 'plan-new')}</div><div class="plan-new-following-count"><strong>${visibleChildGoals.length}</strong><span>mục tiêu đang theo dõi</span></div></section>${childSummaryMarkup(child)}<div class="plan-new-section-title"><div><h2>${icon('calendar')}MỤC TIÊU PHÁT TRIỂN</h2><p>Thiết lập và theo dõi mục tiêu riêng cho ${esc(child.name)}.</p></div><div class="mini-legend"><span><i class="dot green"></i>Đạt (Đ)</span><span><i class="dot yellow"></i>Manh nha (MN)</span><span><i class="dot gray"></i>Chưa đạt (CĐ)</span></div></div><section class="plan-new-board"><div class="plan-new-toolbar"><div class="plan-new-search">${icon('overview')}<input type="search" data-plan-new-search value="${esc(planNewSearch)}" placeholder="Tìm kiếm lĩnh vực, mục tiêu..." aria-label="Tìm kiếm lĩnh vực, mục tiêu" /></div><select data-plan-new-domain-filter aria-label="Lọc theo lĩnh vực"><option value="">Tất cả lĩnh vực</option>${allDomains.map((domain) => `<option value="${esc(domain)}" ${domain === planNewFilter ? 'selected' : ''}>${esc(domain)}</option>`).join('')}</select><span class="plan-new-toolbar-count"><strong>${visibleDomains.length}</strong> lĩnh vực</span><button class="button primary" type="button" data-action="add-domain">${icon('plus')}Thêm lĩnh vực</button></div><div class="plan-new-board-actions"><button class="outline-button compact" type="button" data-action="collapse-new-domains">${icon('chevron')}Thu gọn tất cả</button><button class="outline-button compact" type="button" data-action="expand-new-domains">${icon('chevron')}Mở tất cả</button></div><div class="plan-new-domain-list">${domainCards || `<div class="plan-new-no-results">${icon('target')}<strong>Không tìm thấy lĩnh vực hoặc mục tiêu</strong><span>Thử từ khóa khác hoặc xóa bộ lọc để xem lại toàn bộ dữ liệu.</span></div>`}</div><footer class="plan-new-footer"><span>Hiển thị ${visibleDomains.length} lĩnh vực · ${visibleChildGoals.length} mục tiêu dài hạn</span><span>Gợi ý: mở từng lĩnh vực để thao tác nhanh, tránh màn hình quá dày.</span></footer></section>`;
  }

  function renderPlanLegacy() {
    const child = selectedChild();
    const orderedDomains = [...new Set([...domains, ...state.goals.map((goal) => goal.domain)])];
    state.goals = orderedDomains.flatMap((domain) => state.goals.filter((goal) => goal.domain === domain));
    if (!child) { $('#screen-plan').innerHTML = `<div class="empty-state"><h3>Chưa có hồ sơ trẻ</h3><p>Vào Hồ sơ trẻ để thêm thông tin trẻ mới.</p>${button('Thêm trẻ', 'open-child', true)}</div>`; return; }
    const goals = state.goals.filter((goal) => goal.childId === child.id);
    const domainCounts = goals.reduce((counts, goal) => { counts[goal.domain] = (counts[goal.domain] || 0) + 1; return counts; }, {});
    const domainIcon = (domain) => domain === 'Tương tác xã hội' ? 'group' : domain === 'Chú ý chung' ? 'eye' : 'target';
    const rows = goals.length ? goals.map((goal, index) => { const first = index === 0 || goals[index - 1].domain !== goal.domain; const domainCell = first ? `<td class="domain-cell" rowspan="${domainCounts[goal.domain]}"><span class="domain-icon">${icon(domainIcon(goal.domain))}</span><strong>${esc(goal.domain)}</strong></td>` : ''; return `<tr>${domainCell}<td class="long-term-cell">${esc(goal.longTerm)}</td><td class="short-term-cell"><ul>${goal.shortTerm.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></td>${goal.statuses.map((status, week) => `<td class="result-cell"><label class="status-select ${status === 'Đạt' ? 'achieved' : status === 'Manh nha' ? 'emerging' : 'not-achieved'}"><span class="status-dot"></span><select data-goal-id="${goal.id}" data-week="${week}">${statuses.map((item) => `<option ${item === status ? 'selected' : ''}>${item}</option>`).join('')}</select>${icon('chevron')}</label></td>`).join('')}<td class="row-note"><button type="button" aria-label="Ghi chú mục tiêu">${icon('note')}</button></td></tr>`; }).join('') : `<tr><td colspan="8"><div class="empty-state"><h3>Chưa có mục tiêu phát triển</h3><p>Hãy thêm mục tiêu riêng cho trẻ để bắt đầu theo dõi.</p></div></td></tr>`;
    const actions = `<div class="topbar-actions"><div class="date-pill">30/06/2026 ${icon('calendar')}</div>${button(`${icon('file')}Xuất PDF`, 'print', true)}</div>`;
    $('#screen-plan').innerHTML = `${header('Kế hoạch giáo dục', '', actions)}<div class="plan-toolbar">${selectField('Đang xem hồ sơ của', 'plan-child-select', state.children.map((item) => ({ value: item.id, label: item.name })), child.id)}<div class="plan-count"><span class="count-number">${goals.length}</span><span>mục tiêu đang theo dõi</span></div></div><section class="child-summary">${avatar(child)}<div class="summary-name"><strong>${esc(child.name)}</strong><span>${icon('calendar')}Ngày sinh: ${esc(child.birthday)}</span><span>${icon('user')}Tuổi thực: 1 tuổi 11 tháng</span></div><div class="summary-meta"><span>${icon('user')}Người lập kế hoạch: Nguyễn Thị Vành Khuyên</span><span>${icon('calendar')}Ngày lập kế hoạch: 30/06/2026</span></div><div class="evaluation-summary"><strong>${icon('calendar')}Thông tin lượng giá</strong><span>Ngày lượng giá:</span><b>30/07/2026 và 30/08/2026</b></div></section><div class="section-title-row"><div><h2>${icon('calendar')}MỤC TIÊU PHÁT TRIỂN</h2></div><div class="mini-legend"><span><i class="dot green"></i>Đạt (Đ)</span><span><i class="dot yellow"></i>Manh nha (MN)</span><span><i class="dot gray"></i>Chưa đạt (CĐ)</span></div></div><div class="table-scroll"><table class="goals-table"><thead><tr><th>LĨNH VỰC</th><th>MỤC TIÊU<br />DÀI HẠN</th><th>MỤC TIÊU NGẮN HẠN</th><th colspan="4">KẾT QUẢ</th><th>GHI CHÚ</th></tr><tr><th></th><th></th><th></th>${weekLabels.map((label) => `<th>${label}</th>`).join('')}<th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
    decorateNotes();
  }

  void renderOverviewLegacy;
  void renderPlanLegacy;

  function renderChildren() {
    const cards = state.children.map((child, childIndex) => { const days = Array.isArray(child.teachingDays) ? child.teachingDays.map((day) => teachingDayLabels[day]).filter(Boolean).join(', ') : ''; const dayLabel = days || 'Chưa cài'; const timeLabel = child.teachingStartTime && child.teachingEndTime ? `${child.teachingStartTime} - ${child.teachingEndTime}` : 'Chưa cài'; const colorOption = scheduleColorOptions.find((option) => option.value === child.color) || scheduleColorOptions[childIndex % scheduleColorCount]; return `<article class="child-card"><div class="child-card-head">${avatar(child, true)}<div><h3>${esc(child.name)}</h3><p>${esc(child.gender)} · Sinh ngày ${esc(child.birthday)}</p></div></div><div class="child-card-details"><span>${icon('calendar')}Ngày dạy: ${esc(dayLabel)}</span><span>${icon('calendar')}Giờ dạy: ${esc(timeLabel)}</span><span><i class="schedule-color-swatch ${colorOption.value}"></i>Màu lịch: ${esc(colorOption.label)}</span></div><div class="child-card-note">${icon('note')}${esc(child.note || 'Chưa có ghi chú')}</div><div class="child-card-actions"><div class="child-card-links"><button type="button" class="link-button" data-plan-child="${child.id}">Xem kế hoạch <span>→</span></button><button type="button" class="link-button share-link-button" data-share-child="${child.id}">${icon('share')}Chia sẻ</button></div><div><button type="button" class="icon-action edit" data-edit-child="${child.id}" aria-label="Chỉnh sửa ${esc(child.name)}">${icon('edit')}</button><button type="button" class="icon-action delete" data-delete-child="${child.id}" aria-label="Xóa ${esc(child.name)}">${icon('trash')}</button></div></div></article>`; }).join('');
    $('#screen-children').innerHTML = `${header('Hồ sơ trẻ', `${state.children.length} hồ sơ đang được quản lý`, button(`${icon('plus')}Thêm trẻ`, 'open-child', true))}<div class="children-intro"><div class="intro-icon">${icon('children')}</div><div><h2>Thông tin tất cả các trẻ</h2><p>Quản lý hồ sơ và mở kế hoạch giáo dục riêng cho từng trẻ.</p></div></div><div class="children-grid">${cards}</div>${!state.children.length ? `<div class="empty-state"><h3>Chưa có hồ sơ trẻ</h3><p>Nhấn “Thêm trẻ” để nhập hồ sơ đầu tiên.</p></div>` : ''}`;
  }

  function renderObjectiveBase() {
    if (!state.children.length) { $('#screen-objective').innerHTML = `${header('Thêm mục tiêu phát triển', '', `<button type="button" class="button" data-action="open-child">Thêm trẻ</button>`)}<div class="empty-state"><h3>Cần có hồ sơ trẻ trước</h3><p>Hãy thêm trẻ rồi cài đặt mục tiêu riêng.</p></div>`; return; }
    const domainOptions = domains.map((item) => ({ value: item, label: item.toUpperCase() }));
    const shortRows = draftShortGoals.map((value, index) => `<div class="short-goal-edit-row"><span class="drag-dots">⠿</span><span class="goal-number">${index + 1}.</span><input data-short-goal="${index}" value="${esc(value)}" placeholder="Mục tiêu ngắn hạn ${index + 1}" /><button type="button" data-remove-short="${index}" aria-label="Xóa mục tiêu">${icon('trash')}</button></div>`).join('');
    const previewWeeks = weekLabels.map((label, index) => `<div class="preview-week ${index === 0 ? 'open' : ''}"><button type="button" class="preview-week-toggle" data-preview-week="${index}"><span>${label}</span>${icon('chevron')}</button><ol>${index === 0 ? draftShortGoals.filter(Boolean).map((value) => `<li>${esc(value)}</li>`).join('') : ''}</ol></div>`).join('');
    const actions = `<div class="topbar-actions"><div class="date-pill">30/06/2026 ${icon('calendar')}</div><button type="button" class="button" data-view="plan">Hủy</button><button type="submit" form="objective-form" class="button primary">Lưu</button></div>`;
    $('#screen-objective').innerHTML = `<header class="objective-header"><div class="objective-heading"><button type="button" class="back-button" data-view="plan" aria-label="Quay lại">${icon('back')}</button><div><h1>Thêm mục tiêu phát triển</h1><div class="breadcrumb">Kế hoạch giáo dục <span>›</span> Mục tiêu phát triển <span>›</span> Thêm mới</div></div></div>${actions}</header><div class="objective-layout"><main><form id="objective-form" class="objective-form-card"><section class="objective-section"><h2>1. LĨNH VỰC <em>*</em></h2>${selectField('', 'objective-domain', domainOptions, domains[0])}<small class="field-hint">Chọn lĩnh vực phát triển phù hợp với mục tiêu.</small></section><section class="objective-section"><h2>2. MỤC TIÊU DÀI HẠN <em>*</em></h2><p class="objective-description">Nhập mục tiêu dài hạn cần đạt được trong giai đoạn kế hoạch (2 tháng).</p><label class="field objective-textarea"><span class="sr-only">Mục tiêu dài hạn</span><textarea id="objective-long" required placeholder="Ví dụ: Duy trì tương tác với giáo viên 5–10 phút">Duy trì tương tác với giáo viên 5–10 phút</textarea><small>37/500</small></label><small class="field-hint">Ví dụ: Duy trì tương tác với giáo viên 5–10 phút.</small></section><section class="objective-section short-section"><h2>3. MỤC TIÊU NGẮN HẠN <em>*</em></h2><p class="objective-description">Nhập các mục tiêu ngắn hạn cụ thể theo từng giai đoạn.</p><div class="week-tabs">${weekLabels.map((label, index) => `<button type="button" class="week-tab ${index === 0 ? 'active' : ''}" data-week-tab="${index}">${label}</button>`).join('')}</div><div class="short-goal-list"><div class="short-list-title">Danh sách mục tiêu ngắn hạn</div>${shortRows}</div><div class="short-list-footer"><button type="button" class="outline-button" data-add-short>${icon('plus')}Thêm mục tiêu</button><span>${draftShortGoals.length}/10 mục tiêu</span></div></section><p class="required-note"><em>*</em> Thông tin bắt buộc phải nhập</p></form></main><aside class="objective-preview"><div class="preview-heading">${icon('eye')}XEM TRƯỚC</div><div class="preview-body"><span class="preview-label">Lĩnh vực</span><span class="domain-pill" id="preview-domain">${domains[0].toUpperCase()}</span><h3>Mục tiêu dài hạn</h3><p id="preview-long">Duy trì tương tác với giáo viên 5–10 phút</p><h3>Mục tiêu ngắn hạn</h3><div class="preview-weeks">${previewWeeks}</div></div></aside></div>`;
  }

  function renderObjective() {
    renderObjectiveBase();
    const form = $('#objective-form');
    if (!form) return;
    const requiredNote = form.querySelector('.required-note');
    if (requiredNote) form.after(requiredNote);
    document.querySelector('.objective-heading .back-button')?.remove();
    document.querySelector('.objective-heading .breadcrumb')?.remove();
    [['objective-from', '01/07/2026'], ['objective-to', '30/08/2026']].forEach(([id, value]) => {
      let field = document.getElementById(id);
      if (!field) { field = document.createElement('input'); field.type = 'hidden'; field.id = id; form.appendChild(field); }
      field.value = value ?? '';
    });
    const domainField = $('#objective-domain')?.closest('.field');
    if (domainField) {
      const childField = document.createElement('label');
      childField.className = 'field objective-child-field';
      childField.innerHTML = `<span>TRẺ ÁP DỤNG <em>*</em></span><div class="select-wrap"><select id="objective-child">${state.children.map((child) => `<option value="${child.id}" ${child.id === state.selectedChildId ? 'selected' : ''}>${esc(child.name)}</option>`).join('')}</select>${icon('chevron')}</div>`;
      domainField.parentNode.insertBefore(childField, domainField);
      const domainControl = document.createElement('div');
      domainControl.className = 'objective-domain-control';
      domainControl.innerHTML = `<span class="objective-domain-icon">${icon('group')}</span>`;
      domainField.parentNode.insertBefore(domainControl, domainField);
      domainControl.appendChild(domainField);
    }
    const previewDomain = $('#preview-domain');
    if (previewDomain) previewDomain.insertAdjacentHTML('beforebegin', `<span class="preview-domain-icon">${icon('group')}</span>`);
    const long = $('#objective-long');
    long.value = draftLongTerm;
    updateObjectivePreview();
  }

  function renderSettingsLegacy() {
    $('#screen-settings').innerHTML = `${header('Cài đặt', 'Tùy chỉnh cách bạn sử dụng kế hoạch giáo dục')}<div class="settings-card"><div class="settings-heading"><div class="settings-icon">${icon('settings')}</div><div><h2>Tùy chọn ứng dụng</h2><p>Các thay đổi được lưu trên thiết bị này.</p></div></div><label class="setting-row"><span><strong>Giao diện tối</strong><small>Đổi sang nền tối để sử dụng dễ chịu hơn vào buổi tối.</small></span><input type="checkbox" data-theme-toggle aria-label="Giao diện tối" /></label></div>`;
  }

  function renderSettings() {
    const items = domains.map((domain) => `<div class="domain-settings-item">${domainIconBadge(state.domainIcons?.[domain] || defaultDomainIcons[domain])}<span>${esc(domain)}</span><button type="button" class="domain-settings-action edit" data-action="edit-domain-setting" data-domain-setting-name="${esc(domain)}" aria-label="Sửa ${esc(domain)}">${icon('edit')}</button><button type="button" class="domain-settings-action delete" data-action="delete-domain-setting" data-domain-setting-name="${esc(domain)}" aria-label="Xóa ${esc(domain)}">${icon('trash')}</button></div>`).join('');
    $('#screen-settings').innerHTML = `${header('Cài đặt', 'Tùy chỉnh cách bạn sử dụng kế hoạch giáo dục')}<div class="settings-card"><div class="settings-heading"><div class="settings-icon">${icon('settings')}</div><div><h2>Tùy chọn ứng dụng</h2><p>Các thay đổi được lưu trên thiết bị này.</p></div></div><label class="setting-row"><span><strong>Giao diện tối</strong><small>Đổi sang nền tối để sử dụng dễ chịu hơn vào buổi tối.</small></span><input type="checkbox" data-theme-toggle aria-label="Giao diện tối" /></label></div><div class="settings-card domain-settings-section"><div class="settings-heading"><div class="settings-icon">${icon('target')}</div><div><h2>Quản lý lĩnh vực</h2><p>Đặt tên và chọn icon riêng cho từng lĩnh vực phát triển.</p></div></div><form id="domain-settings-form" class="domain-settings-form"><label class="field"><span>Tên lĩnh vực mới<em>*</em></span><input id="new-domain-name" required placeholder="Ví dụ: Kỹ năng tự phục vụ" /></label><label class="field domain-settings-icon-field"><span>Icon lĩnh vực</span><div id="new-domain-icon-picker">${domainIconPicker(domainIconOptions[0].value, 'select-new-domain-icon')}</div><input type="hidden" id="new-domain-icon" value="${domainIconOptions[0].value}" /></label><button type="submit" class="button primary">${icon('plus')}Thêm lĩnh vực</button></form><div class="domain-settings-list" aria-live="polite">${items || '<span class="cell-placeholder">Chưa có lĩnh vực.</span>'}</div></div>`;
  }

  function navigate(view) { if (view === 'plan') view = 'plan-new'; if (shareMode) return; state.view = view; document.querySelectorAll('.screen').forEach((screen) => screen.classList.toggle('active', screen.id === `screen-${view}`)); document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === view)); if (view === 'overview') renderOverview(); if (view === 'plan-new') renderPlanNew(); if (view === 'children') renderChildren(); if (view === 'objective') renderObjective(); if (view === 'settings') renderSettings(); applyTheme(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function ensureChildColorField() { if ($('#child-color')) return; const genderField = $('#child-gender')?.closest('.field'); if (!genderField) return; const field = document.createElement('label'); field.className = 'field'; field.innerHTML = '<span>Màu lịch dạy</span><div class="color-select-row"><span id="child-color-swatch" class="schedule-color-swatch blue" aria-hidden="true"></span><div class="select-wrap"><select id="child-color"><option value="blue">Xanh dương</option><option value="purple">Tím</option><option value="teal">Xanh ngọc</option><option value="orange">Cam</option><option value="pink">Hồng</option><option value="green">Xanh lá</option></select>' + icon('chevron') + '</div></div>'; genderField.after(field); }
  function openChildModal(id) { const child = id ? childById(id) : null; const teachingDays = Array.isArray(child?.teachingDays) ? child.teachingDays : []; ensureChildColorField(); const color = child?.color || scheduleColorOptions[0].value; $('#child-modal-title').textContent = child ? 'Chỉnh sửa hồ sơ trẻ' : 'Thêm trẻ mới'; $('#child-id').value = child?.id || ''; $('#child-name').value = child?.name || ''; $('#child-birthday').value = birthdayInputValue(child?.birthday || ''); $('#child-gender').value = child?.gender || 'Nữ'; $('#child-color').value = color; $('#child-color-swatch').className = `schedule-color-swatch ${color}`; $('#child-note').value = child?.note || ''; $('#child-start-time').value = child?.teachingStartTime || ''; $('#child-end-time').value = child?.teachingEndTime || ''; $('#child-schedule-error').setAttribute('hidden', ''); document.querySelectorAll('[data-teaching-day]').forEach((input) => { input.checked = teachingDays.includes(Number(input.value)); }); $('#child-modal').removeAttribute('hidden'); $('#child-name').focus(); }
  function closeChildModal() { $('#child-modal').setAttribute('hidden', ''); }
  function openPlanInfoModal() { const child = selectedChild(); if (!child) return; const info = getPlanInfo(child); $('#plan-info-planner').value = info.planner; $('#plan-info-date').value = birthdayInputValue(info.planDate); $('#plan-info-evaluation-dates').value = info.evaluationDates; $('#plan-info-modal').removeAttribute('hidden'); $('#plan-info-planner').focus(); }
  function closePlanInfoModal() { $('#plan-info-modal').setAttribute('hidden', ''); }
  function openNoteModal(id) { const goal = state.goals.find((item) => item.id === Number(id)); if (!goal) return; $('#note-goal-id').value = goal.id; $('#note-text').value = goal.note || ''; $('#note-modal').removeAttribute('hidden'); $('#note-text').focus(); }
  function closeNoteModal() { $('#note-modal').setAttribute('hidden', ''); }
  function updateObjectivePreview() { const long = $('#objective-long'); const domain = $('#objective-domain'); if (!long || !domain) return; $('#preview-long').textContent = long.value || 'Chưa nhập mục tiêu'; $('#preview-domain').textContent = domain.value.toUpperCase(); const firstList = document.querySelector('.preview-week.open ol'); if (firstList) firstList.innerHTML = draftShortGoals.filter((value) => value.trim()).map((value) => `<li>${esc(value)}</li>`).join(''); const counter = document.querySelector('.objective-textarea small'); if (counter) counter.textContent = `${long.value.length}/500`; }

  function ensureGoalEditorFields() {
    const grid = $('#goal-dialog-domain')?.closest('.form-grid');
    if (!grid) return;
    const parent = $('#goal-parent-field');
    if (!$('#goal-domain-name-field')) { const field = document.createElement('label'); field.className = 'field'; field.id = 'goal-domain-name-field'; field.innerHTML = '<span>Tên lĩnh vực<em>*</em></span><input id="goal-dialog-domain-name" placeholder="Nhập tên lĩnh vực" />'; parent.before(field); }
    if (!$('#goal-domain-icon-field')) { const field = document.createElement('label'); field.className = 'field full'; field.id = 'goal-domain-icon-field'; field.innerHTML = '<span>Icon lĩnh vực<em>*</em></span><div id="goal-dialog-icon-picker"></div><input type="hidden" id="goal-dialog-icon-value" />'; parent.before(field); }
    if (!$('#goal-edit-long-field')) { const field = document.createElement('label'); field.className = 'field full'; field.id = 'goal-edit-long-field'; field.innerHTML = '<span>Mục tiêu dài hạn</span><input id="goal-dialog-edit-long" list="goal-dialog-long-options" placeholder="Chọn hoặc nhập mục tiêu dài hạn..." /><datalist id="goal-dialog-long-options"></datalist>'; parent.before(field); }
    if (!$('#goal-edit-short-field')) { const field = document.createElement('label'); field.className = 'field full'; field.id = 'goal-edit-short-field'; field.innerHTML = '<span>Mục tiêu ngắn hạn</span><div id="goal-dialog-short-list" class="quick-short-list"></div><button type="button" class="outline-button compact quick-add-button" data-action="edit-domain-add-short"><svg><use href="#icon-plus"></use></svg>Thêm mục tiêu ngắn hạn</button>'; parent.before(field); }
    if (!$('#goal-edit-results-field')) { const field = document.createElement('label'); field.className = 'field full'; field.id = 'goal-edit-results-field'; field.innerHTML = '<span>Kết quả theo tuần</span><div id="goal-dialog-results-list" class="quick-results-list"></div><button type="button" class="outline-button compact quick-add-button" data-action="edit-domain-add-period"><svg><use href="#icon-plus"></use></svg>Thêm kết quả theo tuần</button>'; parent.before(field); }
    if (!$('#goal-edit-note-field')) { const field = document.createElement('label'); field.className = 'field full'; field.id = 'goal-edit-note-field'; field.innerHTML = '<span>Ghi chú</span><textarea id="goal-dialog-note" placeholder="Nhập ghi chú..."></textarea>'; parent.before(field); }
  }

  function renderDomainEditFields(goal, domainNameOverride = '') {
    const periods = periodsForChild(goal?.childId || state.selectedChildId);
    const currentDomain = goal?.domain || domainNameOverride;
    $('#goal-dialog-domain-name').value = currentDomain;
    $('#goal-dialog-icon-value').value = state.domainIcons?.[currentDomain] || defaultDomainIcons[currentDomain] || domainIconOptions[0].value;
    $('#goal-dialog-icon-picker').innerHTML = domainIconPicker($('#goal-dialog-icon-value').value);
    $('#goal-dialog-edit-long').value = goal?.longTerm || '';
    $('#goal-dialog-short-list').innerHTML = (goal?.shortTerm?.length ? goal.shortTerm : ['']).map((value, index) => `<div class="quick-short-row"><input data-edit-domain-short value="${esc(value)}" placeholder="Mục tiêu ngắn hạn ${index + 1}" /><button type="button" class="row-action delete" data-action="edit-domain-remove-short" data-short-index="${index}" aria-label="Xóa mục tiêu ngắn hạn">${icon('trash')}</button></div>`).join('');
    $('#goal-dialog-results-list').innerHTML = periods.map((period, index) => `<div class="quick-result-row"><input class="quick-period-label" data-edit-domain-period data-period-index="${index}" value="${esc(period)}" aria-label="Tên thời gian ${esc(period)}" /><div class="select-wrap"><select data-edit-domain-status data-period-index="${index}">${statuses.map((item) => `<option ${item === (goal?.statuses?.[index] || 'Chưa đạt') ? 'selected' : ''}>${item}</option>`).join('')}</select>${icon('chevron')}</div><button type="button" class="row-action delete" data-action="edit-domain-remove-period" data-period-index="${index}" aria-label="Xóa ${esc(period)}">${icon('trash')}</button></div>`).join('');
    $('#goal-dialog-note').value = goal?.note || '';
  }

  function openGoalModal(mode, goalId, shortIndex, domainNameOverride = '') {
    ensureGoalEditorFields();
    const domainInput = $('#goal-dialog-domain');
    if (domainInput && domainInput.tagName !== 'SELECT') {
      const domainSelect = document.createElement('select');
      domainSelect.id = 'goal-dialog-domain';
      domainInput.replaceWith(domainSelect);
    }
    if (!$('#goal-period-field')) {
      const periodField = document.createElement('label');
      periodField.className = 'field full';
      periodField.id = 'goal-period-field';
      periodField.innerHTML = '<span>Tên thời gian<em>*</em></span><input id="goal-dialog-period-label" placeholder="Ví dụ: Tuần 2" />';
      $('#goal-status-field').before(periodField);
    }
    const goal = state.goals.find((item) => item.id === Number(goalId));
    const currentGoals = state.goals.filter((item) => item.childId === state.selectedChildId);
    const isShort = mode === 'short' || mode === 'edit-short';
    const isEdit = mode === 'edit-long' || mode === 'edit-short' || mode === 'edit-period' || mode === 'edit-domain' || mode === 'edit-domain-setting';
    const isDomainEdit = mode === 'edit-domain';
    const isSettingsDomainEdit = mode === 'edit-domain-setting';
    const isPeriodEdit = mode === 'edit-period';
    const existingDomainNameControl = $('#goal-dialog-domain-name');
    if (isDomainEdit && existingDomainNameControl?.tagName !== 'SELECT') {
      const domainSelect = document.createElement('select');
      domainSelect.id = 'goal-dialog-domain-name';
      existingDomainNameControl?.replaceWith(domainSelect);
    } else if (!isDomainEdit && existingDomainNameControl?.tagName !== 'INPUT') {
      const domainInput = document.createElement('input');
      domainInput.id = 'goal-dialog-domain-name';
      domainInput.placeholder = 'Nhập tên lĩnh vực';
      existingDomainNameControl?.replaceWith(domainInput);
    }
    const titles = { domain: 'Thêm lĩnh vực', long: 'Thêm mục tiêu dài hạn', short: 'Thêm mục tiêu ngắn hạn', 'edit-domain': 'Chỉnh sửa lĩnh vực', 'edit-domain-setting': 'Chỉnh sửa lĩnh vực', 'edit-long': 'Chỉnh sửa mục tiêu dài hạn', 'edit-short': 'Chỉnh sửa mục tiêu ngắn hạn', period: 'Thêm thời gian kết quả' };
    const labels = { domain: 'Tên lĩnh vực', long: 'Mục tiêu dài hạn', short: 'Mục tiêu ngắn hạn', 'edit-long': 'Mục tiêu dài hạn', 'edit-short': 'Mục tiêu ngắn hạn', period: 'Tên thời gian đánh giá' };
    titles['edit-period'] = 'Chỉnh sửa kết quả theo tuần';
    labels['edit-period'] = 'Trạng thái kết quả';
    labels.domain = 'Lĩnh vực';
    labels['edit-period'] = 'Tên thời gian';
    $('#goal-dialog-title').textContent = titles[mode];
    $('#goal-dialog-description').textContent = mode === 'domain' ? 'Chọn lĩnh vực đã được cấu hình trong Cài đặt.' : isSettingsDomainEdit ? 'Cập nhật tên và icon hiển thị của lĩnh vực.' : isDomainEdit ? 'Cập nhật nhanh toàn bộ thông tin của lĩnh vực này.' : mode === 'period' ? 'Thêm một mốc thời gian để theo dõi kết quả.' : 'Thông tin sẽ được hiển thị đồng thời ở Kế hoạch giáo dục và Tổng quan.';
    $('#goal-dialog-mode').value = mode;
    $('#goal-dialog-id').value = goal?.id || '';
    $('#goal-dialog-short-index').value = shortIndex ?? '';
    $('#goal-dialog-label').textContent = labels[mode];
    $('#goal-dialog-submit').textContent = isEdit ? 'Lưu thay đổi' : 'Lưu';
    $('#goal-dialog-domain').innerHTML = domains.map((domain) => `<option value="${esc(domain)}">${esc(domain)}</option>`).join('');
    const configuredDomain = goal?.domain || domainNameOverride || currentGoals[0]?.domain || domains[0];
    $('#goal-dialog-domain').value = configuredDomain;
    if (isDomainEdit) $('#goal-dialog-domain-name').innerHTML = domains.map((domain) => `<option value="${esc(domain)}">${esc(domain)}</option>`).join('');
    $('#goal-dialog-domain-name').value = configuredDomain;
    $('#goal-dialog-domain-name').dataset.previousDomain = configuredDomain;
    const longTermOptions = [...new Set(state.goals.filter((item) => item.domain === configuredDomain).map((item) => item.longTerm?.trim()).filter(Boolean))];
    $('#goal-dialog-long-options').innerHTML = longTermOptions.map((option) => `<option value="${esc(option)}"></option>`).join('');
    $('#goal-dialog-icon-value').value = state.domainIcons?.[configuredDomain] || defaultDomainIcons[configuredDomain] || domainIconOptions[0].value;
    $('#goal-dialog-icon-picker').innerHTML = domainIconPicker($('#goal-dialog-icon-value').value);
    if (isDomainEdit || isSettingsDomainEdit) renderDomainEditFields(goal, domainNameOverride);
    $('#goal-dialog-text').value = mode === 'edit-short' && goal ? goal.shortTerm?.[shortIndex] || '' : mode === 'edit-long' ? goal?.longTerm || '' : '';
    $('#goal-dialog-status').value = isPeriodEdit && goal ? goal.statuses?.[shortIndex] || 'Chưa đạt' : 'Chưa đạt';
    $('#goal-dialog-description').textContent = isPeriodEdit ? 'Chỉ cập nhật trạng thái của tuần đang chọn.' : mode === 'period' ? 'Thêm một mốc thời gian để theo dõi kết quả.' : 'Thông tin sẽ được hiển thị đồng thời ở Kế hoạch giáo dục và Tổng quan.';
    $('#goal-period-field').hidden = !isPeriodEdit;
    $('#goal-dialog-period-label').value = isPeriodEdit ? periodsForChild(goal?.childId || state.selectedChildId)[shortIndex] || weekLabels[shortIndex] || '' : '';
    $('#goal-dialog-description').textContent = mode === 'domain' ? 'Chọn lĩnh vực đã được cấu hình trong Cài đặt.' : isSettingsDomainEdit ? 'Cập nhật tên và icon hiển thị của lĩnh vực.' : isPeriodEdit ? 'Cập nhật tên thời gian và trạng thái của tuần đang chọn.' : mode === 'period' ? 'Thêm một mốc thời gian để theo dõi kết quả.' : 'Thông tin sẽ được hiển thị đồng thời ở Kế hoạch giáo dục và Tổng quan.';
    $('#goal-domain-name-field').hidden = !isDomainEdit && !isSettingsDomainEdit;
    $('#goal-domain-icon-field').hidden = !isSettingsDomainEdit;
    $('#goal-edit-long-field').hidden = !isDomainEdit;
    $('#goal-edit-short-field').hidden = !isDomainEdit;
    $('#goal-edit-results-field').hidden = !isDomainEdit;
    $('#goal-edit-note-field').hidden = !isDomainEdit;
    $('#goal-dialog-domain').closest('#goal-domain-field').hidden = isDomainEdit || isSettingsDomainEdit || !(mode === 'domain' || mode === 'long');
    $('#goal-parent-field').hidden = isDomainEdit || isSettingsDomainEdit || !isShort || isEdit;
    $('#goal-text-field').hidden = isPeriodEdit || mode === 'domain' || isDomainEdit || isSettingsDomainEdit;
    // Khi sửa cả lĩnh vực, ô nội dung chung bị ẩn; không để native validation chặn submit form.
    $('#goal-dialog-text').required = !isPeriodEdit && mode !== 'domain' && !isSettingsDomainEdit && !isDomainEdit;
    $('#goal-status-field').hidden = !isPeriodEdit;
    $('#goal-domain-field').hidden = !(mode === 'domain' || mode === 'long');
    if (isPeriodEdit) $('#goal-domain-field').hidden = true;
    $('#goal-parent-field').hidden = !isShort || isEdit;
    const parentSelect = $('#goal-dialog-parent');
    parentSelect.innerHTML = currentGoals.map((item) => `<option value="${item.id}">${esc(item.longTerm || 'Chưa nhập mục tiêu')}</option>`).join('');
    if (goal && isEdit) parentSelect.value = goal.id;
    $('#goal-modal').classList.toggle('small-edit-modal', isEdit && !isDomainEdit && !isSettingsDomainEdit);
    $('#goal-modal').classList.toggle('domain-edit-modal', isDomainEdit || isSettingsDomainEdit || mode === 'domain');
    $('#goal-modal').removeAttribute('hidden');
    (isPeriodEdit ? $('#goal-dialog-period-label') : mode === 'domain' ? $('#goal-dialog-domain') : isDomainEdit || isSettingsDomainEdit ? $('#goal-dialog-domain-name') : $('#goal-dialog-text')).focus();
  }
  function closeGoalModal() { $('#goal-modal').classList.remove('small-edit-modal', 'domain-edit-modal'); $('#goal-modal').setAttribute('hidden', ''); }

  document.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action="delete-domain-setting"]');
    if (!action || state.view !== 'plan-new') return;
    const domainName = action.dataset.domainSettingName;
    const child = selectedChild();
    const childKey = String(child?.id || state.selectedChildId);
    const hiddenDomains = hiddenPlanNewDomainsForChild(childKey);
    if (window.confirm('Ẩn lĩnh vực này khỏi Kế hoạch giáo dục? Dữ liệu vẫn được giữ trong Cài đặt và Tổng quan.')) {
      if (!hiddenDomains.includes(domainName)) planNewHiddenDomainsByChild[childKey] = [...hiddenDomains, domainName];
      persistPlanNewHiddenDomains();
      if (planNewFilter === domainName) planNewFilter = '';
      renderPlanNew();
    }
    event.stopImmediatePropagation();
  });

  document.addEventListener('click', (event) => {
    const viewButton = event.target.closest('[data-view]');
    if (viewButton) { if (viewButton.dataset.view === 'objective') { draftShortGoals = [...defaultShortGoals]; draftLongTerm = defaultLongTerm; } navigate(viewButton.dataset.view); return; }
    const calendarCell = event.target.closest('[data-calendar-date]');
    if (calendarCell) { openCalendarSchedulePopup(calendarCell.dataset.calendarDate); return; }
    const calendarAction = event.target.closest('[data-calendar-action]')?.dataset.calendarAction;
    if (calendarAction) {
      if (calendarAction === 'today') overviewCalendarCursor = new Date(overviewCalendarToday.getFullYear(), overviewCalendarToday.getMonth(), 1);
      if (calendarAction === 'previous') overviewCalendarCursor = new Date(overviewCalendarCursor.getFullYear(), overviewCalendarCursor.getMonth() - 1, 1);
      if (calendarAction === 'next') overviewCalendarCursor = new Date(overviewCalendarCursor.getFullYear(), overviewCalendarCursor.getMonth() + 1, 1);
      renderOverview();
      return;
    }
    const childChoice = event.target.closest('[data-child-choice]');
    if (childChoice) {
      state.selectedChildId = Number(childChoice.dataset.childId);
      persist();
      if (childChoice.dataset.childChoice === 'overview') renderOverview();
      if (childChoice.dataset.childChoice === 'plan') renderPlan();
      if (childChoice.dataset.childChoice === 'plan-new') { planNewOpenDomains = state.planNewOpenDomainsByChild?.[String(state.selectedChildId)] || {}; state.planNewOpenDomains = planNewOpenDomains; renderPlanNew(); }
      return;
    }
    const iconChoice = event.target.closest('[data-domain-icon]');
    if (iconChoice) {
      const picker = iconChoice.closest('.domain-icon-picker');
      picker?.querySelectorAll('[data-domain-icon]').forEach((item) => item.classList.toggle('selected', item === iconChoice));
      if (iconChoice.closest('#new-domain-icon-picker')) $('#new-domain-icon').value = iconChoice.dataset.domainIcon;
      if (iconChoice.closest('#goal-dialog-icon-picker')) $('#goal-dialog-icon-value').value = iconChoice.dataset.domainIcon;
      return;
    }
    const domainSelect = event.target.closest('[data-domain-setting]');
    if (domainSelect) { state.domainIcons[domainSelect.dataset.domainSetting] = domainSelect.value; persist(); renderSettings(); applyTheme(); return; }
    const action = event.target.closest('[data-action]');
    if (action) {
      if (action.dataset.action === 'open-child') openChildModal();
      if (action.dataset.action === 'view-plan') navigate('plan');
      if (action.dataset.action === 'toggle-theme') setTheme(!darkMode);
      if (action.dataset.action === 'close-child') closeChildModal();
      if (action.dataset.action === 'close-calendar-popup') closeCalendarSchedulePopup();
      if (action.dataset.action === 'close-note') closeNoteModal();
      if (action.dataset.action === 'objective') { draftShortGoals = [...defaultShortGoals]; draftLongTerm = defaultLongTerm; navigate('objective'); }
      if (action.dataset.action === 'print') window.print();
      if (action.dataset.action === 'save-plan-new') {
        state.planNewOpenDomains = planNewOpenDomains;
        state.planNewOpenDomainsByChild = { ...(state.planNewOpenDomainsByChild || {}), [String(state.selectedChildId)]: planNewOpenDomains };
        persist();
        action.innerHTML = `${icon('save')}Đã lưu`;
        window.setTimeout(() => { if (action.isConnected) action.innerHTML = `${icon('save')}Lưu`; }, 1200);
        return;
      }
      if (action.dataset.action === 'edit-domain-setting') {
        const domainName = action.dataset.domainSettingName;
        const goal = state.goals.find((item) => item.childId === state.selectedChildId && item.domain === domainName) || state.goals.find((item) => item.domain === domainName);
        openGoalModal('edit-domain-setting', goal?.id || 0, undefined, domainName);
      }
      if (action.dataset.action === 'delete-domain-setting') {
        const domainName = action.dataset.domainSettingName;
        if (state.domains.length <= 1) window.alert('Cần giữ lại ít nhất một lĩnh vực.');
        else if (window.confirm(`Xóa lĩnh vực “${domainName}” và các mục tiêu thuộc lĩnh vực này?`)) {
          state.domains = state.domains.filter((item) => item !== domainName);
          domains = state.domains;
          delete state.domainIcons[domainName];
          state.goals = state.goals.filter((goal) => goal.domain !== domainName);
          persist();
          renderSettings();
          applyTheme();
        }
      }
      if (action.dataset.action === 'edit-domain-add-short') { const list = $('#goal-dialog-short-list'); const index = list.children.length; list.insertAdjacentHTML('beforeend', `<div class="quick-short-row"><input data-edit-domain-short placeholder="Mục tiêu ngắn hạn ${index + 1}" /><button type="button" class="row-action delete" data-action="edit-domain-remove-short" data-short-index="${index}" aria-label="Xóa mục tiêu ngắn hạn">${icon('trash')}</button></div>`); }
      if (action.dataset.action === 'edit-domain-remove-short') { const row = action.closest('.quick-short-row'); if ($('#goal-dialog-short-list').children.length > 1) row?.remove(); }
      if (action.dataset.action === 'edit-domain-add-period') { const list = $('#goal-dialog-results-list'); const index = list.children.length; list.insertAdjacentHTML('beforeend', `<div class="quick-result-row"><input class="quick-period-label" data-edit-domain-period data-period-index="${index}" value="Tuần ${index + 1}" aria-label="Tên thời gian mới" /><div class="select-wrap"><select data-edit-domain-status data-period-index="${index}">${statuses.map((item) => `<option>${item}</option>`).join('')}</select>${icon('chevron')}</div><button type="button" class="row-action delete" data-action="edit-domain-remove-period" data-period-index="${index}" aria-label="Xóa kết quả theo tuần">${icon('trash')}</button></div>`); }
      if (action.dataset.action === 'edit-domain-remove-period') { const list = $('#goal-dialog-results-list'); const row = action.closest('.quick-result-row'); if (list.children.length > 1) row?.remove(); }
    }
    if (event.target.id === 'calendar-schedule-popup') closeCalendarSchedulePopup();
    const noteButton = event.target.closest('.row-note button');
    if (noteButton) { const select = noteButton.closest('tr')?.querySelector('[data-goal-id]'); if (select) openNoteModal(Number(select.dataset.goalId)); return; }
    const previewToggle = event.target.closest('[data-preview-week]'); if (previewToggle) { const panel = previewToggle.closest('.preview-week'); document.querySelectorAll('.preview-week').forEach((item) => item.classList.remove('open')); panel.classList.add('open'); const list = panel.querySelector('ol'); list.innerHTML = draftShortGoals.filter((value) => value.trim()).map((value) => `<li>${esc(value)}</li>`).join(''); }
    const weekTab = event.target.closest('[data-week-tab]'); if (weekTab) { document.querySelectorAll('.week-tab').forEach((item) => item.classList.toggle('active', item === weekTab)); }
    const shareChild = event.target.closest('[data-share-child]'); if (shareChild) { copyChildShareLink(Number(shareChild.dataset.shareChild)); return; }
    const planChild = event.target.closest('[data-plan-child]'); if (planChild) { state.selectedChildId = Number(planChild.dataset.planChild); navigate('plan'); }
    const editChild = event.target.closest('[data-edit-child]'); if (editChild) openChildModal(Number(editChild.dataset.editChild));
    const deleteChild = event.target.closest('[data-delete-child]'); if (deleteChild) { const child = childById(deleteChild.dataset.deleteChild); if (child && window.confirm(`Xóa hồ sơ của ${child.name}?`)) { state.children = state.children.filter((item) => item.id !== child.id); state.goals = state.goals.filter((goal) => goal.childId !== child.id); if (state.selectedChildId === child.id) state.selectedChildId = state.children[0]?.id || 0; persist(); render(); } }
    if (event.target.closest('[data-add-short]')) { draftShortGoals.push(''); renderObjective(); updateObjectivePreview(); }
    const remove = event.target.closest('[data-remove-short]'); if (remove) { if (draftShortGoals.length > 1) draftShortGoals.splice(Number(remove.dataset.removeShort), 1); renderObjective(); updateObjectivePreview(); }
  });
  document.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]');
    if (!action) return;
    const id = Number(action.dataset.goalId);
    const goal = state.goals.find((item) => item.id === id);
    if (action.dataset.action === 'close-goal') closeGoalModal();
    if (action.dataset.action === 'add-domain') openGoalModal('domain');
    if (action.dataset.action === 'toggle-new-domain') { const domain = action.dataset.newDomain; planNewOpenDomains[domain] = !(planNewOpenDomains[domain] ?? false); state.planNewOpenDomains = planNewOpenDomains; state.planNewOpenDomainsByChild = { ...(state.planNewOpenDomainsByChild || {}), [String(state.selectedChildId)]: planNewOpenDomains }; renderPlanNew(); return; }
    if (action.dataset.action === 'collapse-new-domains') { planNewOpenDomains = Object.fromEntries((state.domains || domains).map((domain) => [domain, false])); state.planNewOpenDomains = planNewOpenDomains; state.planNewOpenDomainsByChild = { ...(state.planNewOpenDomainsByChild || {}), [String(state.selectedChildId)]: planNewOpenDomains }; renderPlanNew(); return; }
    if (action.dataset.action === 'expand-new-domains') { planNewOpenDomains = Object.fromEntries((state.domains || domains).map((domain) => [domain, true])); state.planNewOpenDomains = planNewOpenDomains; state.planNewOpenDomainsByChild = { ...(state.planNewOpenDomainsByChild || {}), [String(state.selectedChildId)]: planNewOpenDomains }; renderPlanNew(); return; }
    if (action.dataset.action === 'toggle-domain' && goal) { state.collapsedGoalIds = state.collapsedGoalIds.includes(goal.id) ? state.collapsedGoalIds.filter((item) => item !== goal.id) : [...state.collapsedGoalIds, goal.id]; persist(); renderPlan(); }
    if (action.dataset.action === 'edit-domain' && goal) openGoalModal('edit-domain', goal.id);
    if (action.dataset.action === 'add-long') { planNewPendingDomain = action.dataset.planNewDomain || ''; openGoalModal('long'); if (planNewPendingDomain && $('#goal-dialog-domain')) $('#goal-dialog-domain').value = planNewPendingDomain; }
    if (action.dataset.action === 'add-short') {
      const targetGoal = action.dataset.goalId ? state.goals.find((item) => item.id === Number(action.dataset.goalId)) : state.goals.find((item) => item.childId === state.selectedChildId);
      if (targetGoal) openGoalModal('short', targetGoal.id); else window.alert('Hãy thêm mục tiêu dài hạn trước.');
    }
    if (action.dataset.action === 'add-period') openGoalModal('period');
    if (action.dataset.action === 'edit-period') {
      const periodIndex = Number(action.dataset.periodIndex);
      const goalId = Number(action.dataset.goalId);
      if (Number.isInteger(periodIndex) && goal && periodsForChild(goal.childId)[periodIndex] && goalId) openGoalModal('edit-period', goalId, periodIndex);
    }
    if (action.dataset.action === 'delete-period') {
      const periodIndex = Number(action.dataset.periodIndex);
      const currentPeriods = periodsForChild(state.selectedChildId);
      const periodLabel = currentPeriods[periodIndex];
      if (Number.isInteger(periodIndex) && periodLabel) {
        if (currentPeriods.length <= 1) {
          window.alert('Cần giữ lại ít nhất một mốc thời gian.');
        } else if (window.confirm(`Xóa mốc thời gian "${periodLabel}"?`)) {
          const nextPeriods = currentPeriods.filter((_, index) => index !== periodIndex);
          setPeriodsForChild(state.selectedChildId, nextPeriods);
          state.goals.filter((item) => item.childId === state.selectedChildId).forEach((item) => { item.statuses = (item.statuses || []).filter((_, index) => index !== periodIndex); });
          persist();
          render();
        }
      }
    }
    if (action.dataset.action === 'edit-long' && goal) openGoalModal('edit-long', goal.id);
    if (action.dataset.action === 'edit-short' && goal) openGoalModal('edit-short', goal.id, Number(action.dataset.shortIndex));
    if (action.dataset.action === 'open-note' && goal) openNoteModal(goal.id);
    if (action.dataset.action === 'delete-goal' && goal && window.confirm(`Xóa mục tiêu “${goal.longTerm || goal.domain}”?`)) { state.goals = state.goals.filter((item) => item.id !== goal.id); persist(); render(); }
    if (action.dataset.action === 'delete-short' && goal && window.confirm('Xóa mục tiêu ngắn hạn này?')) { goal.shortTerm = (goal.shortTerm || []).filter((_, index) => index !== Number(action.dataset.shortIndex)); persist(); render(); }
  });

  document.addEventListener('change', (event) => {
    const select = event.target;
    if (select.matches('[data-theme-toggle]')) { setTheme(select.checked); return; }
    if (select.id === 'overview-child-select') { state.selectedChildId = Number(select.value); renderOverview(); return; }
    if (select.id === 'plan-child-select') { state.selectedChildId = Number(select.value); renderPlan(); return; }
    if (select.matches('[data-plan-new-domain-filter]')) { planNewFilter = select.value; renderPlanNew(); return; }
    if (select.id === 'objective-child') { state.selectedChildId = Number(select.value); updateObjectivePreview(); }
    if (select.id === 'objective-domain') { updateObjectivePreview(); return; }
    if (select.id === 'child-color') { $('#child-color-swatch').className = `schedule-color-swatch ${select.value}`; return; }
    if (select.dataset.domainSetting) { state.domainIcons[select.dataset.domainSetting] = select.value; persist(); renderSettings(); applyTheme(); return; }
    if (select.dataset.goalId) { const goal = state.goals.find((item) => item.id === Number(select.dataset.goalId)); if (goal) { goal.statuses[Number(select.dataset.week)] = select.value; persist(); state.view === 'plan-new' ? renderPlanNew() : renderPlan(); } }
  });
  document.addEventListener('input', (event) => { if (event.target.matches('[data-goal-search]')) { const query = event.target.value.trim().toLowerCase(); const cards = [...document.querySelectorAll('[data-goal-card]')]; let visible = 0; cards.forEach((card) => { const matches = !query || card.dataset.search.includes(query); card.hidden = !matches; if (matches) visible += 1; }); const count = document.querySelector('[data-board-count]'); const footerCount = document.querySelector('[data-board-footer-count]'); if (count) count.textContent = String(visible); if (footerCount) footerCount.textContent = String(visible); return; } if (event.target.dataset.shortGoal !== undefined) { draftShortGoals[Number(event.target.dataset.shortGoal)] = event.target.value; updateObjectivePreview(); } if (event.target.id === 'objective-long') { draftLongTerm = event.target.value; updateObjectivePreview(); } });
  document.addEventListener('click', (event) => { const action = event.target.closest('[data-action]')?.dataset.action; if (action === 'edit-plan-info') openPlanInfoModal(); if (action === 'close-plan-info') closePlanInfoModal(); });
  document.addEventListener('submit', (event) => {
    if (event.target.id !== 'plan-info-form') return;
    event.preventDefault();
    const child = selectedChild();
    if (!child) return;
    child.planInfo = { planner: $('#plan-info-planner').value.trim(), planDate: birthdayDisplayValue($('#plan-info-date').value.trim()), evaluationDates: $('#plan-info-evaluation-dates').value.trim() };
    persist();
    closePlanInfoModal();
    render();
  });
  document.addEventListener('submit', (event) => {
    if (event.target.id !== 'domain-settings-form') return;
    event.preventDefault();
    const input = $('#new-domain-name');
    const value = input.value.trim();
    if (!value || domains.some((domain) => domain.toLowerCase() === value.toLowerCase())) return;
    domains.push(value);
    state.domainIcons[value] = $('#new-domain-icon').value || $('#new-domain-icon-picker .domain-icon-choice.selected')?.dataset.domainIcon || domainIconOptions[0].value;
    state.domains = [...domains];
    persist();
    renderSettings();
    applyTheme();
  });
  document.addEventListener('submit', (event) => {
    if (event.target.id !== 'goal-form') return;
    event.preventDefault();
    const mode = $('#goal-dialog-mode').value;
    const text = (mode === 'edit-domain' ? $('#goal-dialog-edit-long').value : mode === 'edit-domain-setting' ? $('#goal-dialog-domain-name').value : $('#goal-dialog-text').value).trim();
    const selectedDomain = $('#goal-dialog-domain').value.trim();
    const domainName = $('#goal-dialog-domain-name').value.trim();
    const selectedDomainIcon = $('#goal-dialog-icon-value').value || domainIconOptions[0].value;
    const periodLabel = $('#goal-dialog-period-label').value.trim();
    const status = $('#goal-dialog-status').value;
    const id = Number($('#goal-dialog-id').value);
    const shortIndex = Number($('#goal-dialog-short-index').value);
    if ((mode === 'domain' && !selectedDomain) || ((mode === 'edit-domain' || mode === 'edit-domain-setting') && !domainName)) { window.alert('Vui lòng chọn đầy đủ thông tin lĩnh vực.'); return; }
    if (mode !== 'edit-period' && mode !== 'domain' && mode !== 'edit-domain' && !text) { window.alert('Vui lòng nhập mục tiêu dài hạn.'); return; }
    if (mode === 'edit-period' && !periodLabel) { window.alert('Vui lòng nhập tên thời gian.'); return; }
    if (mode === 'domain') {
      state.goals.push({ id: Math.max(0, ...state.goals.map((item) => item.id)) + 1, childId: state.selectedChildId, domain: selectedDomain, longTerm: '', shortTerm: [], from: '01/07/2026', to: '30/08/2026', statuses: periodsForChild(state.selectedChildId).map(() => 'Chưa đạt') });
      state.domainIcons[selectedDomain] = state.domainIcons?.[selectedDomain] || defaultDomainIcons[selectedDomain] || domainIconOptions[0].value;
      const hiddenDomains = hiddenPlanNewDomainsForChild(state.selectedChildId);
      if (hiddenDomains.includes(selectedDomain)) {
        const childKey = String(state.selectedChildId);
        planNewHiddenDomainsByChild[childKey] = hiddenDomains.filter((domain) => domain !== selectedDomain);
        persistPlanNewHiddenDomains();
      }
    } else if (mode === 'edit-domain-setting') {
      const previousDomain = $('#goal-dialog-domain-name').dataset.previousDomain || domainName;
      state.domains = state.domains.map((item) => item === previousDomain ? domainName : item);
      domains = state.domains;
      state.goals.forEach((item) => { if (item.domain === previousDomain) item.domain = domainName; });
      if (previousDomain !== domainName) delete state.domainIcons[previousDomain];
      state.domainIcons[domainName] = selectedDomainIcon;
    } else if (mode === 'edit-domain') {
      const domainGoal = state.goals.find((item) => item.id === id);
      const previousDomain = domainGoal?.domain || $('#goal-dialog-domain-name').dataset.previousDomain || selectedDomain;
      const previousIcon = state.domainIcons?.[previousDomain] || defaultDomainIcons[previousDomain] || domainIconOptions[0].value;
      const shortTerm = [...document.querySelectorAll('[data-edit-domain-short]')].map((input) => input.value.trim()).filter(Boolean);
      const nextStatuses = [...document.querySelectorAll('[data-edit-domain-status]')].map((select) => select.value);
      const nextPeriodLabels = [...document.querySelectorAll('[data-edit-domain-period]')].map((input) => input.value.trim());
      const normalizedLabels = nextPeriodLabels.map((label) => label.toLocaleLowerCase());
      if (!domainGoal) { window.alert('Không tìm thấy lĩnh vực cần chỉnh sửa. Vui lòng đóng popup và mở lại.'); return; }
      if (!nextPeriodLabels.length || nextPeriodLabels.some((label) => !label) || new Set(normalizedLabels).size !== normalizedLabels.length) { window.alert('Tên thời gian theo tuần phải đầy đủ và không được trùng nhau.'); return; }
      const nextNote = $('#goal-dialog-note').value.trim();
      const childId = domainGoal.childId || state.selectedChildId;
      setPeriodsForChild(childId, nextPeriodLabels);
      state.goals.forEach((item) => { if (item.childId === childId && item.domain === previousDomain) { item.domain = domainName; item.longTerm = text; item.shortTerm = shortTerm; item.statuses = nextPeriodLabels.map((_, index) => nextStatuses[index] || item.statuses?.[index] || 'Chưa đạt'); item.note = nextNote; } });
      state.domains = state.domains.map((item) => item === previousDomain ? domainName : item);
      domains = state.domains;
      if (previousDomain !== domainName) delete state.domainIcons[previousDomain];
      state.domainIcons[domainName] = state.domainIcons?.[domainName] || previousIcon;
    } else if (mode === 'long') {
      state.goals.push({ id: Math.max(0, ...state.goals.map((item) => item.id)) + 1, childId: state.selectedChildId, domain: selectedDomain || domains[0], longTerm: text, shortTerm: [], from: '01/07/2026', to: '30/08/2026', statuses: periodsForChild(state.selectedChildId).map(() => 'Chưa đạt') });
    } else if (mode === 'edit-long') {
      const goal = state.goals.find((item) => item.id === id); if (goal) goal.longTerm = text;
    } else if (mode === 'short') {
      const goal = state.goals.find((item) => item.id === Number($('#goal-dialog-parent').value)); if (goal) goal.shortTerm = [...(goal.shortTerm || []), text];
    } else if (mode === 'edit-short') {
      const goal = state.goals.find((item) => item.id === id); if (goal) goal.shortTerm[shortIndex] = text;
    } else if (mode === 'period' && !periodsForChild(state.selectedChildId).includes(text)) {
      const nextPeriods = [...periodsForChild(state.selectedChildId), text];
      setPeriodsForChild(state.selectedChildId, nextPeriods);
      state.goals.filter((goal) => goal.childId === state.selectedChildId).forEach((goal) => goal.statuses.push('Chưa đạt'));
    } else if (mode === 'edit-period') {
      const goal = state.goals.find((item) => item.id === id);
      const childId = goal?.childId || state.selectedChildId;
      const childPeriods = periodsForChild(childId);
      if (goal && shortIndex >= 0) goal.statuses[shortIndex] = status;
      if (shortIndex >= 0 && !childPeriods.some((label, index) => index !== shortIndex && label.toLowerCase() === periodLabel.toLowerCase())) {
        setPeriodsForChild(childId, childPeriods.map((label, index) => index === shortIndex ? periodLabel : label));
      }
    }
    persist(); closeGoalModal(); render();
  });
  document.addEventListener('submit', (event) => {
    if (event.target.id !== 'objective-form') return;
    const form = event.target;
    [['objective-from', '01/07/2026'], ['objective-to', '30/08/2026']].forEach(([id, value]) => {
      let field = document.getElementById(id);
      if (!field) { field = document.createElement('input'); field.type = 'hidden'; field.id = id; form.appendChild(field); }
      field.value = value ?? '';
    });
  });
  document.addEventListener('submit', (event) => {
    if (event.target.id !== 'note-form') return;
    event.preventDefault();
    const goal = state.goals.find((item) => item.id === Number($('#note-goal-id').value));
    if (goal) { goal.note = $('#note-text').value.trim(); persist(); closeNoteModal(); renderPlan(); }
  });
  document.addEventListener('submit', (event) => {
    if (event.target.id === 'child-form') { event.preventDefault(); const id = Number($('#child-id').value); const teachingDays = [...document.querySelectorAll('[data-teaching-day]:checked')].map((input) => Number(input.value)).sort((a, b) => a - b); const teachingStartTime = $('#child-start-time').value; const teachingEndTime = $('#child-end-time').value; const scheduleError = $('#child-schedule-error'); if (teachingDays.length && (!teachingStartTime || !teachingEndTime)) { scheduleError.removeAttribute('hidden'); return; } scheduleError.setAttribute('hidden', ''); const data = { name: $('#child-name').value.trim(), birthday: birthdayDisplayValue($('#child-birthday').value.trim()), gender: $('#child-gender').value, note: $('#child-note').value.trim(), teachingDays, teachingStartTime, teachingEndTime, color: $('#child-color')?.value || scheduleColorOptions[0].value }; if (id) state.children = state.children.map((child) => child.id === id ? { ...data, id } : child); else { const newId = Math.max(0, ...state.children.map((child) => child.id)) + 1; state.children.push({ ...data, id: newId }); state.evaluationPeriodsByChild[String(newId)] = [...periodsForChild(state.selectedChildId)]; state.selectedChildId = newId; } persist(); closeChildModal(); render(); return; }
    if (event.target.id === 'objective-form') { event.preventDefault(); const shortTerm = draftShortGoals.map((item) => item.trim()).filter(Boolean); if (!shortTerm.length || !$('#objective-long').value.trim()) return; const childId = Number($('#objective-child').value); const goal = { id: Math.max(0, ...state.goals.map((item) => item.id)) + 1, childId, domain: $('#objective-domain').value, longTerm: $('#objective-long').value.trim(), shortTerm, from: $('#objective-from').value, to: $('#objective-to').value, statuses: periodsForChild(childId).map((_, index) => ['Manh nha', 'Manh nha', 'Chưa đạt', 'Chưa đạt'][index] || 'Chưa đạt') }; state.goals.push(goal); state.selectedChildId = goal.childId; persist(); navigate('plan'); }
  });
  document.addEventListener('input', (event) => {
    const input = event.target.closest('[data-plan-new-search]');
    if (!input) return;
    planNewSearch = input.value;
    const query = planNewSearch.trim().toLowerCase();
    const cards = [...document.querySelectorAll('#screen-plan-new .plan-new-domain')];
    let visible = 0;
    cards.forEach((card) => { const matches = !query || card.textContent.toLowerCase().includes(query); card.hidden = !matches; if (matches) visible += 1; });
    const count = document.querySelector('#screen-plan-new .plan-new-toolbar-count strong');
    if (count) count.textContent = String(visible);
  });
  document.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action="delete-domain-setting"]');
    if (action && state.view === 'plan-new') window.setTimeout(() => renderPlanNew(), 0);
  });
  function render() { document.body.classList.toggle('share-mode', shareMode); if (shareMode) { renderSharePage(); return; } renderOverview(); renderPlanNew(); renderChildren(); renderObjective(); renderSettings(); navigate(state.view); }
  applyTheme();
  render();
  if (window.GiaoAnCloud) {
    window.GiaoAnCloud.load().then((data) => {
      if (!data || typeof data !== 'object' || !Object.keys(data).length) {
        state.children = [];
        state.goals = [];
        state.evaluationPeriods = [...weekLabels];
        state.evaluationPeriodsByChild = {};
        state.selectedChildId = 0;
        localStorage.setItem(storageKey, JSON.stringify(persistentData()));
        render();
        return;
      }

      Object.keys(data).forEach((key) => {
        if (key !== 'children' && key !== 'goals') state[key] = data[key];
      });
      planNewOpenDomains = state.planNewOpenDomainsByChild?.[String(state.selectedChildId)] || (state.planNewOpenDomains && typeof state.planNewOpenDomains === 'object' ? state.planNewOpenDomains : {});
      if (Array.isArray(data.children)) state.children = data.children;
      if (Array.isArray(data.goals)) state.goals = data.goals;
      state.evaluationPeriods = normalizePeriods(state.evaluationPeriods, weekLabels);
      const savedPeriodsByChild = state.evaluationPeriodsByChild && typeof state.evaluationPeriodsByChild === 'object' ? state.evaluationPeriodsByChild : {};
      state.evaluationPeriodsByChild = Object.fromEntries(state.children.map((child) => [String(child.id), normalizePeriods(savedPeriodsByChild[String(child.id)], state.evaluationPeriods)]));
      state.selectedChildId = state.children[0]?.id || 0;
      weekLabels = periodsForChild(state.selectedChildId);
      localStorage.setItem(storageKey, JSON.stringify(persistentData()));
      render();
    }).catch((error) => {
      console.error('Không thể tải dữ liệu từ Google Sheet:', error);
    });
  }
})();
