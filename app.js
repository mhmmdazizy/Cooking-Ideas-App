// --- 1. CONFIG FIREBASE (PASTE CONFIG KAMU DI SINI) ---
const firebaseConfig = {
  apiKey: "AIzaSyBIM86KidwhWLIdQkVv38xfNJUK3pmKmc8",
  authDomain: "cookingideas-2a894.firebaseapp.com",
  projectId: "cookingideas-2a894",
  storageBucket: "cookingideas-2a894.firebasestorage.app",
  messagingSenderId: "376881959519",
  appId: "1:376881959519:web:46f75e2c840654b1ba01ea",
};

// Init Firebase & Firestore
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const db = firebase.firestore(); // Database Gratis

// --- 2. DATA DUMMY (MENU BAWAAN) ---
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
];

const articles = [
  {
    title: "Tips Sayur Awet",
    tag: "TIPS",
    img: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=300&q=80",
  },
  {
    title: "Bumbu Dasar",
    tag: "HACK",
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=80",
  },
];

// Variables
let selectedIngredients = new Set();
let currentUser = null;
let favorites = JSON.parse(localStorage.getItem("myFavorites")) || [];
let myRecipes = []; // Data dari Cloud

// --- 3. START APP ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("App Started...");

  // Render Data Statis Dulu (Supaya gak kosong)
  renderIngredients();
  renderGrid("explore-container", articles);
  renderGrid("menu-container", menus);

  // Render Icon (Penting biar gak hilang)
  if (typeof feather !== "undefined") feather.replace();

  // Cek Login & Load Data Cloud
  auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateUI(user);

    // Ambil Data dari Cloud Firestore (Gratis)
    db.collection("recipes")
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snapshot) => {
          myRecipes = [];
          const cloudMenus = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            cloudMenus.push(data);

            // Filter punya saya
            if (currentUser && data.userId === currentUser.uid) {
              myRecipes.push(data);
            }
          });

          // Render Ulang dengan Data Baru
          renderMyRecipes();
          renderGrid("menu-container", [...menus, ...cloudMenus]);
        },
        (error) => {
          console.error("Error loading recipes:", error);
        },
      );
  });
});

// --- 4. RENDER FUNCTIONS ---
function renderIngredients() {
  const el = document.getElementById("ingredients-container");
  if (el)
    el.innerHTML = ingredients
      .map(
        (ing) => `
    <div class="ing-item" onclick="toggleIng('${ing.id}', this)">
        <i data-feather="${ing.icon}"></i> ${ing.name}
    </div>`,
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
      const safeDesc = (item.desc || "")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");

      // Tentukan Nama Penulis (Jika dari user pakai authorName, jika statis pakai Admin)
      const author = item.authorName || "Admin";

      return `
      <div class="card-item" onclick="openArticle('${item.title}', '${item.tag}', '${item.img}', '${safeDesc}')">
         <button class="fav-btn ${isFav ? "active" : ""}" onclick="event.stopPropagation(); toggleFavorite('${item.title}', '${item.tag}', '${item.img}', this)">
             <i data-feather="heart"></i>
         </button>
         <img src="${item.img}" class="card-thumb" loading="lazy">
         <div class="card-info">
             <span class="card-tag">${item.tag}</span>
             <h4>${item.title}</h4>
             <div class="card-author"><i data-feather="user" style="width:10px; height:10px;"></i> ${author}</div>
         </div>
      </div>
  `;
    })
    .join("");

  if (typeof feather !== "undefined") feather.replace();
}

function renderMyRecipes() {
  const el = document.getElementById("my-recipes-scroll");
  if (!el) return;

  if (myRecipes.length === 0) {
    el.innerHTML = `<p style="font-size:12px; color:#888; padding:10px;">Belum ada resep.</p>`;
    return;
  }

  el.innerHTML = myRecipes
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
    </div>`;
    })
    .join("");

  if (typeof feather !== "undefined") feather.replace();
}

// --- 5. LOGIC SIMPAN RESEP (COMPRESS GAMBAR) ---
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const elem = document.createElement("canvas");
        // Resize ke lebar 500px (Biar ringan di database)
        const scaleFactor = 500 / img.width;
        elem.width = 500;
        elem.height = img.height * scaleFactor;
        const ctx = elem.getContext("2d");
        ctx.drawImage(img, 0, 0, elem.width, elem.height);
        // Kompres JPEG 70%
        resolve(elem.toDataURL("image/jpeg", 0.7));
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

window.saveMyRecipe = async () => {
  if (!currentUser) return alert("Login dulu!");

  const title = document.getElementById("rec-title").value;
  const tag = document.getElementById("rec-tag").value;
  const desc = document.getElementById("rec-desc").value;
  const fileInput = document.getElementById("rec-file");
  const editId = document.getElementById("edit-id").value; // Ambil ID jika ada

  if (!title) return alert("Judul wajib diisi!");

  // Validasi Foto: Wajib jika Buat Baru, Opsional jika Edit
  if (!editId && fileInput.files.length === 0)
    return alert("Wajib pilih foto!");

  const btn = document.querySelector("#recipe-form .find-btn");
  const originalText = btn.innerText;
  btn.innerText = "Memproses...";
  btn.disabled = true;

  try {
    let imageBase64 = null;

    // Cek jika user upload foto baru
    if (fileInput.files.length > 0) {
      btn.innerText = "Mengompres Gambar...";
      imageBase64 = await compressImage(fileInput.files[0]);
    }

    const recipeData = {
      userId: currentUser.uid,
      authorName: currentUser.displayName, // Update nama penulis sesuai akun Google
      authorPhoto: currentUser.photoURL,
      title: title,
      tag: tag,
      desc: desc,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    // Jika ada gambar baru, masukkan. Jika tidak, jangan timpa yg lama.
    if (imageBase64) {
      recipeData.img = imageBase64;
    }

    if (editId) {
      // MODE EDIT (Update Data yang ada)
      await db.collection("recipes").doc(editId).update(recipeData);
      alert("Resep berhasil diperbarui!");
    } else {
      // MODE BUAT BARU
      recipeData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      // Pastikan img ada untuk data baru
      if (!recipeData.img) throw new Error("Gambar wajib untuk resep baru");

      await db.collection("recipes").add(recipeData);
      alert("Resep berhasil dipublish!");
    }

    closeRecipeForm();
  } catch (error) {
    console.error(error);
    alert("Gagal: " + error.message);
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
};

// --- 6. NAVIGASI & UTILS ---
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

  let idx = 0;
  if (pageId === "explore") idx = 1;
  if (pageId === "menu-page") idx = 2;
  if (pageId === "favorit") idx = 3;
  if (pageId === "profile-page") idx = 4;

  const items = document.querySelectorAll(".nav-item");
  if (items[idx]) items[idx].classList.add("active");

  const header = document.getElementById("main-header");
  header.style.display = pageId === "profile-page" ? "none" : "flex";

  if (pageId === "favorit") renderGrid("favorit-container", favorites);
  window.scrollTo(0, 0);
};

window.toggleNotifSheet = () => {
  const sheet = document.getElementById("notif-sheet");
  const backdrop = document.getElementById("sheet-backdrop");
  if (sheet.classList.contains("active")) {
    sheet.classList.remove("active");
    backdrop.classList.remove("active");
    setTimeout(() => (backdrop.style.display = "none"), 300);
  } else {
    backdrop.style.display = "block";
    backdrop.offsetHeight;
    backdrop.classList.add("active");
    sheet.classList.add("active");
  }
};

window.toggleFavorite = (title, tag, img, btn) => {
  const idx = favorites.findIndex((f) => f.title === title);
  if (idx === -1) {
    favorites.push({ title, tag, img });
    btn.classList.add("active");
  } else {
    favorites.splice(idx, 1);
    btn.classList.remove("active");
  }

  if (document.getElementById("favorit").classList.contains("active")) {
    renderGrid("favorit-container", favorites);
  }
  localStorage.setItem("myFavorites", JSON.stringify(favorites));
};

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
  if (confirm("Reset?")) location.reload();
};

// --- 7. MODALS & POPUPS ---
window.openArticle = (title, tag, img, desc) => {
  document.getElementById("detail-title").innerText = title;
  document.getElementById("detail-category").innerText = tag;
  document.getElementById("detail-image").style.backgroundImage =
    `url('${img}')`;
  document.getElementById("detail-desc").innerHTML = desc
    ? `<p>${desc.replace(/\n/g, "<br>")}</p>`
    : `<p>Info tidak tersedia.</p>`;
  document.getElementById("article-view").classList.add("active");
  history.pushState({ modal: "article" }, null, "");
};

window.closeArticle = () => history.back();

window.openRecipeForm = (index = -1) => {
  if (!currentUser) return alert("Silakan Login Google dulu!");
  const form = document.getElementById("recipe-form");

  // Reset Form Default
  document.getElementById("rec-title").value = "";
  document.getElementById("rec-tag").value = "";
  document.getElementById("rec-desc").value = "";
  document.getElementById("rec-file").value = ""; // Reset file input
  document.getElementById("edit-index").value = index;
  document.getElementById("edit-id").value = ""; // Reset ID

  // JUDUL MODAL
  const titleEl = form.querySelector("h3");
  if (titleEl)
    titleEl.innerText = index >= 0 ? "Edit Resep" : "Buat Resep Baru";

  // JIKA MODE EDIT (Index >= 0)
  if (index >= 0 && myRecipes[index]) {
    const item = myRecipes[index];
    document.getElementById("rec-title").value = item.title;
    document.getElementById("rec-tag").value = item.tag;
    document.getElementById("rec-desc").value = item.desc || "";
    // Simpan ID Dokumen Firestore (Penting buat update)
    document.getElementById("edit-id").value = item.id;
  }

  form.style.display = "flex";
  history.pushState({ modal: "form" }, null, "");
};

window.closeRecipeForm = () => history.back();

window.openPopup = (type) => {
  let title = "",
    content = "",
    icon = "info";
  if (type === "bantuan") {
    title = "Bantuan";
    icon = "help-circle";
    content = `<div class="faq-item" onclick="this.classList.toggle('active')"><div class="faq-question">Cara pakai?</div><div class="faq-answer">Pilih bahan, cari resep.</div></div><button class="find-btn" onclick="location.href='mailto:muhammadazizy48@gmail.com'" style="margin-top:10px">Kontak Kami</button>`;
  } else if (type === "privasi") {
    title = "Privasi";
    icon = "shield";
    content = `<p>Data aman.</p><button class="find-btn" onclick="closePopup()">Tutup</button>`;
  } else if (type === "tentang") {
    title = "Tentang";
    content = `<center><img src="icon.png" width="50"><p>v1.0</p></center>`;
  }
  document.getElementById("popup-title").innerText = title;
  document.getElementById("popup-icon").setAttribute("data-feather", icon);
  document.getElementById("popup-body").innerHTML = content;
  document.getElementById("info-popup").classList.add("active");
  if (typeof feather !== "undefined") feather.replace();
  history.pushState({ modal: "popup" }, null, "");
};
window.closePopup = () => history.back();

// Listener Back Button
window.addEventListener("popstate", () => {
  const ids = ["recipe-form", "article-view", "info-popup"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      if (el.style.display === "flex") el.style.display = "none";
      el.classList.remove("active");
    }
  });
});

// UI Auth Update
function updateUI(user) {
  const btn = document.getElementById("auth-btn-container");
  if (!btn) return;

  if (user) {
    document.getElementById("header-username").innerText =
      user.displayName.split(" ")[0];
    document.getElementById("header-avatar").innerHTML =
      `<img src="${user.photoURL}">`;
    document.getElementById("profile-name-large").innerText = user.displayName;
    document.getElementById("profile-email-large").innerText = user.email;
    document.getElementById("profile-avatar-large").innerHTML =
      `<img src="${user.photoURL}">`;
    btn.innerHTML = `<button class="login-google-btn" style="color:red" onclick="auth.signOut()">Logout</button>`;
  } else {
    document.getElementById("header-username").innerText = "Guest";
    document.getElementById("header-avatar").innerHTML = "G";
    document.getElementById("profile-name-large").innerText = "Guest User";
    document.getElementById("profile-email-large").innerText =
      "Login untuk simpan";
    document.getElementById("profile-avatar-large").innerHTML = "G";
    btn.innerHTML = `<button class="login-google-btn" onclick="auth.signInWithPopup(provider)">Login Google</button>`;
  }
}
