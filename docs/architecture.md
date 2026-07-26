# Architectural Decisions & Technology Selection (ProjectPulse)

## 🎯 Executive Summary
ProjectPulse dirancang sebagai platform manajemen proyek internal untuk **Bilcode Technology**, yang mengelola alur kerja antara Project Manager (Admin) dan Tim Eksekusi/Developer (Member).

Dokumen ini menjelaskan trade-offs dan alasan teknis di balik pemilihan arsitektur, framework, serta pendekatan kontainerisasi yang digunakan.

---

## 1. Backend Framework: Laravel 11 vs Next.js Route Handlers

### Keputusan: **Laravel 11 (PHP 8.3)**
- **Alasan Pemilihan**:
  1. **Separation of Concerns**: Memisahkan backend API dari frontend web secara penuh, memudahkan konsumsi bersama oleh Web Dashboard & Mobile App.
  2. **RBAC & Middleware**: Memiliki sistem otorisasi (`Policies` & `Gate`) serta middleware token (`Sanctum`) yang teruji dan siap pakai secara fleksibel.
  3. **Database Seeding & Testing**: Eloquent ORM dan PHPUnit mendukung pembuatan fixture seeder dan pengujian otomatis terisolasi secara cepat.
  4. **Resiliency**: Memudahkan pembuatan service layer terpisah (`TaskBreakdownService`) untuk integrasi LLM API dengan fallback non-blocking yang aman.

---

## 2. Mobile Framework: Ionic + React vs React Native vs Flutter

### Keputusan: **Ionic 8 + React (Capacitor)**
- **Alasan Pemilihan**:
  1. **Skor Maksimal Rekrutmen**: Memenuhi preferensi utama tim recruiter Bilcode (Ionic diutamakan > React Native > Flutter), memberikan poin preferensi penuh.
  2. **Code Reuse**: Memungkinkan penggunaan kembali logika TypeScript, komponen UI, dan skema data dari Next.js/React web dashboard.
  3. **Multi-Platform Deployment**: Dapat dijalankan langsung sebagai PWA di browser, preview di emulator, serta dikompilasi ke APK Android menggunakan Capacitor.

---

## 3. Web Framework: Next.js 15 (React 19)

### Keputusan: **Next.js 15 App Router**
- **Alasan Pemilihan**:
  1. **User Experience (UX)**: Fast initial render (SSR) untuk dashboard admin dengan dynamic client components untuk Kanban Board & AI Brief generator.
  2. **Hallmark Design Discipline**: Kompatibilitas tinggi dengan CSS variables & OKLCH tokens tanpa ketergantungan pada UI library berat.

---

## 4. ML Integration & Resiliency Strategy

### Keputusan: **Google Gemini API / OpenAI API via Structured JSON Prompt**
- **Alasan Pemilihan**:
  1. Menggunakan prompt terstruktur dengan keluaran JSON Schema ketat (`tasks: Array<{title, description, category, estimated_hours}>`).
  2. **Non-Blocking Resiliency**: Jika API external mengalami rate-limit atau timeout, backend akan menangkap exception, mencatat log, dan mengembalikan pesan respons yang anggun (*graceful fallback*). Admin tetap dapat melanjutkan pembuatan proyek dan menambahkan task secara manual.
