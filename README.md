# Studio Hermes Remotion 🎬⚡

Studio editor video pendek portrait (9:16) berbasis AI agent open source (MIT) yang dioperasikan langsung dari HP (mobile-first). Pengguna memberikan perintah teks, AI agent (Gemini CLI / ACP) mengedit komposisi dan timeline Remotion secara otomatis, dan hasilnya tampil secara realtime di Remotion Player.

## 🚀 Fitur Utama

- **Mobile-First Experience (390px - 480px)**: Desain teroptimasi untuk layar smartphone dengan area sentuh minimal 44x44px (`.tap`), kontrol kapsul, dan palet warna gelap profesional.
- **Remotion Player Realtime**: Pratinjau video portrait 9:16 full-bleed dengan kontrol kustom (play/pause, timecode tabular `0:12 / 0:45`, fullscreen, dan fallback kartu error dengan auto-fix).
- **Synchronized 4-Track Timeline**: Track Video, Teks, Narasi, dan Musik dengan gradien ritmis, playhead 2px sinkron frame-by-frame, scrubbing sentuh, dan tombol `+ Layer`.
- **AI Agent (Gemini ACP)**:
  - Streaming respons via HTTP + Server-Sent Events (SSE).
  - Stop / Cancel interupsi instan.
  - Log aktivitas tool call collapsible (`readFile`, `writeFile`, durasi, status).
  - Persetujuan aksi berisiko (Izinkan / Sesi ini / Tolak).
  - Checkpoint Git otomatis tiap giliran dengan tombol "Kembalikan sebelum perubahan ini".
  - Konteks terstruktur otomatis dari UI (layer aktif, posisi detik/frame, file dibuka).
  - Mention `@` untuk memilih asset atau file proyek.
  - Review Diff kode (Terima / Batalkan).
  - Checklist rencana agent (plan items).
- **Asset Manager**: Meter kapasitas storage, upload multi-file (drag & drop), filter tipe (Video, Audio, Gambar, Font), tombol "Pakai" ke chat, dan manajemen `assets.json`.
- **CodeMirror 6 Editor**: Syntax highlight JSX/TSX, nomor baris, auto-save debounce 500ms, baris simbol cepat `{ } ( ) < > ; = Tab`, dan lock banner saat agent bekerja.
- **Git Versioning**: Checkpoint non-destruktif dengan timeline vertikal, preview diff, dan restore aman.
- **Render Studio**: Pilihan resolusi (720p, 1080p, 4K) dan framerate (24, 30, 60 FPS), progress bar live frame x/y over SSE, kartu hasil render, dan unduhan HTTP Range.
- **Aturan Proyek (GEMINI.md)**: Konfigurasi gaya video, font, dan sinkronisasi timestamp narasi.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, `@remotion/player`, `remotion`, `@uiw/react-codemirror`, `react-markdown`, `lucide-react`, `motion`, `canvas-confetti`.
- **Bridge Server**: Node.js, Express, Multer, SSE, `@google/genai`.
- **Protokol**: HTTP + SSE (Server-Sent Events) & Agent Client Protocol (ACP).

## 📦 Setup & Menjalankan

1. Salin `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   ```
2. Pasang dependensi:
   ```bash
   npm install
   ```
3. Jalankan server pengembang:
   ```bash
   npm run dev
   ```
   Buka browser di `http://localhost:3000` (atau port yang ditentukan).

## 📄 Lisensi

Didistribusikan di bawah lisensi MIT.
