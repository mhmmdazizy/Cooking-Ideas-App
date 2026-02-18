// Data Bahan-bahan
const ingredients = [
  { id: "telur", name: "Telur", icon: "disc" },
  { id: "tempe", name: "Tempe", icon: "square" },
  { id: "tahu", name: "Tahu", icon: "box" },
  { id: "ayam", name: "Ayam", icon: "gitlab" }, // icon placeholder
  { id: "bawang", name: "Bawang", icon: "smile" }, // icon placeholder
  { id: "cabe", name: "Cabai", icon: "zap" },
  { id: "kecap", name: "Kecap", icon: "droplet" },
  { id: "nasi", name: "Nasi", icon: "loader" },
];

// Data Resep Sederhana
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
let user = JSON.parse(localStorage.getItem("user")) || null;

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  renderIngredients();
  updateProfileUI();
  feather.replace();
});

// 1. Render Bahan
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

// 2. Toggle Pilihan Bahan
window.toggleIngredient = (id, el) => {
  if (selectedIngredients.has(id)) {
    selectedIngredients.delete(id);
    el.classList.remove("selected");
  } else {
    selectedIngredients.add(id);
    el.classList.add("selected");
  }
};

// 3. Cari Resep (Inti Aplikasi)
window.findRecipes = () => {
  const resultsContainer = document.getElementById("results-container");
  const resultsSection = document.getElementById("recipe-results");

  // Filter Resep: Tampilkan jika semua bahan yang dibutuhkan tersedia
  // Atau logika "Bisa dimasak": Bahan resep adalah SUBSET dari Selected
  const matched = recipes.filter((recipe) => {
    return recipe.req.every((r) => selectedIngredients.has(r));
  });

  if (matched.length === 0) {
    resultsContainer.innerHTML =
      '<p style="text-align:center; color:var(--text-muted)">Belum ada resep yang pas nih. Coba tambah bahan lain (misal: Bawang, Kecap).</p>';
  } else {
    resultsContainer.innerHTML = matched
      .map(
        (r) => `
            <div class="recipe-card">
                <img src="${r.img}" class="recipe-img" alt="${r.name}">
                <div class="recipe-info">
                    <h3>${r.name}</h3>
                    <p>Bahan: ${r.req.join(", ")}</p>
                    <span class="match-badge">Bisa dimasak sekarang!</span>
                </div>
            </div>
        `,
      )
      .join("");
  }

  resultsSection.style.display = "block";
  resultsSection.scrollIntoView({ behavior: "smooth" });
};

// 4. Navigasi Halaman
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

// 5. Account Menu Logic
window.toggleAccountMenu = () => {
  const overlay = document.getElementById("account-overlay");
  if (overlay.classList.contains("visible")) {
    overlay.classList.remove("visible");
    setTimeout(() => (overlay.style.display = "none"), 300);
  } else {
    overlay.style.display = "flex";
    // Force reflow
    overlay.offsetHeight;
    overlay.classList.add("visible");
  }
};

// 6. Mock Login Google
window.mockGoogleLogin = () => {
  // Simulasi login sukses
  const mockUser = {
    name: "Desainer Senior",
    initial: "D",
    email: "desainer@contoh.com",
  };
  localStorage.setItem("user", JSON.stringify(mockUser));
  user = mockUser;
  updateProfileUI();
  alert("Login Berhasil! (Simulasi)");
  toggleAccountMenu();
};

function updateProfileUI() {
  if (user) {
    document.getElementById("header-username").innerText = user.name;
    document.getElementById("header-avatar").innerText = user.initial;
    document.getElementById("login-section").innerHTML =
      `<p>Hai, <b>${user.name}</b>!<br><small>${user.email}</small></p>`;
  } else {
    document.getElementById("header-username").innerText = "Guest User";
    document.getElementById("header-avatar").innerText = "G";
  }
}

// 7. Dark Mode
window.toggleTheme = () => {
  if (document.body.getAttribute("data-theme") === "dark") {
    document.body.removeAttribute("data-theme");
  } else {
    document.body.setAttribute("data-theme", "dark");
  }
};

// 8. Reset Data
window.resetData = () => {
  if (confirm("Hapus semua data preferensi dan login?")) {
    localStorage.clear();
    location.reload();
  }
};
