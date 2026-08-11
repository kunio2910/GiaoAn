(function () {
  const goals = [
    { domain: 'TƯƠNG TÁC XÃ HỘI', icon: '♣', long: 'Duy trì tương tác với giáo viên 5–10 phút', short: ['Ngồi tại bàn 2–3 phút.', 'Ngồi học 5 phút.', 'Duy trì hoạt động 10 phút (có đổi trò chơi).'], status: ['Manh nha', 'Đạt', 'Manh nha', 'Chưa đạt'] },
    { domain: 'TƯƠNG TÁC XÃ HỘI', icon: '♣', long: 'Chơi qua lại với giáo viên', short: ['Lăn bóng qua lại 2 lượt.', 'Lăn bóng 5 lượt.', 'Chơi đưa – nhận đồ vật 5 lượt.', 'Chơi trò chơi có luật (thả bóng, bỏ khối...).'], status: ['Manh nha', 'Đạt', 'Đạt', 'Đạt'] },
    { domain: 'TƯƠNG TÁC XÃ HỘI', icon: '♣', long: 'Tăng giao tiếp bằng mắt', short: ['Nhìn mặt GV khi được gọi tên.', 'Nhìn mặt GV khi nhận đồ.', 'Nhìn mặt GV để yêu cầu tiếp tục trò chơi.', 'Duy trì giao tiếp mắt 2–3 giây.'], status: ['Manh nha', 'Manh nha', 'Đạt', 'Đạt'] },
    { domain: 'TƯƠNG TÁC XÃ HỘI', icon: '♣', long: 'Đáp lại tương tác xã hội đơn giản', short: ['Đập tay (High-five).', 'Bye bye khi kết thúc', 'Bắt chước cử chỉ khi trong bài hát.', 'Mỉm cười hoặc cười đáp lại khi chơi.'], status: ['Manh nha', 'Đạt', 'Đạt', 'Đạt'] },
    { domain: 'CHÚ Ý CHUNG', icon: '◉', long: 'Nhìn theo người lớn', short: ['Nhìn theo khi GV chỉ vào đồ vật gần.', 'Nhìn theo khi GV chỉ vào đồ vật cách 1–2m.', 'Nhìn theo khi GV chỉ tranh trong sách.'], status: ['Manh nha', 'Manh nha', 'Đạt', 'Đạt'] },
    { domain: 'CHÚ Ý CHUNG', icon: '◉', long: 'Luân phiên nhìn người – đồ vật', short: ['Nhìn đồ vật rồi nhìn mặt GV.', 'Nhìn mặt GV rồi nhìn lại đồ vật.', 'Luân phiên nhìn 2–3 lần trong cùng một hoạt động.'], status: ['Chưa đạt', 'Manh nha', 'Đạt', 'Đạt'] }
  ];
  const shortGoals = ['Ngồi tại bàn 2–3 phút.', 'Ngồi học 5 phút.', 'Duy trì hoạt động 10 phút (có đổi trò chơi).', 'Lăn bóng qua lại 2 lượt.', 'Chơi trò chơi có luật (thả bóng, bỏ khối...).'];
  const screens = ['overview', 'plan', 'plan-form', 'objective-form'];
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const statusClass = (value) => value === 'Đạt' ? 'achieved' : value === 'Manh nha' ? 'emerging' : 'not-achieved';
  const statusSelect = (value, goalIndex, weekIndex) => `<label class="status-select ${statusClass(value)}"><i class="status-dot"></i><select data-goal="${goalIndex}" data-week="${weekIndex}">${['Đạt', 'Manh nha', 'Chưa đạt'].map((item) => `<option ${item === value ? 'selected' : ''}>${item}</option>`).join('')}</select><b>⌄</b></label>`;
  function renderRows(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.innerHTML = goals.map((goal, index) => {
      const first = index === 0 || goals[index - 1].domain !== goal.domain;
      const span = goals.filter((item) => item.domain === goal.domain).length;
      return `<tr>${first ? `<td class="domain-cell" rowspan="${span}"><div class="domain-icon ${goal.icon === '◉' ? 'attention' : ''}">${goal.icon}</div><strong>${goal.domain.split(' ').map(esc).join('<br />')}</strong></td>` : ''}<td class="long-term-cell">${esc(goal.long)}</td><td class="short-term-cell"><ul>${goal.short.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></td>${goal.status.map((item, week) => `<td class="result-cell">${statusSelect(item, index, week)}</td>`).join('')}<td class="row-note"><button aria-label="Ghi chú dòng">▱</button></td></tr>`;
    }).join('');
  }
  function setView(view) {
    screens.forEach((name) => document.getElementById(`screen-${name}`).classList.toggle('active', name === view));
    document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === view || (view === 'plan-form' && item.dataset.view === 'overview')));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function updatePreview() {
    const longTerm = document.getElementById('long-term-input');
    const from = document.getElementById('from-date');
    const to = document.getElementById('to-date');
    if (longTerm) document.getElementById('preview-long-term').textContent = longTerm.value || 'Chưa nhập mục tiêu';
    if (from) document.getElementById('preview-from').textContent = from.value;
    if (to) document.getElementById('preview-to').textContent = to.value;
  }
  function renderShortGoals() {
    const list = document.getElementById('short-goals');
    const preview = document.getElementById('preview-short-goals');
    const count = document.getElementById('short-goal-count');
    if (list) list.innerHTML = shortGoals.map((value, index) => `<div class="short-goal-row" draggable="true"><button class="drag-handle" aria-label="Kéo để sắp xếp">⁙</button><span>${index + 1}.</span><input value="${esc(value)}" data-short-index="${index}" /><button class="delete-button" data-delete-short="${index}" aria-label="Xóa mục tiêu">♜</button></div>`).join('');
    if (preview) preview.innerHTML = shortGoals.map((value) => `<li>${esc(value || 'Mục tiêu mới')}</li>`).join('');
    if (count) count.textContent = shortGoals.length;
  }
  document.addEventListener('click', (event) => {
    const viewButton = event.target.closest('[data-view]');
    const action = event.target.closest('[data-action]');
    const deleteButton = event.target.closest('[data-delete-short]');
    if (viewButton) setView(viewButton.dataset.view);
    if (action && action.dataset.action === 'print') window.print();
    if (deleteButton) { shortGoals.splice(Number(deleteButton.dataset.deleteShort), 1); renderShortGoals(); }
  });
  document.addEventListener('change', (event) => {
    const select = event.target.closest('.status-select select');
    if (select) { goals[Number(select.dataset.goal)].status[Number(select.dataset.week)] = select.value; renderRows('goal-rows'); renderRows('plan-goal-rows'); }
    const shortInput = event.target.closest('[data-short-index]');
    if (shortInput) { shortGoals[Number(shortInput.dataset.shortIndex)] = shortInput.value; renderShortGoals(); }
  });
  document.addEventListener('input', (event) => {
    if (event.target.id === 'overview-note') document.getElementById('overview-note-count').textContent = event.target.value.length;
    if (['long-term-input', 'from-date', 'to-date'].includes(event.target.id)) updatePreview();
  });
  document.getElementById('add-short-goal').addEventListener('click', () => { if (shortGoals.length < 20) { shortGoals.push(''); renderShortGoals(); } });
  renderRows('goal-rows');
  renderRows('plan-goal-rows');
  renderShortGoals();
  updatePreview();
})();
