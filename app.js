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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// --- 2. LOGIC APLIKASI ---

// Data Bahan & Resep (Tetap sama)
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
let currentUser = null; // Menyimpan data user login

document.addEventListener("DOMContentLoaded", () => {
  renderIngredients();

  // Cek Status Login (Realtime)
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User sedang login
      currentUser = user;
      updateUI_LoggedIn(user);
    } else {
      // User logout
      currentUser = null;
      updateUI_LoggedOut();
    }
  });

  feather.replace();
});

// --- FUNGSI LOGIN / LOGOUT (GOOGLE REAL) ---

window.handleLogin = () => {
  auth
    .signInWithPopup(provider)
    .then((result) => {
      // Login sukses
      toggleAccountMenu(); // Tutup menu
      alert(`Selamat datang, ${result.user.displayName}!`);
    })
    .catch((error) => {
      console.error(error);
      alert("Login Gagal: " + error.message);
    });
};

window.handleLogout = () => {
  auth.signOut().then(() => {
    alert("Berhasil Logout");
    toggleAccountMenu();
  });
};

function updateUI_LoggedIn(user) {
  // Update Header
  document.getElementById("header-username").innerText =
    user.displayName.split(" ")[0]; // Nama depan aja

  // Ganti Avatar dengan Foto Profil Google
  const avatarEl = document.getElementById("header-avatar");
  avatarEl.innerHTML = `<img src="${user.photoURL}" style="width:100%; height:100%; border-radius:50%;">`;
  avatarEl.style.background = "transparent"; // Hapus background warna

  // Update Menu Drawer
  const loginSec = document.getElementById("login-section");
  loginSec.innerHTML = `
        <div style="text-align:center; margin-bottom:20px;">
            <img src="${user.photoURL}" style="width:60px; height:60px; border-radius:50%; margin-bottom:10px;">
            <h3 style="margin:0; font-size:16px;">${user.displayName}</h3>
            <p style="margin:0; font-size:12px; color:#666;">${user.email}</p>
        </div>
        <button onclick="handleLogout()" class="reset-btn" style="width:100%; background:#ffebee; color:#d32f2f;">
            <i data-feather="log-out"></i> Keluar / Logout
        </button>
    `;
  feather.replace();
}

function updateUI_LoggedOut() {
  // Reset Header
  document.getElementById("header-username").innerText = "Guest";
  document.getElementById("header-avatar").innerHTML = "G";
  document.getElementById("header-avatar").style.background = "var(--primary)";

  // Reset Menu Drawer ke Tombol Login Google
  const loginSec = document.getElementById("login-section");
  loginSec.innerHTML = `
        <p>Simpan preferensi dan resep favorit.</p>
        <button class="google-btn" onclick="handleLogin()">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G">
            Masuk dengan Google
        </button>
    `;
}

// --- FUNGSI UTAMA LAINNYA (SAMA SEPERTI SEBELUMNYA) ---

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
  // Efek getar dikit pas klik (Haptic Feedback)
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
      '<p style="text-align:center; color:var(--text-muted); font-size:14px; padding:20px;">Belum ada resep yang pas nih. <br>Coba tambah bahan lain.</p>';
  } else {
    resultsContainer.innerHTML = matched
      .map(
        (r) => `
            <div class="recipe-card">
                <img src="${r.img}" class="recipe-img" alt="${r.name}">
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

window.switchPage = (pageId) => {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");

  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  event.currentTarget.classList.add("active");
};

window.toggleAccountMenu = () => {
  const overlay = document.getElementById("account-overlay");
  if (overlay.classList.contains("visible")) {
    overlay.classList.remove("visible");
    setTimeout(() => (overlay.style.display = "none"), 300);
  } else {
    overlay.style.display = "flex";
    overlay.offsetHeight;
    overlay.classList.add("visible");
  }
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


