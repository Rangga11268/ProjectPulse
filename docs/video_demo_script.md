# Skrip Video Demo - Bilcode Technology Technical Test (ProjectPulse)

**Durasi Estimasi:** 3 - 5 Menit
**Persiapan Sebelum Merekam:**
1. Buka halaman Web Dashboard (Admin) di browser (Next.js).
2. Buka aplikasi Mobile (Member) di emulator/browser mobile view (Ionic).
3. Siapkan API Client (Postman/Insomnia) atau Swagger jika ingin memperlihatkan sekilas.
4. Pastikan *Docker* berjalan di latar belakang.

---

### [0:00 - 0:30] Pembukaan & Konteks
**Tampilan Layar:** Tampilkan halaman utama/README GitHub.
**Skrip:**
"Halo tim Bilcode Technology. Nama saya [Nama Kamu]. Pada video ini, saya akan mendemonstrasikan hasil pengerjaan *take-home test* untuk posisi Full Stack Developer, yaitu studi kasus **ProjectPulse**. 
Sesuai *requirement*, sistem ini terdiri dari **Web (Admin/PM)** untuk mengelola klien dan proyek, serta aplikasi **Mobile (Member)** untuk developer dan desainer melihat dan melaporkan task mereka. Keduanya saling berbagi satu **Backend API** (Laravel) dan di-_deploy_ secara containerized dengan **Docker & Kubernetes**."

---

### [0:30 - 1:30] Requirement: Web Dashboard (Admin) & AI Task Breakdown
**Tampilan Layar:** Buka Dashboard Web -> Manajemen Proyek -> Buat Proyek Baru / Generate AI Task.
**Skrip:**
"Saya akan mulai dari bagian **Tahap Inti Web Admin**. Di sini, Admin bisa melakukan CRUD untuk Klien, Proyek, dan Task.
Sesuai permintaan *technical test*, saya telah mengintegrasikan fitur **AI-assisted task breakdown**. Saat PM membuat proyek baru, mereka cukup menempelkan *brief* dari klien.
*(Klik 'Generate' di UI)*
Sistem kemudian memanggil API LLM (saya menggunakan Gemini/OpenAI) untuk menyarankan *breakdown task*, lengkap dengan estimasinya.
Sesuai *requirement*, fitur AI ini tidak langsung menyimpan data; Admin bisa menerima, mengedit, atau menghapus saran task ini sebelum disimpan secara final menjadi *task sungguhan*."

---

### [1:30 - 2:00] Requirement Nilai Tambah: Papan Kanban
**Tampilan Layar:** Buka Tab Task di Proyek, ubah mode tampilan ke Kanban.
**Skrip:**
"Sebagai pemenuhan fitur **Nilai Tambah (Lanjutan)**, saya juga telah membuat tampilan **Papan Kanban** dengan fungsionalitas *drag-and-drop*. Admin bisa langsung menggeser task dari *To Do* ke *In Progress*, *Review*, atau *Done*, dan statusnya akan ter-update otomatis secara real-time via API."

---

### [2:00 - 2:45] Requirement: Aplikasi Mobile (Member) & Fitur Kolaborasi
**Tampilan Layar:** Pindah ke Emulator Mobile (Aplikasi Ionic).
**Skrip:**
"Beralih ke aplikasi **Mobile** untuk Member. Saya membangun aplikasi ini menggunakan **Ionic React**, sesuai poin prioritas teknologi dari Bilcode.
Di sini, Member bisa melihat task yang di-assign ke dirinya, memfilternya berdasarkan status, dan melihat notifikasi (in-app).
Member juga dapat menambahkan **Log Waktu / Catatan Progres** kerja langsung dari aplikasi.
Sebagai pelengkap fitur **Nilai Tambah (Lanjutan)**, baik di Web maupun di Mobile, terdapat fitur **Diskusi & Komentar Kolaboratif**. Kita bisa saling mengomentari task secara real-time, meng-edit, menghapus, hingga meng-quote balasan."

---

### [2:45 - 3:30] Requirement: Laporan Ekspor CSV & Arsitektur
**Tampilan Layar:** Pindah kembali ke Web Admin -> Klik Export CSV, lalu tunjukkan sekilas source code Docker/K8s atau file architecture.md.
**Skrip:**
"Untuk fitur pelaporan, saya menambahkan ekspor **Laporan Jam Kerja per Proyek (CSV)**. Format CSV ini sudah saya optimasi (BOM UTF-8 dan pemisah titik koma) agar langsung rapi terbaca di Microsoft Excel untuk region Indonesia.
Secara **Non-Functional**, autentikasi telah diamankan dengan token menggunakan Laravel Sanctum.
Untuk Deployment, *repository* sudah dilengkapi dengan **Dockerfile** terpisah untuk backend & web, docker-compose untuk _dev lokal_, serta **manifest Kubernetes (Deployment, Service, Ingress, Secret/ConfigMap)** yang tersimpan di dalam folder `k8s/`."

---

### [3:30 - Akhir] Penutup
**Tampilan Layar:** Tampilkan Postman/Dokumentasi API, lalu tutup.
**Skrip:**
"Dokumentasi API sudah tersedia di repository. Seluruh fitur utama maupun bonus _challenge_ sudah saya usahakan ter-cover 100%. Detail lengkap mengenai alasan pemilihan teknologi (seperti kenapa saya memilih Laravel + Next.js + Ionic) dan langkah-langkah *setup docker* bisa dilihat di `README.md` dan `docs/architecture.md`.
Terima kasih atas waktunya, saya sangat antusias menunggu tanggapan tim."
