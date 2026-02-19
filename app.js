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

// --- 3. START APP ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("App Started...");
  // Memori lokal akan mengembalikan angka fav menu statis yang sudah di-like
  favorites.forEach(fav => {
      const staticMenu = menus.find(m => m.title === fav.title);
      if (staticMenu) staticMenu.favCount = fav.favCount || 1;
      
      const staticArticle = articles.find(a => a.title === fav.title);
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

    // Ambil Data dari Cloud Firestore (Gratis)
    db.collection("recipes").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
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

            // --- TAMBAHKAN FIX SINKRONISASI TAB FAVORIT ---
            // Update angka fav di memori lokal berdasarkan data terbaru dari cloud
            const favIdx = favorites.findIndex(f => f.title === data.title);
            if (favIdx !== -1) {
                favorites[favIdx].favCount = data.favCount || 0;
            }
        });

        // Simpan update favCount ke localStorage
        localStorage.setItem("myFavorites", JSON.stringify(favorites));

        // Render Ulang dengan Data Baru
        renderMyRecipes();
        renderGrid("menu-container", [...menus, ...cloudMenus]);
        
        // Render ulang menu favorit jika sedang dibuka (biar angkanya ikut update)
        if (document.getElementById("favorit").classList.contains("active")) {
            renderGrid("favorit-container", favorites);
        }
    }, (error) => {
        console.error("Error loading recipes:", error);
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
  if(!container) return; // Mencegah error jika wadah belum ada

  if (data.length === 0) {
    container.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#888;">Belum ada item.</p>`;
    return;
  }
  
  container.innerHTML = data.map(item => {
    const isFav = favorites.some(f => f.title === item.title);
    const safeDesc = (item.desc || "").replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '<br>').replace(/\r/g, '');
    const authorName = item.authorName || "Admin"; 
    const favCount = item.favCount || 0;
    const docId = item.id || 'undefined';

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
  }).join("");
  
  if (typeof feather !== "undefined") feather.replace();
}

window.toggleFavorite = (id, title, tag, img, desc, authorName, btn) => {
  const idx = favorites.findIndex(f => f.title === title);
  
  const countSpan = btn.parentElement.querySelector('.fav-count');
  let currentCount = countSpan ? (parseInt(countSpan.innerText) || 0) : 0;

  if (idx === -1) { 
      // JIKA DI-FAVORITKAN
      currentCount++;
      // Simpan favCount ke dalam daftar favorit
      favorites.push({ id, title, tag, img, desc, authorName, favCount: currentCount }); 
      btn.classList.add("active"); 
      
      if(countSpan) countSpan.innerText = currentCount;

      if (id !== 'undefined') {
          db.collection("recipes").doc(id).update({
              favCount: firebase.firestore.FieldValue.increment(1)
          }).catch(err => console.error(err));
      }
  } else { 
      // JIKA DI-UNFAVORITKAN
      currentCount = Math.max(0, currentCount - 1);
      favorites.splice(idx, 1); 
      btn.classList.remove("active"); 
      
      if(countSpan) countSpan.innerText = currentCount;

      if (id !== 'undefined') {
          db.collection("recipes").doc(id).update({
              favCount: firebase.firestore.FieldValue.increment(-1)
          }).catch(err => console.error(err));
      }
  }
  
  // --- TAMBAHAN FIX UNTUK MENU STATIS (Bawaan Aplikasi) ---
  // Update angka di memori agar saat direfresh tidak kembali ke 0
  const staticMenu = menus.find(m => m.title === title);
  if (staticMenu) staticMenu.favCount = currentCount;
  
  const staticArticle = articles.find(a => a.title === title);
  if (staticArticle) staticArticle.favCount = currentCount;
  // ---------------------------------------------------------

  // Update tampilan di halaman favorit secara realtime
  if (document.getElementById("favorit").classList.contains("active")) {
      renderGrid("favorit-container", favorites);
  }
  
  localStorage.setItem("myFavorites", JSON.stringify(favorites));
  if (typeof feather !== "undefined") feather.replace();
};



function renderMyRecipes() {
  const el = document.getElementById("my-recipes-scroll");
  if(!el) return;

  if (myRecipes.length === 0) {
    el.innerHTML = `<p style="font-size:12px; color:#888; padding:10px;">Belum ada resep.</p>`;
    return;
  }

  el.innerHTML = myRecipes.map((item, index) => {
    const safeDesc = (item.desc || "").replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '<br>').replace(/\r/g, '');
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
  }).join("");
  
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
  document.getElementById("detail-image").style.backgroundImage = `url('${img}')`;
  
  // Update Nama Penulis
  document.getElementById("detail-author").innerText = author;

  let contentHTML = desc ? `<p>${desc.replace(/\n/g, "<br>")}</p>` : `<p>Tidak ada deskripsi.</p>`;
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
    if (!docId || docId === 'undefined') return alert("Data error!");
    
    const confirmDelete = confirm("Yakin ingin menghapus resep ini secara permanen?");
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

    cards.forEach(card => {
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
        navigator.share({
            title: title,
            text: shareText,
            url: url
        }).then(() => {
            console.log('Berhasil membagikan resep!');
        }).catch((error) => {
            console.log('Batal membagikan:', error);
        });
    } else {
        // Fallback untuk browser laptop/jadul yang gak support
        alert(`Bagikan resep ini ke temanmu!\n\n${shareText}\n${url}`);
    }
};







