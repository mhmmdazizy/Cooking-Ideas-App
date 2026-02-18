// CONFIG FIREBASE (Paste Config Anda)
const firebaseConfig = {
  apiKey: "AIzaSyBIM86KidwhWLIdQkVv38xfNJUK3pmKmc8",
  authDomain: "cookingideas-2a894.firebaseapp.com",
  projectId: "cookingideas-2a894",
  storageBucket: "cookingideas-2a894.firebasestorage.app",
  messagingSenderId: "376881959519",
  appId: "1:376881959519:web:46f75e2c840654b1ba01ea"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// DATA DUMMY
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
    title: "5 Tips Simpan Sayur Awet",
    tag: "TIPS",
    img: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=300&q=80",
  },
  {
    title: "Bumbu Dasar Wajib Punya",
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

let selectedIngredients = new Set();
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  renderIngredients();
  renderGrid("explore-container", articles); // Render Explore
  renderGrid("menu-container", menus); // Render Menu
  feather.replace();

  auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateUI(user);
  });
});

// Render Functions
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
        <div class="card-item" onclick="alert('Detail: ${item.title}')">
            <img src="${item.img}" class="card-thumb" loading="lazy">
            <div class="card-info">
                <span class="card-tag">${item.tag}</span>
                <h4>${item.title}</h4>
            </div>
        </div>
    `,
    )
    .join("");
}

// Interactions
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
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");

  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));

  // Highlight Nav yang sesuai
  let navId = "";
  if (pageId === "home") navId = 0;
  else if (pageId === "explore") navId = 1;
  else if (pageId === "menu-page") navId = 2;
  else if (pageId === "favorit") navId = 3;
  else if (pageId === "profile-page") navId = 4;

  document.querySelectorAll(".nav-item")[navId].classList.add("active");

  // Header Logic: Sembunyikan header di halaman Profile agar bersih
  const header = document.getElementById("main-header");
  if (pageId === "profile-page") {
    header.style.display = "none";
  } else {
    header.style.display = "flex";
  }
  window.scrollTo(0, 0);
};

// Notification Sheet
window.toggleNotifSheet = () => {
  const sheet = document.getElementById("notif-sheet");
  const backdrop = document.getElementById("sheet-backdrop");
  if (sheet.classList.contains("active")) {
    sheet.classList.remove("active");
    backdrop.classList.remove("active");
    setTimeout(() => (backdrop.style.display = "none"), 300);
  } else {
    backdrop.style.display = "block";
    backdrop.offsetHeight; // reflow
    backdrop.classList.add("active");
    sheet.classList.add("active");
  }
};

// Login Logic
function updateUI(user) {
  // Icon Google
  const googleIcon =
    "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg";

  if (user) {
    // Mini Header
    document.getElementById("header-username").innerText =
      user.displayName.split(" ")[0];
    document.getElementById("header-avatar").innerHTML =
      `<img src="${user.photoURL}">`;

    // Profile Page
    document.getElementById("profile-name-large").innerText = user.displayName;
    document.getElementById("profile-email-large").innerText = user.email;
    document.getElementById("profile-avatar-large").innerHTML =
      `<img src="${user.photoURL}">`;

    document.getElementById("auth-btn-container").innerHTML = `
            <button class="login-google-btn" style="border-color:#fee2e2; color:#b91c1c" onclick="auth.signOut()">
                Logout
            </button>
        `;
  } else {
    // Reset
    document.getElementById("header-username").innerText = "Guest User";
    document.getElementById("header-avatar").innerHTML = "G";

    document.getElementById("profile-name-large").innerText = "Guest User";
    document.getElementById("profile-email-large").innerText =
      "Login untuk simpan data";
    document.getElementById("profile-avatar-large").innerHTML = "G";

    document.getElementById("auth-btn-container").innerHTML = `
            <button class="login-google-btn" onclick="auth.signInWithPopup(provider)">
                <img src="${googleIcon}" width="18"> Masuk dengan Google
            </button>
        `;
  }
}

// Popup Info
window.openPopup = (type) => {
  let content = "";
  if (type === "bantuan")
    content = "<h3>Bantuan</h3><p>Pilih bahan di Home, klik cari resep.</p>";
  if (type === "tentang")
    content = "<h3>Tentang</h3><p>Aplikasi Masak Apa v1.0</p>";

  document.getElementById("popup-body").innerHTML = content;
  document.getElementById("info-popup").classList.add("active");
};
window.closePopup = () =>
  document.getElementById("info-popup").classList.remove("active");
window.resetData = () => {
  if (confirm("Reset data?")) location.reload();
};
window.toggleTheme = () => {
  if (document.body.getAttribute("data-theme") === "dark")
    document.body.removeAttribute("data-theme");
  else document.body.setAttribute("data-theme", "dark");
};

