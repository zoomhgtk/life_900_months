// 这里填入index.html中<script>...</script>的全部内容 

// 工具函数
function getMonthIndex(birthday, now) {
  // birthday: yyyy-mm, now: yyyy-mm
  const [by, bm] = birthday.split('-').map(Number);
  const [ny, nm] = now.split('-').map(Number);
  return (ny - by) * 12 + (nm - bm);
}
function getMonthByIndex(birthday, idx) {
  // birthday: yyyy-mm, idx: 0~899
  let [y, m] = birthday.split('-').map(Number);
  y += Math.floor((m - 1 + idx) / 12);
  m = (m - 1 + idx) % 12 + 1;
  return `${y}年${String(m).padStart(2, '0')}月`;
}
function formatMonthLeft(idx) {
  const left = Math.max(900 - idx, 0);
  return left > 0 ? `还剩 ${left} 个月` : '时间已经走完，愿每一刻都被珍惜';
}
function getNowMonth() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
function readFileAsDataURL(file, cb) {
  const reader = new FileReader();
  reader.onload = e => cb(e.target.result);
  reader.readAsDataURL(file);
}
// 数据存储
function saveData(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
function loadData(key, def) {
  try {
    return JSON.parse(localStorage.getItem(key)) || def;
  } catch { return def; }
}
// 初始化年月picker
function initMonthPicker() {
  const yearSel = document.getElementById('yearPicker');
  const monthSel = document.getElementById('monthPicker');
  yearSel.innerHTML = '';
  monthSel.innerHTML = '';
  const now = new Date();
  for (let y = now.getFullYear(); y >= 1900; y--) {
    yearSel.innerHTML += `<option value='${y}'>${y}</option>`;
  }
  for (let m = 1; m <= 12; m++) {
    monthSel.innerHTML += `<option value='${String(m).padStart(2,'0')}'>${m}</option>`;
  }
  // 恢复上次选择
  const saved = loadData('userBirthday', null);
  if (saved) {
    const [sy, sm] = saved.split('-');
    yearSel.value = sy;
    monthSel.value = sm;
  } else {
    yearSel.value = now.getFullYear();
    monthSel.value = String(now.getMonth() + 1).padStart(2, '0');
  }
}
// 生日弹窗
function showBirthdayModal() {
  document.getElementById('birthdayModal').hidden = false;
  initMonthPicker();
}
function closeBirthdayModal() {
  document.getElementById('birthdayModal').hidden = true;
}
function saveBirthday() {
  const y = document.getElementById('yearPicker').value;
  const m = document.getElementById('monthPicker').value;
  if (!y || !m) return alert('请选择出生年月');
  const val = `${y}-${m}`;
  saveData('userBirthday', val);
  closeBirthdayModal();
  renderGrid();
}
// 判断是否移动端
function isMobile() {
  return /iphone|ipad|android|mobile|phone/i.test(navigator.userAgent);
}
// 悬浮卡片显示/隐藏
let floatCardTimer = null;
function showFloatCard(html) {
  const card = document.getElementById('cellFloatCard');
  window.clearTimeout(floatCardTimer);
  card.innerHTML = html;
  card.hidden = false;
}
function hideFloatCard(immediate = false) {
  const card = document.getElementById('cellFloatCard');
  window.clearTimeout(floatCardTimer);
  if (immediate || !isMobile()) {
    card.hidden = true;
    return;
  }
  floatCardTimer = window.setTimeout(() => {
    card.hidden = true;
  }, 1400);
}
// 侧边栏
function openSidebar() {
  document.getElementById('sidebar').hidden = false;
  document.getElementById('sidebarBg').hidden = false;

}
function closeSidebar() {
  document.getElementById('sidebar').hidden = true;
  document.getElementById('sidebarBg').hidden = true;
}
// 格子详情弹窗
function showCellDetail(cellInfo) {
  let html = '';
  if (cellInfo.type === 'user') {
    html += `<div class='cell-detail-emoji'>${cellInfo.emoji || ''}</div>`;
    if (cellInfo.img) html += `<img class='cell-detail-img' src='${cellInfo.img}'>`;
    html += `<div><b>你自己</b><br>第${cellInfo.idx + 1}个月</div>`;
  } else if (cellInfo.type === 'member') {
    if (cellInfo.img) html += `<img class='cell-detail-img' src='${cellInfo.img}'>`;
    else html += `<div class='cell-detail-emoji'><i class='fa fa-user-circle'></i></div>`;
    html += `<div><b>${cellInfo.title}</b><br>第${cellInfo.idx + 1}个月</div>`;
  } else if (cellInfo.type === 'event') {
    if (cellInfo.emoji) html += `<div class='cell-detail-emoji'>${cellInfo.emoji}</div>`;
    if (cellInfo.img) html += `<img class='cell-detail-img' src='${cellInfo.img}'>`;
    html += `<div><b>${cellInfo.name}</b><br>第${cellInfo.idx + 1}个月</div>`;
  } else if (cellInfo.type === 'empty') {
    html += `<div class='cell-detail-month'>${cellInfo.monthStr}</div>`;
    html += `<div>第${cellInfo.idx + 1}个月</div>`;
  }
  if (isMobile()) {
    showFloatCard(html);
  } else {
    html += `<div class='modal-actions'><button onclick='closeCellDetail()'>关闭</button></div>`;
    const modal = document.getElementById('cellDetailModal');
    const content = document.getElementById('cellDetailContent');
    content.innerHTML = html;
    modal.hidden = false;
  }
}
function closeCellDetail() {
  document.getElementById('cellDetailModal').hidden = true;
  hideFloatCard(true);
}
// 渲染主格子
function renderGrid() {
  const grid = document.getElementById('monthsGrid');
  grid.innerHTML = '';
  const birthday = loadData('userBirthday', null);
  if (!birthday) {
    showBirthdayModal();
    return;
  }
  const now = getNowMonth();
  const idx = getMonthIndex(birthday, now);
  // 取成员和事件
  const members = loadData('members', []).filter(item => item.visible !== false);
  const events = loadData('events', []).filter(item => item.visible !== false);
  // 生成900格
  for (let i = 0; i < 900; i++) {
    const cell = document.createElement('div');
    cell.className = 'month-cell';
    if (i < idx) cell.classList.add('past');
    if (i === idx) cell.classList.add('current');
    let icons = [];
    let hasMember = false;
    members.forEach((m, mi) => {
      const mIdx = getMonthIndex(m.birthday, now);
      if (i === mIdx) {
        hasMember = true;
        if (m.img) icons.push(`<img class='cell-img' src='${m.img}'>`);
        else icons.push(`<i class='fa fa-user cell-icon'></i>`);
        if (isMobile()) {
          cell.ontouchstart = (e) => { e.preventDefault(); showCellDetail({ ...m, type: 'member', idx: i }); };
          cell.ontouchend = () => hideFloatCard();
          cell.ontouchcancel = () => hideFloatCard(true);
        } else {
          cell.onclick = () => showCellDetail({ ...m, type: 'member', idx: i });
        }
      }
    });
    let hasEvent = false;
    for (const e of events) {
      const eIdx = getMonthIndex(e.month, now) + (i - idx);
      if (eIdx === 0) {
        hasEvent = true;
        if (e.emoji) icons.push(`<span class='cell-icon'>${e.emoji}</span>`);
        else if (e.img) icons.push(`<img class='cell-img' src='${e.img}'>`);
        else if (e.icon) icons.push(`<i class='fa ${e.icon} cell-icon'></i>`);
        if (isMobile()) {
          cell.ontouchstart = (e) => { e.preventDefault(); showCellDetail({ ...e, type: 'event', idx: i }); };
          cell.ontouchend = () => hideFloatCard();
          cell.ontouchcancel = () => hideFloatCard(true);
        } else {
          cell.onclick = () => showCellDetail({ ...e, type: 'event', idx: i });
        }
      }
    }
    if (i === idx) {
      if (isMobile()) {
        cell.ontouchstart = (e) => { e.preventDefault(); showCellDetail({ type: 'user', idx }); };
        cell.ontouchend = () => hideFloatCard();
        cell.ontouchcancel = () => hideFloatCard(true);
      } else {
        cell.onclick = () => showCellDetail({ type: 'user', idx });
      }
    }
    if (!hasMember && !hasEvent && i !== idx) {
      const monthStr = getMonthByIndex(birthday, i);
      if (isMobile()) {
        cell.ontouchstart = (e) => { e.preventDefault(); showCellDetail({ type: 'empty', idx: i, monthStr }); };
        cell.ontouchend = () => hideFloatCard();
        cell.ontouchcancel = () => hideFloatCard(true);
      } else {
        cell.onclick = () => showCellDetail({ type: 'empty', idx: i, monthStr });
      }
    }
    cell.innerHTML = icons.join('');
    grid.appendChild(cell);
  }
  // 底部剩余月数
  document.getElementById('footerText').innerText = formatMonthLeft(idx);
}
// 成员管理
function renderMemberList() {
  const list = document.getElementById('memberList');
  const members = loadData('members', []);
  list.innerHTML = members.length ? '' : `<div class='empty-list'>还没有成员</div>`;
  members.forEach((m, i) => {
    const icon = m.img ? `<img src='${m.img}' alt=''>` : `<i class='fa fa-user-circle'></i>`;
    const checked = m.visible === false ? '' : 'checked';
    list.innerHTML += `
      <div class='manager-item'>
        <button class='delete-text-btn' onclick='delMember(${i})'>删除</button>
        <button class='manager-item-main' onclick='editMember(${i})' type='button'>
          <span class='manager-item-icon'>${icon}</span>
          <span class='manager-item-copy'><b>${m.title || '未命名成员'}</b><small>${m.birthday}</small></span>
        </button>
        <label class='switch'>
          <input type='checkbox' ${checked} onchange='toggleMemberVisible(${i}, this.checked)'>
          <span></span>
        </label>
      </div>`;
  });
}
function delMember(idx) {
  let members = loadData('members', []);
  members.splice(idx, 1);
  saveData('members', members);
  renderMemberList();
  renderGrid();
}
function toggleMemberVisible(idx, visible) {
  let members = loadData('members', []);
  if (!members[idx]) return;
  members[idx].visible = visible;
  saveData('members', members);
  renderGrid();
}
function editMember(idx) {
  alert('编辑成员将在下一阶段实现');
}
// 初始化成员年月picker
function initMemberMonthPicker() {
  const yearSel = document.getElementById('memberYearPicker');
  const monthSel = document.getElementById('memberMonthPicker');
  yearSel.innerHTML = '';
  monthSel.innerHTML = '';
  const now = new Date();
  for (let y = now.getFullYear(); y >= 1900; y--) {
    yearSel.innerHTML += `<option value='${y}'>${y}</option>`;
  }
  for (let m = 1; m <= 12; m++) {
    monthSel.innerHTML += `<option value='${String(m).padStart(2,'0')}'>${m}</option>`;
  }
  yearSel.value = now.getFullYear();
  monthSel.value = String(now.getMonth() + 1).padStart(2, '0');
}
let memberAvatarData = '';
document.getElementById('addMemberForm').onsubmit = function(e) {
  e.preventDefault();
  const title = document.getElementById('memberTitle').value.trim();
  const y = document.getElementById('memberYearPicker').value;
  const m = document.getElementById('memberMonthPicker').value;
  const birthday = `${y}-${m}`;
  if (!title) return alert('请填写成员名称');
  if (!birthday) return alert('请选择生日');
  if (!memberAvatarData) return alert('请上传并裁切头像');
  let members = loadData('members', []);
  members.push({ title, birthday, img: memberAvatarData });
  saveData('members', members);
  renderMemberList();
  renderGrid();
  document.getElementById('addMemberForm').reset();
  memberAvatarData = '';
  document.getElementById('memberAvatarPreview').hidden = true;
  document.getElementById('memberAvatarPreview').innerHTML = '';
  initMemberMonthPicker();
};
// 事件管理
function renderEventList() {
  const list = document.getElementById('eventList');
  const events = loadData('events', []);
  list.innerHTML = events.length ? '' : `<div class='empty-list'>还没有重要月份</div>`;
  events.forEach((e, i) => {
    const icon = e.emoji ? `<span>${e.emoji}</span>` : e.img ? `<img src='${e.img}' alt=''>` : `<i class='fa fa-calendar'></i>`;
    const checked = e.visible === false ? '' : 'checked';
    list.innerHTML += `
      <div class='manager-item'>
        <button class='delete-text-btn' onclick='delEvent(${i})'>删除</button>
        <button class='manager-item-main' onclick='editEvent(${i})' type='button'>
          <span class='manager-item-icon'>${icon}</span>
          <span class='manager-item-copy'><b>${e.name || '未命名月份'}</b><small>${e.month}</small></span>
        </button>
        <label class='switch'>
          <input type='checkbox' ${checked} onchange='toggleEventVisible(${i}, this.checked)'>
          <span></span>
        </label>
      </div>`;
  });
}
function delEvent(idx) {
  let events = loadData('events', []);
  events.splice(idx, 1);
  saveData('events', events);
  renderEventList();
  renderGrid();
}
function toggleEventVisible(idx, visible) {
  let events = loadData('events', []);
  if (!events[idx]) return;
  events[idx].visible = visible;
  saveData('events', events);
  renderGrid();
}
function editEvent(idx) {
  alert('编辑重要月份将在下一阶段实现');
}
// 初始化事件年月picker
function initEventMonthPicker() {
  const yearSel = document.getElementById('eventYearPicker');
  const monthSel = document.getElementById('eventMonthPicker');
  yearSel.innerHTML = '';
  monthSel.innerHTML = '';
  const now = new Date();
  for (let y = now.getFullYear(); y >= 1900; y--) {
    yearSel.innerHTML += `<option value='${y}'>${y}</option>`;
  }
  for (let m = 1; m <= 12; m++) {
    monthSel.innerHTML += `<option value='${String(m).padStart(2,'0')}'>${m}</option>`;
  }
  yearSel.value = now.getFullYear();
  monthSel.value = String(now.getMonth() + 1).padStart(2, '0');
}
document.getElementById('addEventForm').onsubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById('eventName').value.trim();
  const y = document.getElementById('eventYearPicker').value;
  const m = document.getElementById('eventMonthPicker').value;
  const month = `${y}-${m}`;
  const emoji = document.getElementById('eventEmoji').value.trim();
  const imgFile = document.getElementById('eventImg').files[0];
  if (!name || !month) return alert('请填写完整');
  const add = (img) => {
    let events = loadData('events', []);
    events.push({ name, month, emoji, img, visible: true });
    saveData('events', events);
    renderEventList();
    renderGrid();
    hideEventForm();
    document.getElementById('addEventForm').reset();
    initEventMonthPicker();
  };
  if (imgFile) readFileAsDataURL(imgFile, add);
  else add('');
};

// 成员头像裁切
const memberImgInput = document.getElementById('memberImg');
const memberAvatarPreview = document.getElementById('memberAvatarPreview');
const avatarCropModal = document.getElementById('avatarCropModal');
const avatarCropCanvas = document.getElementById('avatarCropCanvas');
const avatarZoom = document.getElementById('avatarZoom');
const avatarCropClose = document.getElementById('avatarCropClose');
const avatarCropCancel = document.getElementById('avatarCropCancel');
const avatarCropApply = document.getElementById('avatarCropApply');
const avatarCropCtx = avatarCropCanvas.getContext('2d');
const avatarCropState = {
  image: null,
  baseScale: 1,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  dragging: false,
  lastX: 0,
  lastY: 0
};
function drawAvatarCrop() {
  const size = avatarCropCanvas.width;
  avatarCropCtx.clearRect(0, 0, size, size);
  avatarCropCtx.fillStyle = '#eee9df';
  avatarCropCtx.fillRect(0, 0, size, size);
  if (!avatarCropState.image) return;
  const scale = avatarCropState.baseScale * avatarCropState.zoom;
  const w = avatarCropState.image.width * scale;
  const h = avatarCropState.image.height * scale;
  avatarCropCtx.drawImage(avatarCropState.image, avatarCropState.offsetX, avatarCropState.offsetY, w, h);
}
function clampAvatarCrop() {
  if (!avatarCropState.image) return;
  const size = avatarCropCanvas.width;
  const scale = avatarCropState.baseScale * avatarCropState.zoom;
  const w = avatarCropState.image.width * scale;
  const h = avatarCropState.image.height * scale;
  avatarCropState.offsetX = Math.min(0, Math.max(size - w, avatarCropState.offsetX));
  avatarCropState.offsetY = Math.min(0, Math.max(size - h, avatarCropState.offsetY));
}
function openAvatarCrop(src) {
  const image = new Image();
  image.onload = () => {
    const size = avatarCropCanvas.width;
    avatarCropState.image = image;
    avatarCropState.baseScale = Math.max(size / image.width, size / image.height);
    avatarCropState.zoom = 1;
    avatarZoom.value = '1';
    const w = image.width * avatarCropState.baseScale;
    const h = image.height * avatarCropState.baseScale;
    avatarCropState.offsetX = (size - w) / 2;
    avatarCropState.offsetY = (size - h) / 2;
    avatarCropModal.hidden = false;
    drawAvatarCrop();
  };
  image.src = src;
}
function closeAvatarCrop(clearInput = false) {
  avatarCropModal.hidden = true;
  avatarCropState.image = null;
  if (clearInput) memberImgInput.value = '';
}
memberImgInput.addEventListener('change', () => {
  const file = memberImgInput.files[0];
  if (!file) return;
  readFileAsDataURL(file, openAvatarCrop);
});
avatarZoom.addEventListener('input', () => {
  avatarCropState.zoom = Number(avatarZoom.value);
  clampAvatarCrop();
  drawAvatarCrop();
});
avatarCropCanvas.addEventListener('pointerdown', (e) => {
  avatarCropState.dragging = true;
  avatarCropState.lastX = e.clientX;
  avatarCropState.lastY = e.clientY;
  avatarCropCanvas.setPointerCapture(e.pointerId);
});
avatarCropCanvas.addEventListener('pointermove', (e) => {
  if (!avatarCropState.dragging) return;
  avatarCropState.offsetX += e.clientX - avatarCropState.lastX;
  avatarCropState.offsetY += e.clientY - avatarCropState.lastY;
  avatarCropState.lastX = e.clientX;
  avatarCropState.lastY = e.clientY;
  clampAvatarCrop();
  drawAvatarCrop();
});
avatarCropCanvas.addEventListener('pointerup', () => {
  avatarCropState.dragging = false;
});
avatarCropCanvas.addEventListener('pointercancel', () => {
  avatarCropState.dragging = false;
});
avatarCropApply.addEventListener('click', () => {
  if (!avatarCropState.image) return;
  const output = document.createElement('canvas');
  const outputSize = 256;
  const ratio = outputSize / avatarCropCanvas.width;
  output.width = outputSize;
  output.height = outputSize;
  const ctx = output.getContext('2d');
  const scale = avatarCropState.baseScale * avatarCropState.zoom * ratio;
  ctx.fillStyle = '#eee9df';
  ctx.fillRect(0, 0, outputSize, outputSize);
  ctx.drawImage(
    avatarCropState.image,
    avatarCropState.offsetX * ratio,
    avatarCropState.offsetY * ratio,
    avatarCropState.image.width * scale,
    avatarCropState.image.height * scale
  );
  memberAvatarData = output.toDataURL('image/jpeg', 0.9);
  memberAvatarPreview.innerHTML = `<img src='${memberAvatarData}' alt='成员头像预览'>`;
  memberAvatarPreview.hidden = false;
  closeAvatarCrop();
});
avatarCropClose.addEventListener('click', () => closeAvatarCrop(true));
avatarCropCancel.addEventListener('click', () => closeAvatarCrop(true));
avatarCropModal.addEventListener('click', (e) => {
  if (e.target === avatarCropModal) closeAvatarCrop(true);
});


// 管理面板
const memberManagerBg = document.getElementById('memberManagerBg');
const eventManagerBg = document.getElementById('eventManagerBg');
const memberForm = document.getElementById('addMemberForm');
const eventForm = document.getElementById('addEventForm');
function openMemberManager() {
  memberManagerBg.hidden = false;
  renderMemberList();
  initMemberMonthPicker();
}
function closeMemberManager() {
  memberManagerBg.hidden = true;
  hideMemberForm();
}
function showMemberForm() {
  memberForm.hidden = false;
  initMemberMonthPicker();
}
function hideMemberForm() {
  memberForm.hidden = true;
  memberAvatarData = '';
  document.getElementById('memberAvatarPreview').hidden = true;
  document.getElementById('memberAvatarPreview').innerHTML = '';
  document.getElementById('addMemberForm').reset();
}
function openEventManager() {
  eventManagerBg.hidden = false;
  renderEventList();
  initEventMonthPicker();
}
function closeEventManager() {
  eventManagerBg.hidden = true;
  hideEventForm();
}
function showEventForm() {
  eventForm.hidden = false;
  initEventMonthPicker();
}
function hideEventForm() {
  eventForm.hidden = true;
  document.getElementById('addEventForm').reset();
}

// 头像/登录原型
document.getElementById('avatarBtn').onclick = function() {
  alert('原型：注册/登录功能，后续实现。');
};
// 侧边栏按钮
document.getElementById('sidebarBtn').onclick = openSidebar;
document.getElementById('sidebarBg').onclick = closeSidebar;
document.getElementById('openMemberManager').onclick = openMemberManager;
document.getElementById('openEventManager').onclick = openEventManager;
document.getElementById('closeMemberManager').onclick = closeMemberManager;
document.getElementById('closeEventManager').onclick = closeEventManager;
document.getElementById('showMemberForm').onclick = showMemberForm;
document.getElementById('showEventForm').onclick = showEventForm;
document.getElementById('cancelMemberForm').onclick = hideMemberForm;
document.getElementById('cancelEventForm').onclick = hideEventForm;
document.getElementById('memberManagerBg').onclick = function(e) { if (e.target === this) closeMemberManager(); };
document.getElementById('eventManagerBg').onclick = function(e) { if (e.target === this) closeEventManager(); };
// 格子详情弹窗关闭
document.getElementById('cellDetailModal').onclick = function(e) {
  if (e.target === this) closeCellDetail();
};
// 重要月份emoji选择
const eventEmojiBtn = document.getElementById('eventEmojiBtn');
const eventEmojiPicker = document.getElementById('eventEmojiPicker');
const eventEmojiInput = document.getElementById('eventEmoji');
eventEmojiBtn.onclick = function(e) {
  eventEmojiPicker.hidden = !eventEmojiPicker.hidden;
  const rect = eventEmojiBtn.getBoundingClientRect();
  eventEmojiPicker.style.position = 'fixed';
  eventEmojiPicker.style.left = rect.left + 'px';
  eventEmojiPicker.style.top = (rect.bottom + 5) + 'px';
};
eventEmojiPicker.addEventListener('emoji-click', event => {
  eventEmojiInput.value = event.detail.unicode;
  eventEmojiPicker.hidden = true;
});
// 初始化
renderGrid(); 
