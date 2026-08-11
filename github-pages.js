(function () {
  const storageKey = 'giaoan-child-plans-v2';
  const themeStorageKey = 'giaoan-theme';
  let weekLabels = ['Tuần 1 - 2', 'Tuần 3 - 4', 'Tuần 5 - 6', 'Tuần 7 - 8'];
  const statuses = ['Đạt', 'Manh nha', 'Chưa đạt'];
  const domains = ['Tương tác xã hội', 'Chú ý chung', 'Giao tiếp', 'Kỹ năng tự phục vụ'];
  const defaults = {
    evaluationPeriods: [...weekLabels],
    children: [
      { id: 1, name: 'Nguyễn Khánh Linh', birthday: '07/07/2021', gender: 'Nữ', note: 'Thích hoạt động có âm nhạc.' },
      { id: 2, name: 'Trần Minh Anh', birthday: '18/03/2021', gender: 'Nam', note: 'Cần nhắc nhẹ khi chuyển hoạt động.' }
    ],
    goals: [
      { id: 1, childId: 1, domain: 'Tương tác xã hội', longTerm: 'Duy trì tương tác với giáo viên 5–10 phút', shortTerm: ['Ngồi tại bàn 2–3 phút.', 'Ngồi học 5 phút.', 'Duy trì hoạt động 10 phút.'], from: '01/07/2026', to: '30/08/2026', statuses: ['Manh nha', 'Đạt', 'Manh nha', 'Chưa đạt'] },
      { id: 2, childId: 1, domain: 'Giao tiếp', longTerm: 'Tăng giao tiếp bằng mắt khi được gọi tên', shortTerm: ['Nhìn mặt giáo viên khi được gọi tên.', 'Duy trì giao tiếp mắt 2–3 giây.'], from: '01/07/2026', to: '30/08/2026', statuses: ['Manh nha', 'Manh nha', 'Đạt', 'Đạt'] },
      { id: 3, childId: 2, domain: 'Chú ý chung', longTerm: 'Nhìn theo người lớn và đồ vật được chỉ dẫn', shortTerm: ['Nhìn theo khi cô chỉ vào đồ vật gần.', 'Luân phiên nhìn người và đồ vật 2–3 lần.'], from: '01/07/2026', to: '30/08/2026', statuses: ['Chưa đạt', 'Manh nha', 'Đạt', 'Đạt'] }
    ]
  };
  defaults.children = [];
  defaults.goals = [];
  const loaded = (() => { try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; } })();
  const state = { ...(loaded && typeof loaded === 'object' ? loaded : {}), evaluationPeriods: loaded?.evaluationPeriods || defaults.evaluationPeriods, children: loaded?.children || defaults.children, goals: loaded?.goals || defaults.goals, selectedChildId: (loaded?.children || defaults.children)[0]?.id || 0, view: 'plan' };
  weekLabels = state.evaluationPeriods;
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
  const statusMarkup = (status, goalId, periodIndex, readOnly) => readOnly ? `<div class="status-select read-only ${status === 'Đạt' ? 'achieved' : status === 'Manh nha' ? 'emerging' : 'not-achieved'}"><span class="status-dot"></span><span>${esc(status)}</span></div>` : `<label class="status-select ${status === 'Đạt' ? 'achieved' : status === 'Manh nha' ? 'emerging' : 'not-achieved'}"><span class="status-dot"></span><select data-goal-id="${goalId}" data-week="${periodIndex}">${statuses.map((item) => `<option ${item === status ? 'selected' : ''}>${item}</option>`).join('')}</select>${icon('chevron')}</label>`;
  function renderGoalsBoard(goals) {
    const periods = state.evaluationPeriods?.length ? state.evaluationPeriods : weekLabels;
    const cards = goals.map((goal) => {
      const shortGoals = goal.shortTerm?.length ? goal.shortTerm.map((item, shortIndex) => `<div class="short-goal-row"><span class="short-goal-bullet"></span><span class="short-goal-text">${esc(item || 'Chưa nhập mục tiêu')}</span><span class="short-goal-actions"><button type="button" class="row-action edit" data-action="edit-short" data-goal-id="${goal.id}" data-short-index="${shortIndex}" aria-label="Sửa mục tiêu ngắn hạn">${icon('edit')}</button><button type="button" class="row-action delete" data-action="delete-short" data-goal-id="${goal.id}" data-short-index="${shortIndex}" aria-label="Xóa mục tiêu ngắn hạn">${icon('trash')}</button></span></div>`).join('') : '<p class="muted-copy">Chưa có mục tiêu ngắn hạn.</p>';
      const searchText = esc(`${goal.domain || ''} ${goal.longTerm || ''} ${(goal.shortTerm || []).join(' ')}`.toLowerCase());
      return `<article class="goal-card" data-goal-card data-search="${searchText}"><header class="goal-card-header"><div class="goal-domain-heading"><span class="goal-domain-icon">${icon('target')}</span><div><span class="goal-card-eyebrow">Lĩnh vực</span><h3>${esc(goal.domain || 'Chưa phân loại')}</h3></div></div><div class="goal-card-actions"><button type="button" class="goal-card-action edit" data-action="edit-long" data-goal-id="${goal.id}">${icon('edit')}Sửa</button><button type="button" class="goal-card-action delete" data-action="delete-goal" data-goal-id="${goal.id}">${icon('trash')}Xóa</button><button type="button" class="goal-card-note-button" data-action="open-note" data-goal-id="${goal.id}" aria-label="Ghi chú mục tiêu">${icon('note')}</button></div></header><div class="goal-card-main"><section class="goal-long-section"><h4>Mục tiêu dài hạn</h4><p>${esc(goal.longTerm || 'Chưa nhập mục tiêu')}</p><button type="button" class="text-action" data-action="edit-long" data-goal-id="${goal.id}">${icon('edit')}Chỉnh sửa mục tiêu dài hạn</button></section><section class="goal-short-section"><div class="goal-card-section-head"><h4>Mục tiêu ngắn hạn</h4><button type="button" class="outline-button compact" data-action="add-short" data-goal-id="${goal.id}">${icon('plus')}Thêm</button></div><div class="short-goal-list">${shortGoals}</div></section></div><section class="goal-results-section"><div class="goal-card-section-head"><div><h4>Kết quả theo tuần</h4><p>Cập nhật trạng thái trực tiếp theo từng giai đoạn.</p></div><button type="button" class="outline-button compact" data-action="add-period">${icon('plus')}Thêm thời gian</button></div><div class="goal-period-grid">${periods.map((label, periodIndex) => `<div class="goal-period"><div class="goal-period-label-row"><span class="goal-period-label">${esc(label)}</span><span class="period-actions"><button type="button" class="period-action" data-action="edit-period" data-period-index="${periodIndex}" aria-label="Sửa mốc ${esc(label)}">${icon('edit')}</button><button type="button" class="period-action delete" data-action="delete-period" data-period-index="${periodIndex}" aria-label="Xóa mốc ${esc(label)}">${icon('trash')}</button></span></div>${statusMarkup(goal.statuses?.[periodIndex] || 'Chưa đạt', goal.id, periodIndex, false)}</div>`).join('')}</div></section><footer class="goal-card-footer"><div><h4>Ghi chú</h4><p>${goal.note ? esc(goal.note) : '<span class="cell-placeholder">Chưa có ghi chú.</span>'}</p></div><button type="button" class="note-edit-button" data-action="open-note" data-goal-id="${goal.id}">${icon('note')}${goal.note ? 'Chỉnh sửa ghi chú' : 'Thêm ghi chú'}</button></footer></article>`;
    }).join('');
    const empty = `<div class="board-empty-state"><span class="board-empty-icon">${icon('target')}</span><strong>Chưa có mục tiêu phát triển</strong><span>Bắt đầu bằng cách thêm lĩnh vực hoặc mục tiêu dài hạn.</span><button type="button" class="button primary" data-action="add-long">${icon('plus')}Thêm mục tiêu</button></div>`;
    return `<div class="goals-board"><div class="board-toolbar"><div class="board-search">${icon('overview')}<input type="search" data-goal-search placeholder="Tìm kiếm lĩnh vực, mục tiêu..." aria-label="Tìm kiếm mục tiêu" /></div><span class="board-summary"><strong data-board-count>${goals.length}</strong> mục tiêu đang theo dõi</span><div class="board-actions"><button type="button" class="button board-secondary-action" data-action="add-domain">${icon('plus')}Thêm lĩnh vực</button><button type="button" class="button primary" data-action="add-long">${icon('plus')}Thêm mục tiêu</button></div></div><div class="goal-card-list" data-goal-card-list>${cards || empty}</div><div class="board-footer"><span>Hiển thị <strong data-board-footer-count>${goals.length}</strong> mục tiêu</span><span class="board-footer-hint">Mẹo: dùng nút Sửa/Xóa ngay trên từng thẻ để thao tác nhanh.</span></div></div>`;
  }
  function renderGoalsTable(goals, readOnly = false) {
    if (!readOnly) return renderGoalsBoard(goals);
    goals = [...new Set(goals.map((goal) => goal.domain))].flatMap((domain) => goals.filter((goal) => goal.domain === domain));
    const periods = state.evaluationPeriods?.length ? state.evaluationPeriods : weekLabels;
    const counts = goals.reduce((result, goal) => { result[goal.domain] = (result[goal.domain] || 0) + 1; return result; }, {});
    const rows = goals.map((goal, index) => {
      const first = index === 0 || goals[index - 1].domain !== goal.domain;
      const domainCell = first ? `<td class="domain-cell" rowspan="${counts[goal.domain]}"><span class="domain-icon">${icon('target')}</span><strong>${esc(goal.domain || 'Chưa phân loại')}</strong></td>` : '';
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

  function childSummaryMarkup(child) {
    return `<section class="child-summary">${avatar(child)}<div class="summary-name"><strong>${esc(child.name)}</strong><span>${icon('calendar')}Ngày sinh: ${esc(child.birthday)}</span><span>${icon('user')}Tuổi thực: 1 tuổi 11 tháng</span></div><div class="summary-meta"><span>${icon('user')}Người lập kế hoạch: Nguyễn Thị Vành Khuyên</span><span>${icon('calendar')}Ngày lập kế hoạch: 30/06/2026</span></div><div class="evaluation-summary"><strong>${icon('calendar')}Thông tin lượng giá</strong><span>Ngày lượng giá:</span><b>30/07/2026 và 30/08/2026</b></div></section>`;
  }

  function renderSharePage() {
    const main = $('.main-content');
    const child = state.children.find((item) => childNameSlug(item.name) === shareChildSlug);
    if (!child) { main.innerHTML = `<div class="share-page"><div class="share-loading"><strong>Không tìm thấy hồ sơ</strong><span>Đường dẫn có thể đã hết hiệu lực hoặc hồ sơ không tồn tại.</span></div></div>`; return; }
    const goals = state.goals.filter((goal) => goal.childId === child.id);
    const achieved = goals.reduce((total, goal) => total + (goal.statuses || []).filter((status) => status === 'Đạt').length, 0);
    main.innerHTML = `<div class="share-page"><div class="share-container"><header class="share-header"><div class="share-brand"><span class="share-brand-mark">${icon('target')}</span><div><strong>KẾ HOẠCH GIÁO DỤC</strong><small>Trang chia sẻ hồ sơ trẻ</small></div></div><span class="share-readonly">${icon('file')}Chỉ xem</span></header><section class="share-hero"><span class="share-eyebrow">HỒ SƠ TRẺ</span><h1>${esc(child.name)}</h1><p>Thông tin kế hoạch giáo dục được chia sẻ riêng cho hồ sơ này.</p></section>${childSummaryMarkup(child)}<div class="share-summary"><span><strong>${goals.length}</strong> mục tiêu đang theo dõi</span><span><strong>${achieved}</strong> kết quả đạt</span><span>Không cho phép chỉnh sửa</span></div><section class="share-goals"><div class="share-section-heading"><div><span class="share-eyebrow">KẾ HOẠCH GIÁO DỤC</span><h2>Mục tiêu phát triển</h2><p>Kết quả được hiển thị theo từng giai đoạn đánh giá.</p></div><span class="share-lock">${icon('file')}Chế độ chỉ xem</span></div>${renderGoalsTable(goals, true)}</section><footer class="share-footer">Đường dẫn này chỉ hiển thị thông tin của <strong>${esc(child.name)}</strong>.</footer></div></div>`;
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
  const scheduleColorCount = 6;
  const calendarDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  function scheduleEntriesForDate(date) {
    const weekday = date.getDay() === 0 ? 7 : date.getDay();
    return state.children.flatMap((child, childIndex) => (Array.isArray(child.teachingDays) && child.teachingDays.includes(weekday) ? [{ child, time: child.teachingStartTime && child.teachingEndTime ? `${child.teachingStartTime} - ${child.teachingEndTime}` : 'Chưa có giờ dạy', colorIndex: childIndex % scheduleColorCount }] : []));
  }
  function overviewCalendarMarkup() {
    const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const year = overviewCalendarCursor.getFullYear();
    const month = overviewCalendarCursor.getMonth();
    const monthTitle = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(overviewCalendarCursor);
    const title = monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);
    const todayKey = `${overviewCalendarToday.getFullYear()}-${overviewCalendarToday.getMonth()}-${overviewCalendarToday.getDate()}`;
    const cells = getOverviewCalendarCells(year, month);
    return `<section class="overview-calendar" aria-label="Lịch kế hoạch"><div class="overview-calendar-head"><div><span class="overview-calendar-kicker">LỊCH KẾ HOẠCH</span><strong>${title}</strong></div><div class="overview-calendar-controls"><button type="button" class="overview-calendar-today" data-calendar-action="today">Hôm nay</button><button type="button" class="overview-calendar-nav" data-calendar-action="previous" aria-label="Tháng trước">${icon('back')}</button><button type="button" class="overview-calendar-nav is-next" data-calendar-action="next" aria-label="Tháng sau">${icon('back')}</button><button type="button" class="overview-calendar-view">Tháng ${icon('chevron')}</button><span class="overview-calendar-icon">${icon('calendar')}</span></div></div><div class="overview-calendar-weekdays">${weekdays.map((day) => `<span>${day}</span>`).join('')}</div><div class="overview-calendar-days">${cells.map((cell, index) => { const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.day}`; const isToday = key === todayKey; const isSunday = index % 7 === 6; const entries = cell.muted ? [] : scheduleEntriesForDate(cell.date); const isScheduled = entries.length > 0; const classes = [cell.muted ? 'is-muted' : '', isSunday ? 'is-sunday' : '', isScheduled ? 'is-scheduled' : '', entries.length > 1 ? 'is-multi-scheduled' : '', entries.length === 1 ? `schedule-color-${entries[0].colorIndex}` : '', isToday ? 'is-today' : ''].filter(Boolean).join(' '); const eventMarkup = entries.length === 1 ? `<small class="calendar-event-name schedule-text-${entries[0].colorIndex}"><i></i>${esc(entries[0].child.name)}</small><small class="calendar-event-time">${esc(entries[0].time)}</small>` : entries.slice(0, 2).map((entry) => `<small class="calendar-event-name schedule-text-${entry.colorIndex}"><i></i>${esc(entry.child.name)}</small>`).join(''); return `<span class="${classes}" ${isScheduled ? `role="button" tabindex="0" data-calendar-date="${calendarDateKey(cell.date)}"` : ''}><b>${cell.day}</b>${eventMarkup}</span>`; }).join('')}</div></section>`;
  }
  function openCalendarSchedulePopup(dateKey) { const parts = dateKey.split('-').map(Number); const date = new Date(parts[0], parts[1] - 1, parts[2]); const entries = scheduleEntriesForDate(date); $('#calendar-popup-title').textContent = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date); $('#calendar-popup-list').innerHTML = entries.map((entry) => `<div class="calendar-popup-entry"><i class="schedule-dot schedule-color-${entry.colorIndex}"></i><div><strong>${esc(entry.child.name)}</strong><span>${esc(entry.time)}</span></div></div>`).join(''); $('#calendar-schedule-popup').removeAttribute('hidden'); }
  function closeCalendarSchedulePopup() { $('#calendar-schedule-popup').setAttribute('hidden', ''); }

  function renderOverview() {
    const child = selectedChild();
    if (!child) { $('#screen-overview').innerHTML = `<div class="empty-state"><h3>Chưa có dữ liệu tổng quan</h3><p>Vào Hồ sơ trẻ để thêm hồ sơ đầu tiên.</p>${button('Thêm trẻ', 'open-child', true)}</div>`; return; }
    const goals = state.goals.filter((goal) => goal.childId === child.id);
    const actions = `<div class="topbar-actions"><div class="date-pill">30/06/2026 ${icon('calendar')}</div>${button(`${icon('file')}Xem kế hoạch`, 'view-plan', true)}</div>`;
    $('#screen-overview').innerHTML = `${header('Tổng quan', 'Theo dõi nhanh kế hoạch giáo dục của các trẻ', actions)}${overviewCalendarMarkup()}<div class="overview-toolbar">${selectField('Đang xem tổng quan của', 'overview-child-select', state.children.map((item) => ({ value: item.id, label: item.name })), child.id)}</div>${childSummaryMarkup(child)}<div class="section-title-row"><div><h2>${icon('overview')}Mục tiêu đang theo dõi</h2><p>Thông tin chỉ hiển thị; chỉnh sửa tại Kế hoạch giáo dục.</p></div><div class="mini-legend"><span><i class="dot green"></i>Đạt</span><span><i class="dot yellow"></i>Manh nha</span><span><i class="dot gray"></i>Chưa đạt</span></div></div>${renderGoalsTable(goals, true)}`;
  }

  function renderOverviewLegacy() {
    const child = selectedChild();
    if (!child) { $('#screen-overview').innerHTML = `<div class="empty-state"><h3>Chưa có dữ liệu tổng quan</h3><p>Vào Hồ sơ trẻ để thêm hồ sơ đầu tiên.</p>${button('Thêm trẻ', 'open-child', true)}</div>`; return; }
    const goals = state.goals.filter((goal) => goal.childId === child.id);
    const achieved = goals.reduce((total, goal) => total + goal.statuses.filter((status) => status === 'Đạt').length, 0);
    const actions = `<div class="topbar-actions"><div class="date-pill">30/06/2026 ${icon('calendar')}</div>${button(`${icon('file')}Xem kế hoạch`, 'view-plan', true)}</div>`;
    $('#screen-overview').innerHTML = `${header('Tổng quan', 'Theo dõi nhanh kế hoạch giáo dục của các trẻ', actions)}<div class="overview-grid"><article class="overview-card"><span class="overview-card-label">Hồ sơ trẻ</span><strong>${state.children.length}</strong><small>đang được quản lý</small></article><article class="overview-card"><span class="overview-card-label">Mục tiêu đang theo dõi</span><strong>${goals.length}</strong><small>của ${esc(child.name)}</small></article><article class="overview-card success"><span class="overview-card-label">Kết quả đạt</span><strong>${achieved}</strong><small>trạng thái theo tuần</small></article></div><div class="overview-toolbar">${selectField('Đang xem tổng quan của', 'overview-child-select', state.children.map((item) => ({ value: item.id, label: item.name })), child.id)}</div><section class="child-summary">${avatar(child)}<div class="summary-name"><strong>${esc(child.name)}</strong><span>${icon('calendar')}Ngày sinh: ${esc(child.birthday)}</span><span>${icon('user')}Tuổi thực: 1 tuổi 11 tháng</span></div><div class="summary-meta"><span>${icon('user')}Người lập kế hoạch: Nguyễn Thị Vành Khuyên</span><span>${icon('calendar')}Ngày lập kế hoạch: 30/06/2026</span></div><div class="evaluation-summary"><strong>${icon('calendar')}Thông tin lượng giá</strong><span>Ngày lượng giá:</span><b>30/07/2026 và 30/08/2026</b></div></section><div class="section-title-row"><div><h2>${icon('overview')}Mục tiêu đang theo dõi</h2><p>Tổng hợp nhanh các mục tiêu của ${esc(child.name)}.</p></div><div class="mini-legend"><span><i class="dot green"></i>Đạt</span><span><i class="dot yellow"></i>Manh nha</span><span><i class="dot gray"></i>Chưa đạt</span></div></div><div class="overview-note">Chọn <strong>Kế hoạch giáo dục</strong> để cập nhật trạng thái chi tiết theo từng tuần.</div>`;
  }

  function renderPlan() {
    const child = selectedChild();
    if (!child) { $('#screen-plan').innerHTML = `<div class="empty-state"><h3>Chưa có hồ sơ trẻ</h3><p>Vào Hồ sơ trẻ để thêm thông tin trẻ mới.</p>${button('Thêm trẻ', 'open-child', true)}</div>`; return; }
    const childGoals = state.goals.filter((goal) => goal.childId === child.id);
    const orderedDomains = [...new Set(childGoals.map((goal) => goal.domain))];
    const goals = orderedDomains.flatMap((domain) => childGoals.filter((goal) => goal.domain === domain));
    const actions = `<div class="topbar-actions"><div class="date-pill">30/06/2026 ${icon('calendar')}</div>${button(`${icon('file')}Xuất PDF`, 'print', true)}</div>`;
    $('#screen-plan').innerHTML = `${header('Kế hoạch giáo dục', '', actions)}<div class="plan-toolbar">${selectField('Đang xem hồ sơ của', 'plan-child-select', state.children.map((item) => ({ value: item.id, label: item.name })), child.id)}<div class="plan-count"><span class="count-number">${goals.length}</span><span>mục tiêu đang theo dõi</span></div></div>${childSummaryMarkup(child)}<div class="section-title-row"><div><h2>${icon('calendar')}MỤC TIÊU PHÁT TRIỂN</h2></div><div class="mini-legend"><span><i class="dot green"></i>Đạt (Đ)</span><span><i class="dot yellow"></i>Manh nha (MN)</span><span><i class="dot gray"></i>Chưa đạt (CĐ)</span></div></div>${renderGoalsTable(goals, false)}`;
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
    const cards = state.children.map((child) => `<article class="child-card"><div class="child-card-head">${avatar(child, true)}<div><h3>${esc(child.name)}</h3><p>${esc(child.gender)} · Sinh ngày ${esc(child.birthday)}</p></div></div><div class="child-card-note">${icon('note')}${esc(child.note || 'Chưa có ghi chú')}</div><div class="child-card-actions"><div class="child-card-links"><button type="button" class="link-button" data-plan-child="${child.id}">Xem kế hoạch <span>→</span></button><button type="button" class="link-button share-link-button" data-share-child="${child.id}">${icon('share')}Chia sẻ</button></div><div><button type="button" class="icon-action edit" data-edit-child="${child.id}" aria-label="Chỉnh sửa ${esc(child.name)}">${icon('edit')}</button><button type="button" class="icon-action delete" data-delete-child="${child.id}" aria-label="Xóa ${esc(child.name)}">${icon('trash')}</button></div></div></article>`).join('');
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

  function renderSettings() {
    $('#screen-settings').innerHTML = `${header('Cài đặt', 'Tùy chỉnh cách bạn sử dụng kế hoạch giáo dục')}<div class="settings-card"><div class="settings-heading"><div class="settings-icon">${icon('settings')}</div><div><h2>Tùy chọn ứng dụng</h2><p>Các thay đổi được lưu trên thiết bị này.</p></div></div><label class="setting-row"><span><strong>Giao diện tối</strong><small>Đổi sang nền tối để sử dụng dễ chịu hơn vào buổi tối.</small></span><input type="checkbox" data-theme-toggle aria-label="Giao diện tối" /></label><div class="settings-save"><button type="button" class="button primary" data-action="save-settings">${icon('save')}Lưu cài đặt</button><span id="settings-saved" hidden>Đã lưu thay đổi</span></div></div>`;
  }

  function navigate(view) { if (shareMode) return; state.view = view; document.querySelectorAll('.screen').forEach((screen) => screen.classList.toggle('active', screen.id === `screen-${view}`)); document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === view)); if (view === 'overview') renderOverview(); if (view === 'plan') renderPlan(); if (view === 'children') renderChildren(); if (view === 'objective') renderObjective(); if (view === 'settings') renderSettings(); applyTheme(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function openChildModal(id) { const child = id ? childById(id) : null; const teachingDays = Array.isArray(child?.teachingDays) ? child.teachingDays : []; $('#child-modal-title').textContent = child ? 'Chỉnh sửa hồ sơ trẻ' : 'Thêm trẻ mới'; $('#child-id').value = child?.id || ''; $('#child-name').value = child?.name || ''; $('#child-birthday').value = birthdayInputValue(child?.birthday || ''); $('#child-gender').value = child?.gender || 'Nữ'; $('#child-note').value = child?.note || ''; $('#child-start-time').value = child?.teachingStartTime || ''; $('#child-end-time').value = child?.teachingEndTime || ''; $('#child-schedule-error').setAttribute('hidden', ''); document.querySelectorAll('[data-teaching-day]').forEach((input) => { input.checked = teachingDays.includes(Number(input.value)); }); $('#child-modal').removeAttribute('hidden'); $('#child-name').focus(); }
  function closeChildModal() { $('#child-modal').setAttribute('hidden', ''); }
  function openNoteModal(id) { const goal = state.goals.find((item) => item.id === Number(id)); if (!goal) return; $('#note-goal-id').value = goal.id; $('#note-text').value = goal.note || ''; $('#note-modal').removeAttribute('hidden'); $('#note-text').focus(); }
  function closeNoteModal() { $('#note-modal').setAttribute('hidden', ''); }
  function updateObjectivePreview() { const long = $('#objective-long'); const domain = $('#objective-domain'); if (!long || !domain) return; $('#preview-long').textContent = long.value || 'Chưa nhập mục tiêu'; $('#preview-domain').textContent = domain.value.toUpperCase(); const firstList = document.querySelector('.preview-week.open ol'); if (firstList) firstList.innerHTML = draftShortGoals.filter((value) => value.trim()).map((value) => `<li>${esc(value)}</li>`).join(''); const counter = document.querySelector('.objective-textarea small'); if (counter) counter.textContent = `${long.value.length}/500`; }

  function openGoalModal(mode, goalId, shortIndex) {
    const goal = state.goals.find((item) => item.id === Number(goalId));
    const currentGoals = state.goals.filter((item) => item.childId === state.selectedChildId);
    const isShort = mode === 'short' || mode === 'edit-short';
    const isEdit = mode === 'edit-long' || mode === 'edit-short' || mode === 'edit-period';
    const isPeriodEdit = mode === 'edit-period';
    const titles = { domain: 'Thêm lĩnh vực', long: 'Thêm mục tiêu dài hạn', short: 'Thêm mục tiêu ngắn hạn', 'edit-long': 'Chỉnh sửa mục tiêu dài hạn', 'edit-short': 'Chỉnh sửa mục tiêu ngắn hạn', period: 'Thêm thời gian kết quả' };
    const labels = { domain: 'Tên lĩnh vực', long: 'Mục tiêu dài hạn', short: 'Mục tiêu ngắn hạn', 'edit-long': 'Mục tiêu dài hạn', 'edit-short': 'Mục tiêu ngắn hạn', period: 'Tên thời gian đánh giá' };
    titles['edit-period'] = 'Sửa mốc thời gian';
    labels['edit-period'] = 'Tên thời gian đánh giá';
    $('#goal-dialog-title').textContent = titles[mode];
    $('#goal-dialog-description').textContent = mode === 'period' ? 'Thêm một mốc thời gian để theo dõi kết quả.' : 'Thông tin sẽ được hiển thị đồng thời ở Kế hoạch giáo dục và Tổng quan.';
    $('#goal-dialog-mode').value = mode;
    $('#goal-dialog-id').value = goal?.id || '';
    $('#goal-dialog-short-index').value = shortIndex ?? '';
    $('#goal-dialog-label').textContent = labels[mode];
    $('#goal-dialog-submit').textContent = isEdit ? 'Lưu thay đổi' : 'Lưu';
    $('#goal-dialog-domain').value = goal?.domain || currentGoals[0]?.domain || domains[0];
    $('#goal-dialog-text').value = mode === 'edit-short' && goal ? goal.shortTerm?.[shortIndex] || '' : mode === 'edit-long' ? goal?.longTerm || '' : '';
    if (isPeriodEdit) { $('#goal-dialog-description').textContent = 'Cập nhật tên mốc thời gian theo dõi kết quả.'; $('#goal-dialog-text').value = weekLabels[shortIndex] || ''; }
    $('#goal-domain-field').hidden = !(mode === 'domain' || mode === 'long');
    if (isPeriodEdit) $('#goal-domain-field').hidden = true;
    $('#goal-parent-field').hidden = !isShort || isEdit;
    const parentSelect = $('#goal-dialog-parent');
    parentSelect.innerHTML = currentGoals.map((item) => `<option value="${item.id}">${esc(item.longTerm || 'Chưa nhập mục tiêu')}</option>`).join('');
    if (goal && isEdit) parentSelect.value = goal.id;
    $('#goal-modal').removeAttribute('hidden');
    $('#goal-dialog-text').focus();
  }
  function closeGoalModal() { $('#goal-modal').setAttribute('hidden', ''); }

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
      if (action.dataset.action === 'save-settings') { $('#settings-saved').removeAttribute('hidden'); window.setTimeout(() => $('#settings-saved')?.setAttribute('hidden', ''), 2200); }
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
    if (action.dataset.action === 'add-long') openGoalModal('long');
    if (action.dataset.action === 'add-short') {
      const targetGoal = action.dataset.goalId ? state.goals.find((item) => item.id === Number(action.dataset.goalId)) : state.goals.find((item) => item.childId === state.selectedChildId);
      if (targetGoal) openGoalModal('short', targetGoal.id); else window.alert('Hãy thêm mục tiêu dài hạn trước.');
    }
    if (action.dataset.action === 'add-period') openGoalModal('period');
    if (action.dataset.action === 'edit-period') {
      const periodIndex = Number(action.dataset.periodIndex);
      if (Number.isInteger(periodIndex) && state.evaluationPeriods[periodIndex]) openGoalModal('edit-period', undefined, periodIndex);
    }
    if (action.dataset.action === 'delete-period') {
      const periodIndex = Number(action.dataset.periodIndex);
      const periodLabel = state.evaluationPeriods[periodIndex];
      if (Number.isInteger(periodIndex) && periodLabel) {
        if (state.evaluationPeriods.length <= 1) {
          window.alert('Cần giữ lại ít nhất một mốc thời gian.');
        } else if (window.confirm(`Xóa mốc thời gian "${periodLabel}"?`)) {
          state.evaluationPeriods.splice(periodIndex, 1);
          state.goals.forEach((item) => { item.statuses = (item.statuses || []).filter((_, index) => index !== periodIndex); });
          weekLabels = state.evaluationPeriods;
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
    if (select.id === 'objective-child') { state.selectedChildId = Number(select.value); updateObjectivePreview(); }
    if (select.id === 'objective-domain') { updateObjectivePreview(); return; }
    if (select.dataset.goalId) { const goal = state.goals.find((item) => item.id === Number(select.dataset.goalId)); if (goal) { goal.statuses[Number(select.dataset.week)] = select.value; persist(); renderPlan(); } }
  });
  document.addEventListener('input', (event) => { if (event.target.matches('[data-goal-search]')) { const query = event.target.value.trim().toLowerCase(); const cards = [...document.querySelectorAll('[data-goal-card]')]; let visible = 0; cards.forEach((card) => { const matches = !query || card.dataset.search.includes(query); card.hidden = !matches; if (matches) visible += 1; }); const count = document.querySelector('[data-board-count]'); const footerCount = document.querySelector('[data-board-footer-count]'); if (count) count.textContent = String(visible); if (footerCount) footerCount.textContent = String(visible); return; } if (event.target.dataset.shortGoal !== undefined) { draftShortGoals[Number(event.target.dataset.shortGoal)] = event.target.value; updateObjectivePreview(); } if (event.target.id === 'objective-long') { draftLongTerm = event.target.value; updateObjectivePreview(); } });
  document.addEventListener('submit', (event) => {
    if (event.target.id !== 'goal-form') return;
    event.preventDefault();
    const mode = $('#goal-dialog-mode').value;
    const text = $('#goal-dialog-text').value.trim();
    const id = Number($('#goal-dialog-id').value);
    const shortIndex = Number($('#goal-dialog-short-index').value);
    if (!text) return;
    if (mode === 'domain') {
      state.goals.push({ id: Math.max(0, ...state.goals.map((item) => item.id)) + 1, childId: state.selectedChildId, domain: text, longTerm: '', shortTerm: [], from: '01/07/2026', to: '30/08/2026', statuses: state.evaluationPeriods.map(() => 'Chưa đạt') });
    } else if (mode === 'long') {
      state.goals.push({ id: Math.max(0, ...state.goals.map((item) => item.id)) + 1, childId: state.selectedChildId, domain: $('#goal-dialog-domain').value.trim() || domains[0], longTerm: text, shortTerm: [], from: '01/07/2026', to: '30/08/2026', statuses: state.evaluationPeriods.map(() => 'Chưa đạt') });
    } else if (mode === 'edit-long') {
      const goal = state.goals.find((item) => item.id === id); if (goal) goal.longTerm = text;
    } else if (mode === 'short') {
      const goal = state.goals.find((item) => item.id === Number($('#goal-dialog-parent').value)); if (goal) goal.shortTerm = [...(goal.shortTerm || []), text];
    } else if (mode === 'edit-short') {
      const goal = state.goals.find((item) => item.id === id); if (goal) goal.shortTerm[shortIndex] = text;
    } else if (mode === 'period' && !state.evaluationPeriods.includes(text)) {
      state.evaluationPeriods.push(text);
      state.goals.forEach((goal) => goal.statuses.push('Chưa đạt'));
      weekLabels = state.evaluationPeriods;
    } else if (mode === 'edit-period') {
      const nextPeriods = [...state.evaluationPeriods];
      if (shortIndex >= 0 && shortIndex < nextPeriods.length && !nextPeriods.some((label, index) => index !== shortIndex && label === text)) {
        nextPeriods[shortIndex] = text;
        state.evaluationPeriods = nextPeriods;
        weekLabels = nextPeriods;
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
    if (event.target.id === 'child-form') { event.preventDefault(); const id = Number($('#child-id').value); const teachingDays = [...document.querySelectorAll('[data-teaching-day]:checked')].map((input) => Number(input.value)).sort((a, b) => a - b); const teachingStartTime = $('#child-start-time').value; const teachingEndTime = $('#child-end-time').value; const scheduleError = $('#child-schedule-error'); if (teachingDays.length && (!teachingStartTime || !teachingEndTime)) { scheduleError.removeAttribute('hidden'); return; } scheduleError.setAttribute('hidden', ''); const data = { name: $('#child-name').value.trim(), birthday: birthdayDisplayValue($('#child-birthday').value.trim()), gender: $('#child-gender').value, note: $('#child-note').value.trim(), teachingDays, teachingStartTime, teachingEndTime }; if (id) state.children = state.children.map((child) => child.id === id ? { ...data, id } : child); else { const newId = Math.max(0, ...state.children.map((child) => child.id)) + 1; state.children.push({ ...data, id: newId }); state.selectedChildId = newId; } persist(); closeChildModal(); render(); return; }
    if (event.target.id === 'objective-form') { event.preventDefault(); const shortTerm = draftShortGoals.map((item) => item.trim()).filter(Boolean); if (!shortTerm.length || !$('#objective-long').value.trim()) return; const goal = { id: Math.max(0, ...state.goals.map((item) => item.id)) + 1, childId: Number($('#objective-child').value), domain: $('#objective-domain').value, longTerm: $('#objective-long').value.trim(), shortTerm, from: $('#objective-from').value, to: $('#objective-to').value, statuses: ['Manh nha', 'Manh nha', 'Chưa đạt', 'Chưa đạt'] }; state.goals.push(goal); state.selectedChildId = goal.childId; persist(); navigate('plan'); }
  });
  function render() { document.body.classList.toggle('share-mode', shareMode); if (shareMode) { renderSharePage(); return; } renderOverview(); renderPlan(); renderChildren(); renderObjective(); renderSettings(); navigate(state.view); }
  applyTheme();
  render();
  if (window.GiaoAnCloud) {
    window.GiaoAnCloud.load().then((data) => {
      if (!data || typeof data !== 'object' || !Object.keys(data).length) {
        state.children = [];
        state.goals = [];
        state.evaluationPeriods = [...weekLabels];
        state.selectedChildId = 0;
        localStorage.setItem(storageKey, JSON.stringify(persistentData()));
        render();
        return;
      }

      Object.keys(data).forEach((key) => {
        if (key !== 'children' && key !== 'goals') state[key] = data[key];
      });
      if (Array.isArray(data.children)) state.children = data.children;
      if (Array.isArray(data.goals)) state.goals = data.goals;
      if (Array.isArray(state.evaluationPeriods)) weekLabels = state.evaluationPeriods;
      state.selectedChildId = state.children[0]?.id || 0;
      localStorage.setItem(storageKey, JSON.stringify(persistentData()));
      render();
    }).catch((error) => {
      console.error('Không thể tải dữ liệu từ Google Sheet:', error);
    });
  }
})();
