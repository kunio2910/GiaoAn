(function () {
  const storageKey = 'giaoan-child-plans-v2';
  const weekLabels = ['Tuần 1 - 2', 'Tuần 3 - 4', 'Tuần 5 - 6', 'Tuần 7 - 8'];
  const statuses = ['Đạt', 'Manh nha', 'Chưa đạt'];
  const domains = ['Tương tác xã hội', 'Chú ý chung', 'Giao tiếp', 'Kỹ năng tự phục vụ'];
  const defaults = {
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
  const loaded = (() => { try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch (_) { return null; } })();
  const state = { children: loaded?.children || defaults.children, goals: loaded?.goals || defaults.goals, selectedChildId: (loaded?.children || defaults.children)[0]?.id || 0, view: 'plan' };
  let draftShortGoals = ['', ''];
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const icon = (name, className = '') => `<svg class="${className}"><use href="#icon-${name}"></use></svg>`;
  const initials = (name) => String(name).split(' ').map((part) => part[0]).slice(-2).join('');
  const persist = () => localStorage.setItem(storageKey, JSON.stringify({ children: state.children, goals: state.goals }));
  const childById = (id) => state.children.find((child) => child.id === Number(id));
  const selectedChild = () => childById(state.selectedChildId) || state.children[0];

  function header(title, subtitle, action) {
    return `<header class="topbar"><div class="topbar-title"><div><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div></div>${action || ''}</header>`;
  }
  function button(label, action, primary = false) { return `<button type="button" class="button ${primary ? 'primary' : ''}" data-action="${action}">${label}</button>`; }
  function avatar(child, small = false) { return `<div class="child-avatar ${small ? 'small' : ''}"><span>${esc(initials(child.name))}</span></div>`; }
  function selectField(label, id, options, selected, extra = '') { return `<label class="field"><span>${label}</span><div class="select-wrap"><select id="${id}" ${extra}>${options.map((option) => `<option value="${esc(option.value ?? option)}" ${String(option.value ?? option) === String(selected) ? 'selected' : ''}>${esc(option.label ?? option)}</option>`).join('')}</select>${icon('chevron')}</div></label>`; }

  function renderPlan() {
    const child = selectedChild();
    if (!child) { $('#screen-plan').innerHTML = `<div class="empty-state"><h3>Chưa có hồ sơ trẻ</h3><p>Vào Hồ sơ trẻ để thêm thông tin trẻ mới.</p>${button('Thêm trẻ', 'open-child', true)}</div>`; return; }
    const goals = state.goals.filter((goal) => goal.childId === child.id);
    const rows = goals.length ? goals.map((goal) => `<tr><td><span class="domain-badge">${icon('target')}${esc(goal.domain)}</span></td><td class="long-term-cell">${esc(goal.longTerm)}<small>${esc(goal.from)} – ${esc(goal.to)}</small></td><td class="short-term-cell"><ul>${goal.shortTerm.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></td>${goal.statuses.map((status, week) => `<td class="result-cell"><label class="status-select ${status === 'Đạt' ? 'achieved' : status === 'Manh nha' ? 'emerging' : 'not-achieved'}"><span class="status-dot"></span><select data-goal-id="${goal.id}" data-week="${week}">${statuses.map((item) => `<option ${item === status ? 'selected' : ''}>${item}</option>`).join('')}</select>${icon('chevron')}</label></td>`).join('')}<td class="row-note"><button type="button" aria-label="Ghi chú mục tiêu">${icon('note')}</button></td></tr>`).join('') : `<tr><td colspan="8"><div class="empty-state"><h3>Chưa có mục tiêu phát triển</h3><p>Hãy thêm mục tiêu riêng cho trẻ để bắt đầu theo dõi.</p></div></td></tr>`;
    $('#screen-plan').innerHTML = `${header('Kế hoạch giáo dục', 'Theo dõi mục tiêu phát triển riêng cho từng trẻ', button(`${icon('plus')}Thêm mục tiêu`, 'objective', true))}<div class="plan-toolbar">${selectField('Đang xem hồ sơ của', 'plan-child-select', state.children.map((item) => ({ value: item.id, label: item.name })), child.id)}<div class="plan-count"><span class="count-number">${goals.length}</span><span>mục tiêu đang theo dõi</span></div></div><section class="child-summary">${avatar(child)}<div class="summary-name"><strong>${esc(child.name)}</strong><span>${icon('calendar')}Ngày sinh: ${esc(child.birthday)}</span><span>${icon('user')}Giới tính: ${esc(child.gender)}</span></div><div class="summary-meta"><span>${icon('target')}Mục tiêu được cài đặt riêng cho trẻ</span><span>${esc(child.note || 'Chưa có ghi chú cho trẻ này.')}</span></div></section><div class="section-title-row"><div><h2>${icon('target')}Mục tiêu phát triển</h2><p>Các mục tiêu được cài đặt riêng cho ${esc(child.name)}.</p></div><div class="mini-legend"><span><i class="dot green"></i>Đạt</span><span><i class="dot yellow"></i>Manh nha</span><span><i class="dot gray"></i>Chưa đạt</span></div></div><div class="table-scroll"><table class="goals-table"><thead><tr><th>Lĩnh vực</th><th>Mục tiêu dài hạn</th><th>Mục tiêu ngắn hạn</th>${weekLabels.map((label) => `<th>${label}</th>`).join('')}<th>Ghi chú</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function renderChildren() {
    const cards = state.children.map((child) => `<article class="child-card"><div class="child-card-head">${avatar(child, true)}<div><h3>${esc(child.name)}</h3><p>${esc(child.gender)} · Sinh ngày ${esc(child.birthday)}</p></div></div><div class="child-card-note">${icon('note')}${esc(child.note || 'Chưa có ghi chú')}</div><div class="child-card-actions"><button type="button" class="link-button" data-plan-child="${child.id}">Xem kế hoạch <span>→</span></button><div><button type="button" class="icon-action edit" data-edit-child="${child.id}" aria-label="Chỉnh sửa ${esc(child.name)}">${icon('edit')}</button><button type="button" class="icon-action delete" data-delete-child="${child.id}" aria-label="Xóa ${esc(child.name)}">${icon('trash')}</button></div></div></article>`).join('');
    $('#screen-children').innerHTML = `${header('Hồ sơ trẻ', `${state.children.length} hồ sơ đang được quản lý`, button(`${icon('plus')}Thêm trẻ`, 'open-child', true))}<div class="children-intro"><div class="intro-icon">${icon('children')}</div><div><h2>Thông tin tất cả các trẻ</h2><p>Quản lý hồ sơ và mở kế hoạch giáo dục riêng cho từng trẻ.</p></div></div><div class="children-grid">${cards}</div>${!state.children.length ? `<div class="empty-state"><h3>Chưa có hồ sơ trẻ</h3><p>Nhấn “Thêm trẻ” để nhập hồ sơ đầu tiên.</p></div>` : ''}`;
  }

  function renderObjective() {
    if (!state.children.length) { $('#screen-objective').innerHTML = `${header('Thêm mục tiêu', 'Cài đặt mục tiêu phát triển riêng cho từng trẻ')}${`<div class="empty-state"><h3>Cần có hồ sơ trẻ trước</h3><p>Hãy thêm trẻ rồi cài đặt mục tiêu riêng.</p>${button('Thêm trẻ', 'open-child', true)}</div>`}`; return; }
    const child = selectedChild();
    $('#screen-objective').innerHTML = `${header('Thêm mục tiêu', 'Cài đặt mục tiêu phát triển riêng cho từng trẻ', `<button type="button" class="button" data-view="plan">Hủy</button>`)}<div class="objective-layout"><main><form id="objective-form"><section class="form-card"><div class="form-card-title"><span class="step">01</span><div><h2>Chọn trẻ và lĩnh vực</h2><p>Mỗi mục tiêu chỉ áp dụng cho hồ sơ trẻ được chọn.</p></div></div><div class="form-grid">${selectField('Trẻ áp dụng', 'objective-child', state.children.map((item) => ({ value: item.id, label: item.name })), child.id)}${selectField('Lĩnh vực phát triển', 'objective-domain', domains, domains[0])}</div></section><section class="form-card"><div class="form-card-title"><span class="step">02</span><div><h2>Mục tiêu dài hạn</h2><p>Mô tả kết quả mong đợi trong giai đoạn áp dụng.</p></div></div><label class="field"><span>Mục tiêu dài hạn <em>*</em></span><textarea id="objective-long" required placeholder="Ví dụ: Duy trì tương tác với giáo viên 5–10 phút"></textarea></label><div class="form-grid dates"><label class="field"><span>Từ ngày</span><input id="objective-from" value="01/07/2026" /></label><label class="field"><span>Đến ngày</span><input id="objective-to" value="30/08/2026" /></label></div></section><section class="form-card"><div class="form-card-title"><span class="step">03</span><div><h2>Mục tiêu ngắn hạn</h2><p>Các bước nhỏ giúp trẻ tiến tới mục tiêu dài hạn.</p></div></div><div class="short-goal-editor">${draftShortGoals.map((value, index) => `<div class="short-goal-edit-row"><span>${index + 1}</span><input data-short-goal="${index}" value="${esc(value)}" placeholder="Mục tiêu ngắn hạn ${index + 1}" /><button type="button" data-remove-short="${index}" aria-label="Xóa mục tiêu">${icon('trash')}</button></div>`).join('')}</div><button type="button" class="outline-button" data-add-short>${icon('plus')}Thêm mục tiêu ngắn hạn</button></section><div class="form-actions"><button type="button" class="button" data-view="plan">Hủy</button><button type="submit" class="button primary">${icon('save')}Lưu mục tiêu</button></div></form></main><aside class="objective-preview"><div class="preview-heading">${icon('target')}Xem trước</div><div class="preview-body"><span class="preview-label" id="preview-child">${esc(child.name)}</span><span class="domain-pill" id="preview-domain">${domains[0]}</span><h3>Mục tiêu dài hạn</h3><p id="preview-long">Chưa nhập mục tiêu</p><h3>Mục tiêu ngắn hạn</h3><ol id="preview-short"></ol></div></aside></div>`;
  }

  function renderSettings() {
    $('#screen-settings').innerHTML = `${header('Cài đặt', 'Tùy chỉnh cách bạn sử dụng kế hoạch giáo dục')}<div class="settings-card"><div class="settings-heading"><div class="settings-icon">${icon('settings')}</div><div><h2>Tùy chọn ứng dụng</h2><p>Các thay đổi được lưu trên thiết bị này.</p></div></div><label class="setting-row"><span><strong>Nhắc cập nhật mục tiêu</strong><small>Hiển thị nhắc nhở khi đến kỳ đánh giá.</small></span><input type="checkbox" checked /></label><label class="setting-row"><span><strong>Giao diện gọn</strong><small>Thu gọn khoảng cách trong bảng kế hoạch.</small></span><input type="checkbox" /></label><div class="settings-save"><button type="button" class="button primary" data-action="save-settings">${icon('save')}Lưu cài đặt</button><span id="settings-saved" hidden>Đã lưu thay đổi</span></div></div>`;
  }

  function navigate(view) { state.view = view; document.querySelectorAll('.screen').forEach((screen) => screen.classList.toggle('active', screen.id === `screen-${view}`)); document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === view)); if (view === 'plan') renderPlan(); if (view === 'children') renderChildren(); if (view === 'objective') renderObjective(); if (view === 'settings') renderSettings(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function openChildModal(id) { const child = id ? childById(id) : null; $('#child-modal-title').textContent = child ? 'Chỉnh sửa hồ sơ trẻ' : 'Thêm trẻ mới'; $('#child-id').value = child?.id || ''; $('#child-name').value = child?.name || ''; $('#child-birthday').value = child?.birthday || ''; $('#child-gender').value = child?.gender || 'Nữ'; $('#child-note').value = child?.note || ''; $('#child-modal').removeAttribute('hidden'); $('#child-name').focus(); }
  function closeChildModal() { $('#child-modal').setAttribute('hidden', ''); }
  function updateObjectivePreview() { const long = $('#objective-long'); const domain = $('#objective-domain'); const child = $('#objective-child'); if (!long) return; $('#preview-long').textContent = long.value || 'Chưa nhập mục tiêu'; $('#preview-domain').textContent = domain.value; $('#preview-child').textContent = child.options[child.selectedIndex].text; $('#preview-short').innerHTML = draftShortGoals.filter((value) => value.trim()).map((value) => `<li>${esc(value)}</li>`).join(''); }

  document.addEventListener('click', (event) => {
    const viewButton = event.target.closest('[data-view]');
    if (viewButton) { if (viewButton.dataset.view === 'objective') draftShortGoals = ['', '']; navigate(viewButton.dataset.view); return; }
    const action = event.target.closest('[data-action]');
    if (action) {
      if (action.dataset.action === 'open-child') openChildModal();
      if (action.dataset.action === 'close-child') closeChildModal();
      if (action.dataset.action === 'objective') { draftShortGoals = ['', '']; navigate('objective'); }
      if (action.dataset.action === 'save-settings') { $('#settings-saved').removeAttribute('hidden'); window.setTimeout(() => $('#settings-saved')?.setAttribute('hidden', ''), 2200); }
    }
    const planChild = event.target.closest('[data-plan-child]'); if (planChild) { state.selectedChildId = Number(planChild.dataset.planChild); navigate('plan'); }
    const editChild = event.target.closest('[data-edit-child]'); if (editChild) openChildModal(Number(editChild.dataset.editChild));
    const deleteChild = event.target.closest('[data-delete-child]'); if (deleteChild) { const child = childById(deleteChild.dataset.deleteChild); if (child && window.confirm(`Xóa hồ sơ của ${child.name}?`)) { state.children = state.children.filter((item) => item.id !== child.id); state.goals = state.goals.filter((goal) => goal.childId !== child.id); if (state.selectedChildId === child.id) state.selectedChildId = state.children[0]?.id || 0; persist(); render(); } }
    if (event.target.closest('[data-add-short]')) { draftShortGoals.push(''); renderObjective(); updateObjectivePreview(); }
    const remove = event.target.closest('[data-remove-short]'); if (remove) { if (draftShortGoals.length > 1) draftShortGoals.splice(Number(remove.dataset.removeShort), 1); renderObjective(); updateObjectivePreview(); }
  });
  document.addEventListener('change', (event) => {
    const select = event.target;
    if (select.id === 'plan-child-select') { state.selectedChildId = Number(select.value); renderPlan(); return; }
    if (select.id === 'objective-child') { state.selectedChildId = Number(select.value); updateObjectivePreview(); }
    if (select.dataset.goalId) { const goal = state.goals.find((item) => item.id === Number(select.dataset.goalId)); if (goal) { goal.statuses[Number(select.dataset.week)] = select.value; persist(); renderPlan(); } }
  });
  document.addEventListener('input', (event) => { if (event.target.dataset.shortGoal !== undefined) { draftShortGoals[Number(event.target.dataset.shortGoal)] = event.target.value; updateObjectivePreview(); } if (event.target.id === 'objective-long') updateObjectivePreview(); });
  document.addEventListener('submit', (event) => {
    if (event.target.id === 'child-form') { event.preventDefault(); const id = Number($('#child-id').value); const data = { name: $('#child-name').value.trim(), birthday: $('#child-birthday').value.trim(), gender: $('#child-gender').value, note: $('#child-note').value.trim() }; if (id) state.children = state.children.map((child) => child.id === id ? { ...data, id } : child); else { const newId = Math.max(0, ...state.children.map((child) => child.id)) + 1; state.children.push({ ...data, id: newId }); state.selectedChildId = newId; } persist(); closeChildModal(); render(); return; }
    if (event.target.id === 'objective-form') { event.preventDefault(); const shortTerm = draftShortGoals.map((item) => item.trim()).filter(Boolean); if (!shortTerm.length || !$('#objective-long').value.trim()) return; const goal = { id: Math.max(0, ...state.goals.map((item) => item.id)) + 1, childId: Number($('#objective-child').value), domain: $('#objective-domain').value, longTerm: $('#objective-long').value.trim(), shortTerm, from: $('#objective-from').value, to: $('#objective-to').value, statuses: ['Manh nha', 'Manh nha', 'Chưa đạt', 'Chưa đạt'] }; state.goals.push(goal); state.selectedChildId = goal.childId; persist(); navigate('plan'); }
  });
  function render() { renderPlan(); renderChildren(); renderObjective(); renderSettings(); navigate(state.view); }
  render();
})();
