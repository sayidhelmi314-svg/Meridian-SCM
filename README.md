# Meridian SCM Dashboard

## Menjalankan di lokal
1. Install Node.js (versi 18 ke atas) dari https://nodejs.org
2. Buka terminal di folder ini, lalu jalankan:
   npm install
3. Jalankan mode development:
   npm run dev
4. Buka alamat yang muncul di terminal (biasanya http://localhost:5173)

## Build untuk publish
1. Jalankan:
   npm run build
2. Hasil build ada di folder `dist/` — folder inilah yang di-upload/deploy.

## Deploy tercepat (gratis)
- **Vercel**: buat akun di vercel.com, hubungkan ke repo GitHub project ini, Vercel otomatis deteksi Vite dan deploy.
- **Netlify**: sama seperti Vercel — drag & drop folder `dist/` ke netlify.com/drop untuk cara tercepat tanpa GitHub.

## Catatan penting
- Semua data pengguna tersimpan di localStorage browser masing-masing (bukan server/database). Setiap orang yang membuka website akan punya data terpisah, sesuai maksud aplikasi ini.
- Gunakan tombol "Ekspor Data" secara berkala untuk backup, karena data bisa hilang jika cache browser dibersihkan.
