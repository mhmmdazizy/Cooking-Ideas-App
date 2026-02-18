// --- 1. KONFIGURASI FIREBASE (Paste dari Console Firebase di sini) ---
const firebaseConfig = {
  apiKey: "AIzaSyBIM86KidwhWLIdQkVv38xfNJUK3pmKmc8",
  authDomain: "cookingideas-2a894.firebaseapp.com",
  projectId: "cookingideas-2a894",
  storageBucket: "cookingideas-2a894.firebasestorage.app",
  messagingSenderId: "376881959519",
  appId: "1:376881959519:web:46f75e2c840654b1ba01ea",
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// --- DATA DUMMY ---
const ingredients = [
  { id: "telur", name: "Telur", icon: "disc" },
  { id: "tempe", name: "Tempe", icon: "square" },
  { id: "tahu", name: "Tahu", icon: "box" },
  { id: "ayam", name: "Ayam", icon: "gitlab" },
  { id: "sosis", name: "Sosis", icon: "circle" },
  { id: "bawang", name: "Bawang", icon: "smile" },
  { id: "cabe", name: "Cabai", icon: "zap" },
  { id: "kecap", name: "Kecap", icon: "droplet" },
];

const articles = [
  {
    title: "Cara Simpan Sayur Awet Sebulan",
    tag: "TIPS",
    img: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=300&q=80",
  },
  {
    title: "5 Bumbu Dasar Wajib Ada",
    tag: "HACK",
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=300&q=80",
  },
  {
    title: "Kenapa Masakanmu Asin?",
    tag: "INFO",
    img: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=300&q=80",
  },
  {
    title: "Alat Masak Anak Kos",
    tag: "LIST",
    img: "https://images.unsplash.com/photo-1584620606775-430335b71948?auto=format&fit=crop&w=300&q=80",
  },
];

const menus = [
  {
    title: "Nasi Goreng Spesial",
    desc: "Enak, gurih, pedas mantap.",
    img: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=300&q=80",
  },
  {
    title: "Soto Ayam Kuning",
    desc: "Kuah segar dengan rempah alami.",
    img: "https://images.unsplash.com/photo-1633436375795-12b3b339712f?auto=format&fit=crop&w=300&q=80",
  },
  {
    title: "Tumis Kangkung",
    desc: "Cepat saji hanya 5 menit.",
    img: "https://images.unsplash.com/photo-1566311684307-c255734e9eb0?auto=format&fit=crop&w=300&q=80",
  },
  {
    title: "Ayam Bakar Madu",
    desc: "Manis legit meresap.",
    img: "https://images.unsplash.com/photo-1614398751058-eb2e0bf63e53?auto=format&fit=crop&w=300&q=80",
  },
];

let selectedIngredients = new Set();
let currentUser = null;

// --- INIT ---
document.addEventListener("DOMContentLoaded", () => {
  renderIngredients();
  renderGrid("explore-container", articles);
  renderGrid("menu-container", menus);
  feather.replace();

  auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateAuthUI(user);
  });
});

// --- RENDER FUNCTIONS ---
function renderIngredients() {
  document.getElementById("ingredients-container").innerHTML = ingredients
    .map(
      (ing) => `
        <div class="ing-item" onclick="toggleIng('${ing.id}', this)">
            <i data-feather="${ing.icon}"></i> ${ing.name}
        </div>
    `,
    )
    .join("");
}

function renderGrid(containerId, data) {
  document.getElementById(containerId).innerHTML = data
    .map(
      (item) => `
        <div class="card-item" onclick="openDetail('${item.title}', '${item.desc || "Baca selengkapnya di artikel ini."}', '${item.img}', '${item.tag || "MENU"}')">
            <img src="${item.img}" class="card-thumb" loading="lazy">
            <div class="card-info">
                <span>${item.tag || "RESEP"}</span>
                <h4>${item.title}</h4>
            </div>
        </div>
    `,
    )
    .join("");
}

// --- INTERACTIONS ---
window.toggleIng = (id, el) => {
  if (selectedIngredients.has(id)) {
    selectedIngredients.delete(id);
    el.classList.remove("selected");
  } else {
    selectedIngredients.add(id);
    el.classList.add("selected");
  }
};

window.switchPage = (pageId) => {
  // Hide Pages
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");

  // Update Nav
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  const navIndex = [
    "home",
    "explore",
    "menu-page",
    "favorit",
    "profile-page",
  ].indexOf(pageId);
  document.querySelectorAll(".nav-item")[navIndex].classList.add("active");

  // Update Header Text & Warna
  const titles = {
    home: { t: "Mau masak apa?", s: "Yuk cek isi kulkasmu" },
    explore: { t: "Jelajahi", s: "Tips & Trik Dapur" },
    "menu-page": { t: "Daftar Menu", s: "Inspirasi Masakan" },
    favorit: { t: "Favoritku", s: "Disimpan untuk nanti" },
    "profile-page": { t: "Profil", s: "Pengaturan Akun" },
  };
  document.getElementById("page-title").innerText = titles[pageId].t;
  document.getElementById("page-subtitle").innerText = titles[pageId].s;

  // Reset Scroll
  document.querySelector(".content-sheet").scrollTo(0, 0);
};

// --- NOTIFIKASI SHEET ---
window.toggleNotifSheet = () => {
  const sheet = document.getElementById("notif-sheet");
  const backdrop = document.getElementById("sheet-backdrop");

  if (sheet.classList.contains("active")) {
    sheet.classList.remove("active");
    backdrop.classList.remove("active");
    setTimeout(() => (backdrop.style.display = "none"), 300);
  } else {
    backdrop.style.display = "block";
    backdrop.offsetHeight; // force reflow
    backdrop.classList.add("active");
    sheet.classList.add("active");
  }
};

// --- DETAIL VIEW OVERLAY ---
window.openDetail = (title, desc, img, tag) => {
  document.getElementById("detail-title").innerText = title;
  document.getElementById("detail-desc").innerText = desc;
  document.getElementById("detail-img").style.backgroundImage = `url('${img}')`;
  document.getElementById("detail-tag").innerText = tag;
  document.getElementById("detail-view").classList.add("active");
};

window.closeDetail = () => {
  document.getElementById("detail-view").classList.remove("active");
};

// --- AUTH ---
function updateAuthUI(user) {
  const btnContainer = document.getElementById("auth-btn-container");
  if (user) {
    document.getElementById("profile-name").innerText = user.displayName;
    document.getElementById("profile-email").innerText = user.email;
    document.getElementById("profile-avatar").innerHTML =
      `<img src="${user.photoURL}">`;
    btnContainer.innerHTML = `<button class="find-btn" style="background:#fee2e2; color:#b91c1c; padding:10px;" onclick="auth.signOut()">Logout</button>`;
  } else {
    document.getElementById("profile-name").innerText = "Guest User";
    document.getElementById("profile-email").innerText = "Belum Login";
    document.getElementById("profile-avatar").innerHTML = "G";
    btnContainer.innerHTML = `<button class="find-btn" style="background:#fff; color:#333; border:1px solid #ccc; padding:10px;" onclick="auth.signInWithPopup(provider)">Login Google</button>`;
  }
}
