# 💰 NabungYuk! — Smart Goal-Based Savings & Personal Finance Web App

**NabungYuk!** adalah aplikasi web manajemen tabungan dan perencanaan target keuangan pribadi berbasis *client-side* dengan tampilan modern (Tailwind CSS + Lucide Icons + Chart.js). Dirancang dengan struktur folder modular agar siap digunakan untuk **Final Project**, tugas akhir pemrograman web, maupun portofolio.

---

## 📁 Struktur Folder Proyek

```text
NabungYuk-FinalProject/
├── index.html          # Struktur antarmuka utama (Tailwind CSS, Lucide Icons, Chart.js)
├── README.md           # Dokumentasi lengkap aplikasi & panduan penggunaan
├── assets/
│   └── favicon.svg     # Logo ikon aplikasi NabungYuk!
├── css/
│   └── style.css       # Custom styling, animasi halus, scrollbar, & penyesuaian Dark Mode
└── js/
    ├── storage.js      # Modul penyimpanan LocalStorage, data demo, CRUD, & export CSV
    ├── charts.js       # Modul grafik interaktif Chart.js (Arus Kas & Distribusi Saldo)
    └── app.js          # Controller utama UI, kalkulator simulasi, modal, & konfeti
```

---

## ✨ Fitur Utama

- **Dashboard & KPI Cards Interaktif**: Ringkasan Total Saldo Terkumpul (dengan progress bar keseluruhan), Total Target Impian, Jumlah Target Tercapai, dan Saran Setoran Harian/Bulanan.
- **Visualisasi Grafik Real-Time (Chart.js)**:
  - *Tren Arus Tabungan (Setor vs Tarik Dana)*
  - *Distribusi Saldo per Celengan (Doughnut Chart)*
- **Manajemen Target Celengan (CRUD Lengkap)**: Tambah, edit, hapus, filter (`Semua`, `Berjalan`, `Tercapai 🎉`), urutkan (`Terbaru`, `Progres Tertinggi`, `Deadline Terdekat`), serta fitur **Konfeti & Modal Apresiasi** otomatis saat target mencapai 100%.
- **Transaksi Setor & Tarik Dana + Export CSV**: Validasi otomatis agar penarikan tidak melebihi saldo celengan, chip nominal cepat (`+50rb`, `+100rb`, `+500rb`, `Lunasi Sisa`), dan ekspor laporan ke `.csv`.
- **Kalkulator & Simulasi Nabung**: Dua mode perhitungan (*Hitung Nominal Setoran* dan *Hitung Estimasi Waktu*) lengkap dengan slider interaktif dan tombol **1-Klik Jadikan Target Baru**.
- **Dark Mode & Data Demo Otomatis**: Dukungan tema terang/gelap yang tersimpan otomatis serta tombol **Data Demo** dan **Reset** di navbar.

---

## 🚀 Cara Menjalankan

1. **Ekstrak** file `NabungYuk-FinalProject-v2.zip` menjadi folder biasa (jangan jalankan `index.html` langsung dari dalam file ZIP).
2. Buka folder `NabungYuk-FinalProject` di **Visual Studio Code**.
3. Klik kanan `index.html` lalu pilih **Open with Live Server** (atau klik dua kali `index.html` untuk membukanya langsung di browser).
