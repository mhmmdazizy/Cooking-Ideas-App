// ==========================================
// DATABASE LOKAL: MASAK APA?
// Tambahkan resep atau artikel baru di sini!
// ==========================================

// --- 1. DATA BAHAN (HOME) ---
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

// --- 2. DATA ARTIKEL (EXPLORE) ---
const articles = [
  { 
    title: "Tips Sayur Awet", 
    tag: "TIPS", 
    img: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=300&q=80",
    desc: "Bungkus sayuran dengan tisu dapur sebelum dimasukkan ke kulkas agar tidak cepat busuk."
  },
  { 
    title: "Bumbu Dasar", 
    tag: "HACK", 
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=80",
    desc: "Buat bumbu dasar putih, merah, dan kuning di akhir pekan untuk mempercepat waktu masak harian."
  },
  // ⬇️ TAMBAH ARTIKEL BARU DI BAWAH SINI ⬇️
  
];

// --- 3. DATA RESEP BAWAAN (MENU) ---
const menus = [
  { 
    title: "Nasi Goreng Spesial", 
    tag: "15 MIN", 
    img: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&q=80",
    desc: "Tumis bawang merah putih, masukkan telur, tambahkan nasi dan kecap. Aduk rata."
  },
  { 
    title: "Soto Ayam Kuning", 
    tag: "KUAH", 
    img: "https://images.unsplash.com/photo-1633436375795-12b3b339712f?w=300&q=80",
    desc: "Rebus ayam dengan bumbu halus (kunyit, jahe, bawang). Sajikan dengan soun dan tauge."
  },
  // ⬇️ TAMBAH RESEP BARU DI BAWAH SINI ⬇️
  
];