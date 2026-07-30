# Panduan Merekam Video Demo (Versi Teleprompter & Manual Run)

File ini didesain khusus agar kamu bisa langsung *copy-paste* teksnya ke aplikasi teleprompter (seperti Clipchamp/Canva).

## 🛠️ PERSIAPAN SEBELUM KLIK RECORD:
Karena kamu tidak memakai Docker untuk demo live, kamu harus menyalakan server secara manual dulu agar aplikasinya jalan saat direkam:
1. Buka Terminal 1 (Backend): masuk ke folder `backend` -> jalankan `php artisan serve`
2. Buka Terminal 2 (Web): masuk ke folder `web` -> jalankan `npm run dev`
3. Buka Terminal 3 (Mobile): masuk ke folder `mobile` -> jalankan `npm run dev`

**Siapkan Tab Browser:**
- **Tab 1:** Halaman Dashboard Web (`http://localhost:3000`)
- **Tab 2:** Halaman Mobile App (`http://localhost:8100` atau port mobile-mu) -> Klik Kanan > Inspect > Pilih tampilan Mobile (iPhone/Pixel).
- **Tab 3:** VS Code (buka file `docker-compose.yml`).

---

## 🎬 TEKS TELEPROMPTER & ARAHAN KLIK (COPY TEKS DI BAWAH INI)

*(Tampilkan halaman Web Dashboard Admin di layar)*

Halo tim Bilcode Technology. Nama saya Darell Rangga. Pada video ini, saya akan mendemonstrasikan hasil pengerjaan *take-home test* untuk posisi Full Stack Developer, yaitu studi kasus ProjectPulse.

Sesuai requirement, sistem ini terdiri dari Web Admin untuk mengelola klien dan proyek, serta aplikasi Mobile untuk member melihat dan melaporkan task mereka. Keduanya saling berbagi satu Backend API berbasis Laravel.

*(Arahkan mouse ke menu Klien dan Proyek di sebelah kiri, klik perlahan)*

Saya mulai dari Web Admin. Di sini, Admin bisa melakukan CRUD standar untuk Klien, Proyek, dan Task.

*(Klik tombol 'Buat Proyek Baru' atau masuk ke menu buat task)*
*(Arahkan kursor ke area input brief klien)*

Sesuai permintaan *technical test*, saya telah mengintegrasikan fitur AI-assisted task breakdown. Saat PM membuat proyek baru, mereka cukup menempelkan *brief* klien ke kolom ini.

*(Klik tombol 'Generate Saran AI')*
*(Tunggu sebentar sampai hasil AI muncul)*

Sistem akan memanggil LLM API untuk menyarankan *breakdown task* lengkap dengan estimasinya. Sesuai *requirement*, fitur AI ini tidak langsung menyimpan data; Admin bisa menerima, mengedit, atau menghapus saran task ini sebelum disimpan secara final menjadi task sungguhan.

*(Klik Tab Task atau Buka halaman Kanban)*

Sebagai pemenuhan fitur "Nilai Tambah" atau fitur lanjutan, saya juga telah membuat tampilan Papan Kanban dengan fungsionalitas drag-and-drop. 

*(Klik dan tahan salah satu task, lalu geser dari To Do ke In Progress)*

Admin bisa langsung menggeser task dari status *To Do* ke *In Progress*, dan statusnya akan ter-update otomatis secara real-time.

*(Pindah ke Tab Browser ke-2 yang menampilkan Emulator Mobile / Inspect Element Mobile)*

Beralih ke aplikasi Mobile untuk Member. Saya membangun aplikasi ini menggunakan Ionic React, sesuai dengan poin prioritas utama teknologi dari Bilcode.

*(Klik menu filter status atau scroll melihat daftar task)*

Di sini, Member bisa melihat task yang di-assign ke dirinya, memfilternya berdasarkan status, dan melihat notifikasi in-app.

*(Klik salah satu Task untuk membuka detailnya)*
*(Scroll ke bagian Log Waktu / Komentar)*

Member juga dapat menambahkan Log Waktu kerja langsung dari aplikasi. Dan sebagai pelengkap fitur Nilai Tambah, baik di Web maupun di Mobile, terdapat fitur Diskusi Kolaboratif. Kita bisa saling mengomentari task secara real-time, meng-edit, dan menghapusnya.

*(Pindah kembali ke Tab 1 Web Admin)*
*(Klik tombol Export CSV)*

Untuk fitur pelaporan, saya menambahkan ekspor Laporan Jam Kerja berformat CSV. Format CSV ini sudah saya optimasi menggunakan UTF-8 BOM dan pemisah titik koma agar langsung rapi terbaca otomatis dalam kolom saat dibuka di Microsoft Excel region Indonesia.

*(Pindah ke Tab 3 VS Code, perlihatkan file docker-compose.yml dan folder k8s)*

Secara Non-Functional, autentikasi telah diamankan dengan token menggunakan Laravel Sanctum. Dan untuk urusan *Deployment* serta infrastruktur, *repository* sudah dilengkapi dengan *Dockerfile* terpisah untuk backend dan web, `docker-compose` untuk lingkungan *dev*, serta manifest *Kubernetes* lengkap yang tersimpan di dalam folder `k8s`, persis seperti yang diminta di soal. Dokumentasi API Postman juga sudah saya sertakan di repository.

Terima kasih atas waktunya, saya sangat antusias menunggu tanggapan tim Bilcode.

*(Selesai - Matikan Recording)*
