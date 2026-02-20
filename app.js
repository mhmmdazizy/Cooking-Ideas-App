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

// Variables
let selectedIngredients = new Set();
let currentUser = null;
let favorites = JSON.parse(localStorage.getItem("myFavorites")) || [];
let myRecipes = []; // Data dari Cloud
let allCloudRecipes = [];

// --- 3. START APP ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("App Started...");
  // Memori lokal akan mengembalikan angka fav menu statis yang sudah di-like
  favorites.forEach((fav) => {
    const staticMenu = menus.find((m) => m.title === fav.title);
    if (staticMenu) staticMenu.favCount = fav.favCount || 1;

    const staticArticle = articles.find((a) => a.title === fav.title);
    if (staticArticle) staticArticle.favCount = fav.favCount || 1;
  });

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

    // 1. Ambil Resep dari Cloud
    db.collection("recipes")
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        myRecipes = [];
        allCloudRecipes = []; // Pakai variabel global yang baru

        snapshot.forEach((doc) => {
          const data = doc.data();
          data.id = doc.id;
          allCloudRecipes.push(data);

          if (currentUser && data.userId === currentUser.uid) {
            myRecipes.push(data);
          }
        });

        renderMyRecipes();
        // Render jika sedang di halaman menu
        if (document.getElementById("menu-page").classList.contains("active")) {
          renderGrid("menu-container", [...menus, ...allCloudRecipes]);
        }
      });

    // 2. SINKRONISASI ANGKA FAVORIT GLOBAL SE-DUNIA
    db.collection("counters").onSnapshot((snapshot) => {
      const globalCounts = {};
      snapshot.forEach((doc) => {
        // GANTI BARIS INI: Gunakan Math.max agar nilai terendah selalu 0
        globalCounts[doc.id] = Math.max(0, doc.data().favCount || 0);
      });

      // Fungsi penyemat angka terbaru ke semua data
      const applyFavCount = (arr) => {
        arr.forEach((item) => {
          const safeTitle = item.title.replace(/[^a-zA-Z0-9]/g, "_");
          item.favCount = globalCounts[safeTitle] || 0;
        });
      };

      // Terapkan ke semua daftar yang ada di aplikasi
      applyFavCount(menus);
      applyFavCount(articles);
      applyFavCount(allCloudRecipes);
      applyFavCount(favorites);
      localStorage.setItem("myFavorites", JSON.stringify(favorites)); // Simpan update

      // Render Ulang Layar yang sedang terbuka secara Realtime!
      if (document.getElementById("explore").classList.contains("active"))
        renderGrid("explore-container", articles);
      if (document.getElementById("menu-page").classList.contains("active"))
        renderGrid("menu-container", [...menus, ...allCloudRecipes]);
      if (document.getElementById("favorit").classList.contains("active"))
        renderGrid("favorit-container", favorites);
    });
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

// --- GANTI FUNGSI RENDER GRID ---
function renderGrid(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return; // Mencegah error jika wadah belum ada

  if (data.length === 0) {
    container.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#888;">Belum ada item.</p>`;
    return;
  }

  container.innerHTML = data
    .map((item) => {
      const isFav = favorites.some((f) => f.title === item.title);
      const safeDesc = (item.desc || "")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;")
        .replace(/\n/g, "<br>")
        .replace(/\r/g, "");
      const authorName = item.authorName || "Admin";
      const favCount = item.favCount || 0;
      const docId = item.id || "undefined";

      return `
    <div class="card-item" onclick="openArticle('${item.title}', '${item.tag}', '${item.img}', '${safeDesc}', '${authorName}')">
         
         <div class="fav-container">
             <button class="fav-btn ${isFav ? "active" : ""}" onclick="event.stopPropagation(); toggleFavorite('${docId}', '${item.title}', '${item.tag}', '${item.img}', '${safeDesc}', '${authorName}', this)">
                 <i data-feather="heart"></i>
             </button>
             <span class="fav-count">${favCount}</span>
         </div>

         <img src="${item.img}" class="card-thumb" loading="lazy">
         <div class="card-info">
             <span class="card-tag">${item.tag}</span>
             <h4 class="menu-title">${item.title}</h4>
             <div class="card-author" style="font-size:10px; color:#888; margin-top:5px; display:flex; gap:5px; align-items:center;">
                <i data-feather="user" style="width:10px;"></i> ${authorName}
             </div>
         </div>
    </div>`;
    })
    .join("");

  if (typeof feather !== "undefined") feather.replace();
}

window.toggleFavorite = (id, title, tag, img, desc, authorName, btn) => {
  const idx = favorites.findIndex((f) => f.title === title);
  const countSpan = btn.parentElement.querySelector(".fav-count");
  let currentCount = countSpan ? parseInt(countSpan.innerText) || 0 : 0;

  // Ubah judul jadi format aman untuk ID Database (Misal: "Soto Ayam" -> "Soto_Ayam")
  const safeTitleId = title.replace(/[^a-zA-Z0-9]/g, "_");

  if (idx === -1) {
    // JIKA DI-FAVORITKAN
    currentCount++;
    favorites.push({
      id,
      title,
      tag,
      img,
      desc,
      authorName,
      favCount: currentCount,
    });
    btn.classList.add("active");
    if (countSpan) countSpan.innerText = currentCount;

    // Kirim +1 ke Firebase Universal Counter
    db.collection("counters")
      .doc(safeTitleId)
      .set(
        {
          favCount: firebase.firestore.FieldValue.increment(1),
        },
        { merge: true },
      )
      .catch(console.error);
  } else {
    // JIKA DI-UNFAVORITKAN

    // HANYA kurangi di Firebase JIKA angka saat ini lebih dari 0
    if (currentCount > 0) {
      db.collection("counters")
        .doc(safeTitleId)
        .set(
          {
            favCount: firebase.firestore.FieldValue.increment(-1),
          },
          { merge: true },
        )
        .catch(console.error);
    }

    currentCount = Math.max(0, currentCount - 1);
    favorites.splice(idx, 1);
    btn.classList.remove("active");
    if (countSpan) countSpan.innerText = currentCount;

    // Kirim -1 ke Firebase Universal Counter
    db.collection("counters")
      .doc(safeTitleId)
      .set(
        {
          favCount: firebase.firestore.FieldValue.increment(-1),
        },
        { merge: true },
      )
      .catch(console.error);
  }

  if (document.getElementById("favorit").classList.contains("active")) {
    renderGrid("favorit-container", favorites);
  }

  localStorage.setItem("myFavorites", JSON.stringify(favorites));
  if (typeof feather !== "undefined") feather.replace();
};

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
        .replace(/"/g, "&quot;")
        .replace(/\n/g, "<br>")
        .replace(/\r/g, "");
      const authorName = item.authorName || "Saya";

      return `
        <div class="mini-card" onclick="openArticle('${item.title}', '${item.tag}', '${item.img}', '${safeDesc}', '${authorName}')">
            
            <div class="action-btns">
                <button class="edit-btn" onclick="event.stopPropagation(); openRecipeForm(${index})">
                    <i data-feather="edit-2" style="width:12px; height:12px;"></i>
                </button>
                <button class="del-btn" onclick="event.stopPropagation(); deleteMyRecipe('${item.id}')">
                    <i data-feather="trash-2" style="width:12px; height:12px;"></i>
                </button>
            </div>

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
// Tambahkan parameter 'author' di akhir (Default: "Admin")
window.openArticle = (title, tag, img, desc = null, author = "Admin") => {
  document.getElementById("detail-title").innerText = title;
  document.getElementById("detail-category").innerText = tag;
  document.getElementById("detail-image").style.backgroundImage =
    `url('${img}')`;

  // Update Nama Penulis
  document.getElementById("detail-author").innerText = author;

  let contentHTML = desc
    ? `<p>${desc.replace(/\n/g, "<br>")}</p>`
    : `<p>Tidak ada deskripsi.</p>`;
  document.getElementById("detail-desc").innerHTML = contentHTML;

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

// --- FITUR HAPUS RESEPKU ---
window.deleteMyRecipe = async (docId) => {
  if (!docId || docId === "undefined") return alert("Data error!");

  const confirmDelete = confirm(
    "Yakin ingin menghapus resep ini secara permanen?",
  );
  if (confirmDelete) {
    try {
      await db.collection("recipes").doc(docId).delete();
      alert("Resep berhasil dihapus!");
      // Tidak perlu panggil render ulang manual, karena .onSnapshot di atas otomatis mendeteksi perubahan database.
    } catch (error) {
      console.error("Gagal hapus:", error);
      alert("Gagal menghapus: " + error.message);
    }
  }
};

// --- FITUR SEARCH UNIVERSAL (Bisa dipakai di Menu, Explore, Favorit) ---
window.searchGrid = (inputId, containerId) => {
  const input = document.getElementById(inputId);
  if (!input) return;

  const filter = input.value.toLowerCase();
  const container = document.getElementById(containerId);
  if (!container) return;

  // Cari semua kartu di dalam container tersebut
  const cards = container.querySelectorAll(".card-item");

  cards.forEach((card) => {
    // Cari elemen H4 (Judulnya)
    const titleEl = card.querySelector("h4");
    if (titleEl) {
      const titleText = titleEl.innerText.toLowerCase();
      if (titleText.indexOf(filter) > -1) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    }
  });
};

// --- FITUR SHARE NATIVE ---
window.shareArticle = () => {
  // Ambil judul resep yang sedang dibuka
  const title = document.getElementById("detail-title").innerText;
  const url = window.location.href; // Link website kamu

  // Teks pesan yang akan dikirim
  const shareText = `Coba deh resep "${title}" ini! Cari resep praktis lainnya di aplikasi Masak Apa?`;

  // Cek apakah HP/Browser mendukung fitur Share Native
  if (navigator.share) {
    navigator
      .share({
        title: title,
        text: shareText,
        url: url,
      })
      .then(() => {
        console.log("Berhasil membagikan resep!");
      })
      .catch((error) => {
        console.log("Batal membagikan:", error);
      });
  } else {
    // Fallback untuk browser laptop/jadul yang gak support
    alert(`Bagikan resep ini ke temanmu!\n\n${shareText}\n${url}`);
  }
};
// --- FITUR CARI RESEP BERDASARKAN BAHAN (HOME) ---

window.findRecipes = () => {
  // 1. Cek apakah ada bahan yang dicentang
  if (selectedIngredients.size === 0) {
    alert("Pilih minimal 1 bahan di kulkasmu dulu ya!");
    return;
  }

  // 2. Gabungkan resep bawaan (database.js) dan resep cloud/Firebase
  const allRecipes = [...menus, ...myRecipes];

  // 3. Ubah daftar bahan yang dicentang menjadi Array
  // Contoh isi selectedArr: ['telur', 'nasi']
  const selectedArr = Array.from(selectedIngredients);

  // 4. Deteksi & Filter Resep Otomatis
  const matchedRecipes = allRecipes.filter((recipe) => {
    // Gabungkan judul dan deskripsi, lalu ubah jadi huruf kecil semua agar pencarian akurat
    const textToSearch = (recipe.title + " " + recipe.desc).toLowerCase();

    // Cek apakah dari bahan yg dipilih, ada yang teksnya nyangkut di resep ini
    // Menggunakan .some() berarti jika minimal 1 bahan cocok, resep akan ditampilkan
    return selectedArr.some((bahan) =>
      textToSearch.includes(bahan.toLowerCase()),
    );
  });

  // 5. Tampilkan Hasilnya ke Layar
  const resultSection = document.getElementById("recipe-results");
  const container = document.getElementById("results-container");

  // Pastikan wadahnya punya format grid kotak-kotak
  container.classList.add("masonry-grid");

  // Munculkan section hasil pencarian
  resultSection.style.display = "block";

  if (matchedRecipes.length > 0) {
    // Gunakan fungsi renderGrid agar tampilan card-nya sama persis dengan menu!
    renderGrid("results-container", matchedRecipes);
  } else {
    // Kalau kata "telur" atau bahan lainnya tidak ada di teks deskripsi manapun
    container.innerHTML = `
            <p style="grid-column: 1 / -1; text-align:center; color:var(--text-muted); font-size:13px; margin-top:10px;">
                Yah, belum ada resep yang cocok dengan bahan tersebut. Coba pilih bahan lain atau kurangi centangnya!
            </p>
        `;
  }

  // 6. Gulir (scroll) layar otomatis ke bawah melihat hasilnya
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
};

// --- FITUR NOTIFIKASI GLOBAL (FIREBASE) ---

// 1. Ambil memori notif apa saja yang sudah dihapus oleh user ini
let deletedNotifs = JSON.parse(localStorage.getItem("deletedNotifs")) || [];
let allNotifs = [];

// 2. Dengarkan data dari koleksi "notifications" di Firebase secara realtime
db.collection("notifications")
  .orderBy("createdAt", "desc")
  .onSnapshot((snapshot) => {
    allNotifs = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      data.id = doc.id;
      allNotifs.push(data);
    });
    renderNotifications();
  });

// 3. Render Notifikasi ke Layar
function renderNotifications() {
  const container = document.getElementById("notif-list-container");
  const dot = document.querySelector(".notif-dot"); // Titik merah di icon lonceng
  if (!container) return;

  // Filter: Hanya tampilkan notif yang ID-nya belum ada di daftar 'deletedNotifs'
  const visibleNotifs = allNotifs.filter((n) => !deletedNotifs.includes(n.id));

  if (visibleNotifs.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:#888; font-size:12px; margin-top:20px;">Belum ada notifikasi baru.</p>`;
    if (dot) dot.style.display = "none"; // Sembunyikan titik merah
    return;
  }

  if (dot) dot.style.display = "block"; // Munculkan titik merah karena ada notif

  container.innerHTML = visibleNotifs
    .map(
      (n) => `
        <div class="notif-item unread">
            <div class="notif-icon bg-blue" style="background:var(--primary);"><i data-feather="${n.icon || "bell"}"></i></div>
            <div style="flex:1;">
                <b style="font-size:13px;">${n.title}</b>
                <p style="margin:2px 0 0; font-size:11px; color:var(--text-muted);">${n.desc}</p>
            </div>
            <button class="del-notif-btn" onclick="deleteNotif('${n.id}')">
                <i data-feather="x" style="width:16px; height:16px;"></i>
            </button>
        </div>
    `,
    )
    .join("");

  if (typeof feather !== "undefined") feather.replace();
}

// 4. Fungsi Hapus Notifikasi (Hanya di HP user tersebut)
window.deleteNotif = (notifId) => {
  // Masukkan ID ke daftar hitam
  deletedNotifs.push(notifId);

  // Simpan ke memori HP
  localStorage.setItem("deletedNotifs", JSON.stringify(deletedNotifs));

  // Render ulang biar langsung hilang
  renderNotifications();
};
