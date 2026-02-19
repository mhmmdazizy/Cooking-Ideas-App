// --- 1. CONFIG FIREBASE (PASTE CONFIG KAMU DI SINI) ---
const firebaseConfig = {
  apiKey: "AIzaSyBIM86KidwhWLIdQkVv38xfNJUK3pmKmc8",
  authDomain: "cookingideas-2a894.firebaseapp.com",
  projectId: "cookingideas-2a894",
  storageBucket: "cookingideas-2a894.firebasestorage.app",
  messagingSenderId: "376881959519",
  appId: "1:376881959519:web:46f75e2c840654b1ba01ea",
};

// Init Firebase
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// --- 2. DATA DUMMY ---
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

const articles = [
  {
    title: "5 Tips Simpan Sayur",
    tag: "TIPS",
    img: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=300&q=80",
  },
  {
    title: "Bumbu Dasar Wajib",
    tag: "HACK",
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=80",
  },
  {
    title: "Kenapa Masakan Asin?",
    tag: "INFO",
    img: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=300&q=80",
  },
  {
    title: "Alat Masak Anak Kos",
    tag: "LIST",
    img: "https://images.unsplash.com/photo-1584620606775-430335b71948?w=300&q=80",
  },
];

const menus = [
  {
    title: "Nasi Goreng Spesial",
    tag: "15 MIN",
    img: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&q=80",
  },
  {
    title: "Soto Ayam Kuning",
    tag: "KUAH",
    img: "https://images.unsplash.com/photo-1633436375795-12b3b339712f?w=300&q=80",
  },
  {
    title: "Ayam Bakar Madu",
    tag: "BAKAR",
    img: "https://images.unsplash.com/photo-1614398751058-eb2e0bf63e53?w=300&q=80",
  },
  {
    title: "Tumis Kangkung",
    tag: "SAYUR",
    img: "https://images.unsplash.com/photo-1566311684307-c255734e9eb0?w=300&q=80",
  },
];

// State Variables
let selectedIngredients = new Set();
let currentUser = null;
let favorites = JSON.parse(localStorage.getItem("myFavorites")) || [];
let myRecipes = [];

// --- 3. EVENT LISTENER UTAMA ---
document.addEventListener("DOMContentLoaded", () => {
  renderIngredients();
  renderGrid("explore-container", articles);
  renderGrid("menu-container", menus);

  // Init Icons
  if (typeof feather !== "undefined") feather.replace();

  // Auth Listener
  auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateUI(user);

    if (user) {
      const saved = localStorage.getItem("recipes_" + user.uid);
      myRecipes = saved ? JSON.parse(saved) : [];
    } else {
      myRecipes = [];
    }

    renderMyRecipes();
    // Gabung menu bawaan + menu user
    renderGrid("menu-container", [...menus, ...myRecipes]);
  });
});

// --- 4. RENDER FUNCTIONS ---
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
  const container = document.getElementById(containerId);
  if (data.length === 0) {
    container.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#888; margin-top:20px;">Belum ada item.</p>`;
    return;
  }

  container.innerHTML = data
    .map((item) => {
      const isFav = favorites.some((fav) => fav.title === item.title);
      // Sanitize deskripsi agar tidak error saat dikirim via onclick
      const safeDesc = (item.desc || "")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");

      return `
      <div class="card-item" onclick="openArticle('${item.title}', '${item.tag}', '${item.img}', '${safeDesc}')">
         <button class="fav-btn ${isFav ? "active" : ""}" onclick="event.stopPropagation(); toggleFavorite('${item.title}', '${item.tag}', '${item.img}', this)">
             <i data-feather="heart"></i>
         </button>
         <img src="${item.img}" class="card-thumb" loading="lazy">
         <div class="card-info">
             <span class="card-tag">${item.tag}</span>
             <h4>${item.title}</h4>
         </div>
      </div>
  `;
    })
    .join("");

  if (typeof feather !== "undefined") feather.replace();
}

function renderMyRecipes() {
  const container = document.getElementById("my-recipes-scroll");
  if (myRecipes.length === 0) {
    container.innerHTML = `<p style="font-size:12px; color:#888; padding:10px;">Belum ada resep buatanmu.</p>`;
    return;
  }

  container.innerHTML = myRecipes
    .map((item, index) => {
      const safeDesc = (item.desc || "")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");
      return `
        <div class="mini-card" onclick="openArticle('${item.title}', '${item.tag}', '${item.img}', '${safeDesc}')">
            <button class="edit-btn" onclick="event.stopPropagation(); openRecipeForm(${index})">
                <i data-feather="edit-2" style="width:12px; height:12px;"></i>
            </button>
            <img src="${item.img}" loading="lazy">
            <div class="mini-card-info">
                <span class="card-tag" style="font-size:8px;">${item.tag}</span>
                <h4 style="margin-top:4px;">${item.title}</h4>
            </div>
        </div>
    `;
    })
    .join("");

  if (typeof feather !== "undefined") feather.replace();
}

// --- 5. INTERACTION LOGIC ---

// Toggle Bahan
window.toggleIng = (id, el) => {
  if (selectedIngredients.has(id)) {
    selectedIngredients.delete(id);
    el.classList.remove("selected");
  } else {
    selectedIngredients.add(id);
    el.classList.add("selected");
  }
};

// Ganti Halaman (Navigasi Bawah)
window.switchPage = (pageId) => {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");

  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));

  let navIndex = 0;
  if (pageId === "explore") navIndex = 1;
  if (pageId === "menu-page") navIndex = 2;
  if (pageId === "favorit") navIndex = 3;
  if (pageId === "profile-page") navIndex = 4;

  const navItems = document.querySelectorAll(".nav-item");
  if (navItems[navIndex]) navItems[navIndex].classList.add("active");

  // Header Logic
  const header = document.getElementById("main-header");
  if (pageId === "profile-page") {
    header.style.display = "none";
  } else {
    header.style.display = "flex";
  }

  if (pageId === "favorit") {
    renderGrid("favorit-container", favorites);
  }

  window.scrollTo(0, 0);
};

// Notifikasi
window.toggleNotifSheet = () => {
  const sheet = document.getElementById("notif-sheet");
  const backdrop = document.getElementById("sheet-backdrop");

  if (sheet.classList.contains("active")) {
    sheet.classList.remove("active");
    backdrop.classList.remove("active");
    setTimeout(() => (backdrop.style.display = "none"), 300);
  } else {
    backdrop.style.display = "block";
    // Force Reflow
    backdrop.offsetHeight;
    backdrop.classList.add("active");
    sheet.classList.add("active");
  }
};

// Favorit
window.toggleFavorite = (title, tag, img, btn) => {
  const index = favorites.findIndex((f) => f.title === title);
  if (index === -1) {
    favorites.push({ title, tag, img });
    btn.classList.add("active");
  } else {
    favorites.splice(index, 1);
    btn.classList.remove("active");
    if (document.getElementById("favorit").classList.contains("active")) {
      renderGrid("favorit-container", favorites);
    }
  }
  localStorage.setItem("myFavorites", JSON.stringify(favorites));
  if (typeof feather !== "undefined") feather.replace();
};

// --- 6. LOGIC TOMBOL BACK & MODAL (SANGAT PENTING) ---

// Listener Back Button HP (Popstate)
window.onpopstate = (event) => {
  const articleView = document.getElementById("article-view");
  const recipeForm = document.getElementById("recipe-form");
  const infoPopup = document.getElementById("info-popup");

  // Jika Artikel terbuka -> Tutup
  if (articleView && articleView.classList.contains("active")) {
    articleView.classList.remove("active");
    return;
  }
  // Jika Form Resep terbuka -> Tutup
  if (recipeForm && recipeForm.style.display === "flex") {
    recipeForm.style.display = "none";
    return;
  }
  // Jika Popup Info terbuka -> Tutup
  if (infoPopup && infoPopup.classList.contains("active")) {
    infoPopup.classList.remove("active");
    return;
  }
};

// -- FUNGSI BUKA ARTIKEL --
window.openArticle = (title, tag, img, desc = null) => {
  document.getElementById("detail-title").innerText = title;
  document.getElementById("detail-category").innerText = tag;
  document.getElementById("detail-image").style.backgroundImage =
    `url('${img}')`;

  let contentHTML = desc
    ? `<p>${desc.replace(/\n/g, "<br>")}</p>`
    : `<p>Tidak ada deskripsi.</p>`;
  document.getElementById("detail-desc").innerHTML = contentHTML;

  // Tampilkan
  document.getElementById("article-view").classList.add("active");

  // Push History (Agar tombol back HP jalan)
  history.pushState({ modal: "article" }, null, "");
};

// -- FUNGSI TUTUP ARTIKEL (Manual) --
window.closeArticle = () => {
  // Panggil history.back() agar trigger onpopstate di atas
  history.back();
};

// --- 7. LOGIC FORM RESEPKU ---

// -- FUNGSI BUKA FORM --
window.openRecipeForm = (index = -1) => {
  if (!currentUser) {
    alert("Silakan Login Google dulu untuk menambah resep!");
    return;
  }

  // Reset Form
  document.getElementById("rec-title").value = "";
  document.getElementById("rec-tag").value = "";
  document.getElementById("rec-img").value = "";
  document.getElementById("rec-desc").value = "";
  document.getElementById("edit-index").value = index;

  if (index >= 0 && myRecipes[index]) {
    const item = myRecipes[index];
    document.getElementById("rec-title").value = item.title;
    document.getElementById("rec-tag").value = item.tag;
    document.getElementById("rec-img").value = item.img;
    document.getElementById("rec-desc").value = item.desc || "";
  }

  // Tampilkan Form
  const form = document.getElementById("recipe-form");
  form.style.display = "flex";

  // Push History
  history.pushState({ modal: "form" }, null, "");
};

// -- FUNGSI TUTUP FORM --
window.closeRecipeForm = () => {
  history.back();
};

// -- FUNGSI SIMPAN RESEP --
window.saveMyRecipe = () => {
  if (!currentUser) return;

  const title = document.getElementById("rec-title").value;
  const tag = document.getElementById("rec-tag").value;
  const img =
    document.getElementById("rec-img").value || "https://placehold.co/300x200";
  const desc = document.getElementById("rec-desc").value;
  const index = parseInt(document.getElementById("edit-index").value);

  if (!title) return alert("Judul wajib diisi!");

  const newRecipe = { title, tag, img, desc };

  if (index >= 0) {
    myRecipes[index] = newRecipe;
  } else {
    myRecipes.push(newRecipe);
  }

  localStorage.setItem("recipes_" + currentUser.uid, JSON.stringify(myRecipes));

  // Tutup form (trigger history back)
  history.back();

  // Render ulang
  renderMyRecipes();
  renderGrid("menu-container", [...menus, ...myRecipes]);

  alert("Resep tersimpan!");
};

// --- 8. LOGIC POPUP INFO/FAQ ---
window.openPopup = (type) => {
  let title = "",
    content = "",
    iconName = "info";

  if (type === "bantuan") {
    title = "Bantuan & FAQ";
    iconName = "help-circle";
    content = `
       <input type="text" id="faq-search" onkeyup="searchFaq()" placeholder="Cari..." style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #ddd; border-radius:8px;">
       <div id="faq-list">
          <div class="faq-item" onclick="this.classList.toggle('active')">
             <div class="faq-question">Cara pakai? <i data-feather="chevron-down" style="float:right"></i></div>
             <div class="faq-answer">Pilih bahan di Home, klik Cari Resep.</div>
          </div>
          <div class="faq-item" onclick="this.classList.toggle('active')">
             <div class="faq-question">Gratis? <i data-feather="chevron-down" style="float:right"></i></div>
             <div class="faq-answer">Ya, 100% gratis.</div>
          </div>
       </div>
       <button class="find-btn" onclick="window.location.href='mailto:muhammadazizy48@gmail.com'" style="margin-top:20px; width:100%">
          <i data-feather="mail"></i> Hubungi Kami
       </button>
    `;
  } else if (type === "privasi") {
    title = "Kebijakan Privasi";
    iconName = "shield";
    content = `<p>Kami tidak menyalahgunakan data Anda.</p><button class="find-btn" onclick="closePopup()">Tutup</button>`;
  } else if (type === "tentang") {
    title = "Tentang";
    content = `<div style="text-align:center"><img src="icon.png" width="60"><p>v1.0.0</p></div>`;
  }

  document.getElementById("popup-title").innerText = title;
  document.getElementById("popup-icon").setAttribute("data-feather", iconName);
  document.getElementById("popup-body").innerHTML = content;

  document.getElementById("info-popup").classList.add("active");
  if (typeof feather !== "undefined") feather.replace();

  // Push History
  history.pushState({ modal: "popup" }, null, "");
};

window.closePopup = () => {
  history.back();
};

window.searchFaq = () => {
  const filter = document.getElementById("faq-search").value.toLowerCase();
  const items = document.getElementsByClassName("faq-item");
  for (let i = 0; i < items.length; i++) {
    const txt = items[i].innerText || items[i].textContent;
    items[i].style.display = txt.toLowerCase().includes(filter) ? "" : "none";
  }
};

// --- 9. UTILS (Theme & Reset) ---
window.toggleTheme = () => {
  const body = document.body;
  const isDark = body.getAttribute("data-theme") === "dark";
  const btn = document.getElementById("theme-btn");

  if (isDark) {
    body.removeAttribute("data-theme");
    if (btn) btn.innerHTML = `<i data-feather="moon"></i> Mode Gelap`;
  } else {
    body.setAttribute("data-theme", "dark");
    if (btn) btn.innerHTML = `<i data-feather="sun"></i> Mode Terang`;
  }
  if (typeof feather !== "undefined") feather.replace();
};

window.resetData = () => {
  if (confirm("Reset data?")) location.reload();
};

// --- AUTH UI ---
function updateUI(user) {
  const googleIcon =
    "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg";
  if (user) {
    document.getElementById("header-username").innerText =
      user.displayName.split(" ")[0];
    document.getElementById("header-avatar").innerHTML =
      `<img src="${user.photoURL}">`;

    document.getElementById("profile-name-large").innerText = user.displayName;
    document.getElementById("profile-email-large").innerText = user.email;
    document.getElementById("profile-avatar-large").innerHTML =
      `<img src="${user.photoURL}">`;

    document.getElementById("auth-btn-container").innerHTML =
      `<button class="login-google-btn" style="border-color:#fee2e2; color:#b91c1c" onclick="auth.signOut()">Logout</button>`;
  } else {
    document.getElementById("header-username").innerText = "Guest User";
    document.getElementById("header-avatar").innerHTML = "G";

    document.getElementById("profile-name-large").innerText = "Guest User";
    document.getElementById("profile-email-large").innerText =
      "Login untuk simpan data";
    document.getElementById("profile-avatar-large").innerHTML = "G";

    document.getElementById("auth-btn-container").innerHTML =
      `<button class="login-google-btn" onclick="auth.signInWithPopup(provider)"><img src="${googleIcon}" width="18"> Masuk dengan Google</button>`;
  }
}
