const STORAGE_CLICKS = 'meow_today_clicks_v1';
const STORAGE_PETS = 'meow_pet_total_v1';
const STORAGE_DATE = 'meow_today_date_v1';
const meows = ['喵~', '喵呜！', '摸摸头~', '咕噜咕噜', '爪巴！', '今天也要开心', '想吃小鱼干', '蹭蹭～', '好舒服…', '再点一下！'];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadClicks() {
  const today = todayKey();
  if (localStorage.getItem(STORAGE_DATE) !== today) {
    localStorage.setItem(STORAGE_DATE, today);
    localStorage.setItem(STORAGE_CLICKS, '0');
    return 0;
  }
  return parseInt(localStorage.getItem(STORAGE_CLICKS) || '0', 10) || 0;
}

function saveClicks(n) {
  localStorage.setItem(STORAGE_DATE, todayKey());
  localStorage.setItem(STORAGE_CLICKS, String(n));
}

function loadPets() {
  return parseInt(localStorage.getItem(STORAGE_PETS) || '0', 10) || 0;
}

function savePets(n) {
  localStorage.setItem(STORAGE_PETS, String(n));
}

const elClicks = document.getElementById('todayClicks');
const elPets = document.getElementById('petCount');
const elDate = document.getElementById('dateLabel');
const cat = document.getElementById('cat');
const bubble = document.getElementById('meowBubble');

let clicks = loadClicks() + 1;
let pets = loadPets();
saveClicks(clicks);
elClicks.textContent = clicks;
elPets.textContent = pets;
elDate.textContent = todayKey().replaceAll('-', '/');

function showMeow(text) {
  bubble.textContent = text || meows[Math.floor(Math.random() * meows.length)];
}

function petCat() {
  clicks += 1;
  pets += 1;
  saveClicks(clicks);
  savePets(pets);
  elClicks.textContent = clicks;
  elPets.textContent = pets;
  showMeow();
}

cat?.addEventListener('click', petCat);
cat?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    petCat();
  }
});

setTimeout(() => showMeow('欢迎回来～'), 400);
setInterval(() => {
  if (Math.random() > 0.65) showMeow();
}, 8000);
