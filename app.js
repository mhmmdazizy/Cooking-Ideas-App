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

// --- 2. DATA UTAMA ---
const ingredients = [
  { id: "telur", name: "Telur", icon: "disc" },
  { id: "tempe", name: "Tempe", icon: "square" },
  { id: "tahu", name: "Tahu", icon: "box" },
  { id: "ayam", name: "Ayam", icon: "gitlab" },
  { id: "bawang", name: "Bawang", icon: "smile" },
  { id: "cabe", name: "Cabai", icon: "zap" },
  { id: "kecap", name: "Kecap", icon: "droplet" },
  { id: "nasi", name: "Nasi", icon: "loader" },
];

const recipes = [
  {
    name: "Nasi Goreng Kampung",
    req: ["nasi", "bawang", "kecap"],
    img: "https://placehold.co/60x60/orange/white?text=NG",
  },
  {
    name: "Telur Dadar Kecap",
    req: ["telur", "kecap", "bawang"],
    img: "https://placehold.co/60x60/yellow/black?text=TD",
  },
  {
    name: "Orek Tempe",
    req: ["tempe", "kecap", "cabe"],
    img: "https://placehold.co/60x60/brown/white?text=OT",
  },
  {
    name: "Tahu Penyet",
    req: ["tahu", "cabe", "bawang"],
    img: "https://placehold.co/60x60/white/black?text=TP",
  },
  {
    name: "Telur Ceplok",
    req: ["telur"],
    img: "https://placehold.co/60x60/yellow/white?text=TC",
  },
];

let selectedIngredients = new Set();
let currentUser = null;

// --- 3. LOGIKA APLIKASI ---
document.addEventListener("DOMContentLoaded", () => {
  renderIngredients();

  // Cek Login Status
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      updateUI_LoggedIn(user);
    } else {
      currentUser = null;
      updateUI_LoggedOut();
    }
  });

  feather.replace();
});

// --- Navigasi Halaman ---
window.switchPage = (pageId) => {
  // 1. Hide semua page
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  // 2. Show target page
  document.getElementById(pageId).classList.add("active");

  // 3. Update Bottom Nav Active State
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));

  // Highlight nav item yang sesuai
  let navId = "";
  if (pageId === "home") navId = "home";
  else if (pageId === "explore") navId = "explore";
  else if (pageId === "menu-page") navId = "menu-page";
  else if (pageId === "favorit") navId = "favorit";
  else if (pageId === "profile-page") {
    navId = "profile-page";
    document.getElementById("nav-profile").classList.add("active"); // Khusus profil
  }

  // Cari elemen nav yg href onclick-nya match (kecuali profil yg udah dihandle)
  if (pageId !== "profile-page") {
    const targetNav = Array.from(document.querySelectorAll(".nav-item")).find(
      (el) => el.getAttribute("onclick").includes(pageId),
    );
    if (targetNav) targetNav.classList.add("active");
  }

  // 4. Atur Header (Sembunyikan header mini di halaman profil full)
  const header = document.getElementById("main-header");
  if (pageId === "profile-page") {
    header.style.display = "none";
  } else {
    header.style.display = "block";
  }

  window.scrollTo(0, 0);
};

// --- Update UI Profil ---
function updateUI_LoggedIn(user) {
  // Mini Header
  document.getElementById("header-username").innerText =
    user.displayName.split(" ")[0];
  const avatarEl = document.getElementById("header-avatar");
  avatarEl.innerHTML = `<img src="${user.photoURL}">`;
  avatarEl.style.background = "transparent";

  // Halaman Profil Besar
  document.getElementById("profile-name-large").innerText = user.displayName;
  document.getElementById("profile-email-large").innerText = user.email;
  document.getElementById("profile-avatar-large").innerHTML =
    `<img src="${user.photoURL}">`;
  document.getElementById("profile-avatar-large").style.background =
    "transparent";

  // Tombol Logout
  document.getElementById("auth-btn-container").innerHTML = `
        <button class="auth-btn btn-logout" onclick="handleLogout()">
            <i data-feather="log-out"></i> Keluar
        </button>
    `;
  feather.replace();
}

function updateUI_LoggedOut() {
  // Mini Header
  document.getElementById("header-username").innerText = "Guest";
  document.getElementById("header-avatar").innerHTML = "G";
  document.getElementById("header-avatar").style.background = "var(--primary)";

  // Halaman Profil Besar
  document.getElementById("profile-name-large").innerText = "Guest User";
  document.getElementById("profile-email-large").innerText =
    "Login untuk simpan data";
  document.getElementById("profile-avatar-large").innerHTML = "G";
  document.getElementById("profile-avatar-large").style.background =
    "var(--primary)";

  // Tombol Login
  document.getElementById("auth-btn-container").innerHTML = `
        <button class="auth-btn btn-login-google" onclick="handleLogin()">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="18">
            Masuk dengan Google
        </button>
    `;
}

// --- Login & Logout ---
window.handleLogin = () => {
  auth
    .signInWithPopup(provider)
    .then((result) => {
      alert(`Selamat datang, ${result.user.displayName}!`);
    })
    .catch((error) => alert("Login Gagal: " + error.message));
};

window.handleLogout = () => {
  auth.signOut().then(() => alert("Berhasil Logout"));
};

// --- Popup Info & Bantuan ---
const popupData = {
  bantuan: {
    title: "Bantuan & FAQ",
    content: `
            <h4>Cara pakai aplikasi?</h4>
            <p>Cukup pilih bahan yang ada di kulkas kamu di halaman Home, lalu klik "Cari Resep".</p>
            <h4>Apakah resepnya akurat?</h4>
            <p>Resep disesuaikan dengan bahan minimal yang kamu punya.</p>
        `,
  },
  privasi: {
    title: "Kebijakan Privasi",
    content: `
            <p>Kami sangat menghargai privasi Anda. Data login Google hanya digunakan untuk menampilkan nama dan foto profil.</p>
            <p>Kami tidak menyimpan data pribadi sensitif Anda di server kami.</p>
        `,
  },
  tentang: {
    title: "Tentang Aplikasi",
    content: `
            <p><b>Masak Apa? v1.0</b></p>
            <p>Dibuat dengan ❤️ oleh Developer.</p>
            <p>Aplikasi ini dibuat untuk membantu anak kos dan ibu rumah tangga memasak tanpa bingung.</p>
        `,
  },
};

window.openPopup = (type) => {
  const data = popupData[type];
  if (data) {
    document.getElementById("popup-title").innerText = data.title;
    document.getElementById("popup-body").innerHTML = data.content;

    const popup = document.getElementById("info-popup");
    popup.style.display = "flex";
    // Force Reflow
    popup.offsetHeight;
    popup.classList.add("active");
  }
};

window.closePopup = () => {
  const popup = document.getElementById("info-popup");
  popup.classList.remove("active");
  setTimeout(() => {
    popup.style.display = "none";
  }, 300);
};

// Tutup popup kalau klik di luar area kartu
document.getElementById("info-popup").addEventListener("click", (e) => {
  if (e.target.id === "info-popup") closePopup();
});

// --- Fitur Lain (Sama) ---
function renderIngredients() {
  const container = document.getElementById("ingredients-container");
  container.innerHTML = ingredients
    .map(
      (ing) => `
        <div class="ing-item" onclick="toggleIngredient('${ing.id}', this)">
            <i data-feather="${ing.icon}"></i>
            ${ing.name}
        </div>
    `,
    )
    .join("");
  feather.replace();
}

window.toggleIngredient = (id, el) => {
  if (navigator.vibrate) navigator.vibrate(10);
  if (selectedIngredients.has(id)) {
    selectedIngredients.delete(id);
    el.classList.remove("selected");
  } else {
    selectedIngredients.add(id);
    el.classList.add("selected");
  }
};

window.findRecipes = () => {
  const resultsContainer = document.getElementById("results-container");
  const resultsSection = document.getElementById("recipe-results");

  const matched = recipes.filter((recipe) => {
    return recipe.req.every((r) => selectedIngredients.has(r));
  });

  if (matched.length === 0) {
    resultsContainer.innerHTML =
      '<p style="text-align:center; color:var(--text-muted); padding:20px;">Bahan kurang lengkap.</p>';
  } else {
    resultsContainer.innerHTML = matched
      .map(
        (r) => `
            <div class="recipe-card">
                <img src="${r.img}" class="recipe-img">
                <div class="recipe-info">
                    <h3>${r.name}</h3>
                    <p>Bahan: ${r.req.join(", ")}</p>
                    <span class="match-badge">Bisa dimasak!</span>
                </div>
            </div>
        `,
      )
      .join("");
  }
  resultsSection.style.display = "block";
  resultsSection.scrollIntoView({ behavior: "smooth" });
};

window.toggleTheme = () => {
  if (document.body.getAttribute("data-theme") === "dark") {
    document.body.removeAttribute("data-theme");
  } else {
    document.body.setAttribute("data-theme", "dark");
  }
};

window.resetData = () => {
  if (confirm("Hapus semua data local?")) {
    localStorage.clear();
    location.reload();
  }
};
