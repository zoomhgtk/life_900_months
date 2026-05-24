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
  return 900 - idx > 0 ? `${900 - idx} months left, enjoy` : 'Time is up, cherish every moment!';
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
function showFloatCard(html) {
  const card = document.getElementById('cellFloatCard');
  card.innerHTML = html;
  card.hidden = false;
}
function hideFloatCard() {
  document.getElementById('cellFloatCard').hidden = true;
}
// 侧边栏
function openSidebar() {
  document.getElementById('sidebar').hidden = false;
  document.getElementById('sidebarBg').hidden = false;
  renderMemberList();
  renderEventList();
  initMemberMonthPicker();
  initEventMonthPicker();
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
    if (cellInfo.emoji) html += `<div class='cell-detail-emoji'>${cellInfo.emoji}</div>`;
    if (cellInfo.img) html += `<img class='cell-detail-img' src='${cellInfo.img}'>`;
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
  hideFloatCard();
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
  const members = loadData('members', []);
  const events = loadData('events', []);
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
        if (m.emoji) icons.push(`<span class='cell-icon'>${m.emoji}</span>`);
        else if (m.img) icons.push(`<img class='cell-img' src='${m.img}'>`);
        else if (m.icon) icons.push(`<i class='fa ${m.icon} cell-icon'></i>`);
        if (isMobile()) {
          cell.ontouchstart = (e) => { e.preventDefault(); showCellDetail({ ...m, type: 'member', idx: i }); };
          cell.ontouchend = cell.ontouchcancel = hideFloatCard;
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
          cell.ontouchend = cell.ontouchcancel = hideFloatCard;
        } else {
          cell.onclick = () => showCellDetail({ ...e, type: 'event', idx: i });
        }
      }
    }
    if (i === idx) {
      if (isMobile()) {
        cell.ontouchstart = (e) => { e.preventDefault(); showCellDetail({ type: 'user', idx }); };
        cell.ontouchend = cell.ontouchcancel = hideFloatCard;
      } else {
        cell.onclick = () => showCellDetail({ type: 'user', idx });
      }
    }
    if (!hasMember && !hasEvent && i !== idx) {
      const monthStr = getMonthByIndex(birthday, i);
      if (isMobile()) {
        cell.ontouchstart = (e) => { e.preventDefault(); showCellDetail({ type: 'empty', idx: i, monthStr }); };
        cell.ontouchend = cell.ontouchcancel = hideFloatCard;
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
  list.innerHTML = '';
  members.forEach((m, i) => {
    let icon = m.emoji ? `<span>${m.emoji}</span>` : m.img ? `<img src='${m.img}'>` : m.icon ? `<i class='fa ${m.icon}'></i>` : '';
    list.innerHTML += `<div class='member-item'>${icon} ${m.title} (${m.birthday}) <button class='icon-btn' onclick='delMember(${i})'><i class='fa fa-trash'></i></button></div>`;
  });
}
function delMember(idx) {
  let members = loadData('members', []);
  members.splice(idx, 1);
  saveData('members', members);
  renderMemberList();
  renderGrid();
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
document.getElementById('addMemberForm').onsubmit = function(e) {
  e.preventDefault();
  const title = document.getElementById('memberTitle').value.trim();
  const y = document.getElementById('memberYearPicker').value;
  const m = document.getElementById('memberMonthPicker').value;
  const birthday = `${y}-${m}`;
  const emoji = document.getElementById('memberEmoji').value.trim();
  const imgFile = document.getElementById('memberImg').files[0];
  if (!birthday) return alert('请选择生日');
  const add = (img) => {
    let members = loadData('members', []);
    members.push({ title, birthday, emoji, img });
    saveData('members', members);
    renderMemberList();
    renderGrid();
    document.getElementById('addMemberForm').reset();
    initMemberMonthPicker();
  };
  if (imgFile) readFileAsDataURL(imgFile, add);
  else add('');
};
// 事件管理
function renderEventList() {
  const list = document.getElementById('eventList');
  const events = loadData('events', []);
  list.innerHTML = '';
  events.forEach((e, i) => {
    let icon = e.emoji ? `<span>${e.emoji}</span>` : e.img ? `<img src='${e.img}'>` : e.icon ? `<i class='fa ${e.icon}'></i>` : '';
    list.innerHTML += `<div class='event-item'>${icon} ${e.name} (${e.month}) <button class='icon-btn' onclick='delEvent(${i})'><i class='fa fa-trash'></i></button></div>`;
  });
}
function delEvent(idx) {
  let events = loadData('events', []);
  events.splice(idx, 1);
  saveData('events', events);
  renderEventList();
  renderGrid();
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
    events.push({ name, month, emoji, img });
    saveData('events', events);
    renderEventList();
    renderGrid();
    document.getElementById('addEventForm').reset();
    initEventMonthPicker();
  };
  if (imgFile) readFileAsDataURL(imgFile, add);
  else add('');
};
// 头像/登录原型
document.getElementById('avatarBtn').onclick = function() {
  alert('原型：注册/登录功能，后续实现。');
};
// 侧边栏按钮
document.getElementById('sidebarBtn').onclick = openSidebar;
document.getElementById('sidebarBg').onclick = closeSidebar;
// 格子详情弹窗关闭
document.getElementById('cellDetailModal').onclick = function(e) {
  if (e.target === this) closeCellDetail();
};
// 成员emoji选择
const memberEmojiBtn = document.getElementById('memberEmojiBtn');
const memberEmojiPicker = document.getElementById('memberEmojiPicker');
const memberEmojiInput = document.getElementById('memberEmoji');
memberEmojiBtn.onclick = function(e) {
  memberEmojiPicker.hidden = !memberEmojiPicker.hidden;
  // 定位到按钮下方
  const rect = memberEmojiBtn.getBoundingClientRect();
  memberEmojiPicker.style.position = 'fixed';
  memberEmojiPicker.style.left = rect.left + 'px';
  memberEmojiPicker.style.top = (rect.bottom + 5) + 'px';
};
memberEmojiPicker.addEventListener('emoji-click', event => {
  memberEmojiInput.value = event.detail.unicode;
  memberEmojiPicker.hidden = true;
});
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
