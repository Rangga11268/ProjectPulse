# ProjectPulse — Client & Internal Project Management Platform

> **Bilcode Technology** · Full Stack Developer Take-Home Technical Test  
> Project Management Platform (Web Admin, Mobile Member App, Backend API, ML Task Breakdown & Kubernetes Deployment).

---

## 📂 Project Folder Structure & Explanation

Berikut adalah penjelasan fungsi dan isi dari setiap folder utama pada repositori proyek **ProjectPulse**:

```
ProjectPulse/
├── 📁 backend/              # Core RESTful API Server (Laravel 12 / PHP 8.3)
├── 📁 web/                  # Web Admin & Project Manager Portal (Next.js 15 / React 19)
├── 📁 mobile/               # Team Member App (Ionic 8 / React / Capacitor)
├── 📁 docs/                 # Arsitektur Sistem, Schema Database, & Postman Collection
├── 📁 k8s/                  # Kubernetes Manifest (Deployments, Services, Ingress, HPA)
├── 📄 docker-compose.yml    # Orchestration lokal untuk Backend, Web, Database & Redis
└── 📄 README.md             # Dokumentasi utama dan instruksi setup
```

### 1. 📁 `backend/` (Core RESTful API Server)
Folder ini berisi source code server backend yang dibangun menggunakan **Laravel 12 (PHP 8.3)**.
- **Fungsi Utama:** Mengelola logika bisnis, autentikasi user (Sanctum), manajemen Klien, Proyek, Task, dan Worklog.
- **Sub-folder Penting:**
  - `app/Http/Controllers/Api/`: Menyediakan RESTful API endpoints (`ClientController`, `ProjectController`, `TaskController`, `DashboardController`, `AiTaskBreakdownController`).
  - `app/Models/`: Model Eloquent relasional (`User`, `Client`, `Project`, `Task`, `TaskTimeLog`).
  - `routes/api.php`: Deklarasi seluruh routing API endpoints.
  - `tests/Feature/`: Automated Feature & Unit Testing menggunakan **PHPUnit**.

### 2. 📁 `web/` (Web Admin Panel & PM Portal)
Folder ini berisi aplikasi antarmuka Web khusus Admin & Project Manager yang dibangun menggunakan **Next.js 15 (App Router)** dan **Tailwind CSS**.
- **Fungsi Utama:** Portal visual untuk pemantauan KPI proyek, manajemen CRUD data, alokasi task, fitur **AI Task Breakdown**, dan ekspor laporan CSV.
- **Sub-folder Penting:**
  - `src/app/dashboard/`: Halaman utama Dashboard Admin, Master-Detail split view, sub-toolbar multi-filter, dan modal dialog.
  - `src/app/login/`: Halaman login otentikasi admin & member.
  - `src/lib/api.ts`: Helper untuk komunikasi API request ke backend Laravel.

### 3. 📁 `mobile/` (Team Member Mobile App)
Folder ini berisi aplikasi mobile cross-platform untuk tim developer/designer yang dibangun menggunakan **Ionic 8 + React (TypeScript)**.
- **Fungsi Utama:** Digunakan oleh tim lapangan/member untuk melihat daftar tugas yang di-assign, memperbarui status task, dan memasukkan log jam kerja secara real-time.
- **Sub-folder Penting:**
  - `src/MemberApp.tsx`: Komponen utama Member Workspace, filter status/kategori, dan instant worklog modal.
  - `src/services/api.ts`: Service API handler untuk lingkungan mobile.

### 4. 📁 `docs/` (Dokumentasi & API Collection)
Folder ini berisi dokumen teknis pendukung untuk kebutuhan testing dan arsitektur sistem.
- **Isi Berkas:**
  - `architecture.md`: Penjelasan detail diagram arsitektur sistem, skema basis data relasional, dan alur data.
  - `postman_collection.json`: File koleksi API Postman lengkap dengan variabel `baseUrl` untuk pengujian seluruh API endpoint.

### 5. 📁 `k8s/` (Kubernetes Manifests & Production Deployment)
Folder ini berisi berkas konfigurasi manifes **Kubernetes** untuk kebutuhan deployment skala produksi dan autoscale.
- **Isi Berkas:**
  - `backend-deployment.yaml` & `backend-service.yaml`: Pod & Service backend Laravel.
  - `web-deployment.yaml` & `web-service.yaml`: Pod & Service Web Next.js.
  - `mysql-deployment.yaml`: Deployment database MySQL.
  - `configmap.yaml` & `secret.example.yaml`: Environment variable dan kredensial rahasia cluster.
  - `ingress.yaml`: Routing lalu lintas HTTP/HTTPS Ingress controller.
  - `hpa.yaml`: **Horizontal Pod Autoscaler** untuk autoscale jumlah instance pod berdasarkan penggunaan CPU/Memory.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Backend API** | **Laravel 12 (PHP 8.3)** | RESTful API, Token-based Auth (Sanctum), Eloquent ORM, PHPUnit |
| **Web Dashboard** | **Next.js 15 (React 19)** | Admin/PM Portal, Tailwind CSS, Responsive Sub-Toolbar Filter |
| **Mobile App** | **Ionic 8 + React (Capacitor)** | Developer/Designer App, Geist Typography, Realtime Worklog |
| **ML Service** | **Google Gemini / OpenAI API** | AI-assisted Client Brief Task Breakdown & Effort Estimation |
| **DevOps** | **Docker & Kubernetes (K8s)** | `docker-compose`, K8s Deployments, Services, Ingress & HPA |

---

## 🚀 Quick Start (Local Development)

### 1. Run Everything via Docker Compose
```bash
# Clone repository
git clone https://github.com/Rangga11268/ProjectPulse.git
cd ProjectPulse

# Start all services (Backend, Database, Web, Redis)
docker-compose up -d --build
```

Access points:
- **Web Dashboard (Admin)**: `http://localhost:3000`
- **Mobile App (Dev/Member)**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000/api`

---

## 🔑 Dummy Credentials (Seeder)

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin (PM)** | `admin@bilcode.com` | `password123` | Web Dashboard |
| **Member (Dev)** | `dev@bilcode.com` | `password123` | Mobile App / Web |
| **Member (Designer)** | `designer@bilcode.com` | `password123` | Mobile App / Web |

---

## 📦 Kubernetes Deployment (Local Cluster)

```bash
# Apply ConfigMap & Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.example.yaml

# Deploy Database, Backend & Web
kubectl apply -f k8s/mysql-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/web-deployment.yaml
kubectl apply -f k8s/web-service.yaml
kubectl apply -f k8s/ingress.yaml

# Optional: Horizontal Pod Autoscaler
kubectl apply -f k8s/hpa.yaml
```

---

## 📄 License & Attribution
Developed for **Bilcode Technology** Full Stack Technical Test by **Darell Rangga** ([darellrangga.me](https://www.darellrangga.me)).
