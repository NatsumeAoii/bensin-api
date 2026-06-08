# Contributing to Bensin-API

Terima kasih atas minat Anda untuk berkontribusi! Panduan ini menjelaskan bagaimana cara berpartisipasi secara efektif.

---

## Prasyarat

- **Node.js** ≥ 20.0.0 + npm
- **Python** 3.12 (versi yang dipakai CI; 3.10+ umumnya berfungsi)
- Git

## Setup Lingkungan Pengembangan

```bash
# Clone repositori
git clone https://github.com/nasgunawann/bensin-api.git
cd bensin-api

# Frontend
npm install

# Backend (opsional, jika menyentuh pipeline)
python -m venv .venv
.venv\Scripts\Activate.ps1    # Windows PowerShell
# source .venv/bin/activate   # Linux/macOS
pip install -r requirements.txt
```

## Workflow Kontribusi

1. **Fork** repositori ini ke akun Anda
2. **Buat branch** dari `main`:
   ```bash
   git checkout -b feat/nama-fitur
   ```
3. **Develop** — lakukan perubahan Anda
4. **Validasi** sebelum commit:

   ```bash
   # Frontend: lint + typecheck + test + build
   npm run ci

   # Pipeline (jika diubah):
   python -m pytest pipeline/tests/
   ```

5. **Commit** dengan pesan yang jelas:
   ```
   feat: tambah filter berdasarkan jenis BBM
   fix: perbaiki parsing harga dengan format koma
   ```
6. **Push** dan buat Pull Request

## Commit Message Convention

Format: `<type>: <description>`

| Type       | Penggunaan                           |
| ---------- | ------------------------------------ |
| `feat`     | Fitur baru                           |
| `fix`      | Perbaikan bug                        |
| `docs`     | Dokumentasi                          |
| `refactor` | Refactoring tanpa perubahan behavior |
| `test`     | Menambah atau memperbaiki test       |
| `chore`    | Build, CI, dependencies              |
| `style`    | Formatting, tanpa perubahan logika   |

## Panduan Kode

### Frontend (TypeScript/React)

- TypeScript strict mode — jangan gunakan `any` tanpa justifikasi
- Path alias `@/` untuk import dari `src/`
- Komponen mengikuti pola yang sudah ada (lihat `src/components/`)
- Semua interactive element harus memiliki `aria-label` dan minimal 44×44px tap target
- Icon menggunakan Lucide React — import individual, bukan full library
- State global via Zustand (lihat `src/stores/`)

### Pipeline (Python)

- Validasi output dengan Pydantic schema (`pipeline/schemas.py`)
- Price parsing harus menangani semua format yang diketahui dari upstream
- Jika menambah product name mapping, update `PRODUCT_CANONICAL_MAP` di `pipeline/config.py`

### Testing

- **Frontend**: Property-based tests (fast-check) didorong untuk logic kritis
- **Pipeline**: Hypothesis-based property tests untuk parser
- Semua tests harus pass sebelum merge

## Apa yang Tidak Perlu Diubah

- File `v1/` — dihasilkan otomatis oleh CI
- File `raw/` — backup upstream, tidak di-commit
- File `price.json` — snapshot lokal, diperbarui oleh CI

## Pelaporan Bug

Buka [Issue](https://github.com/nasgunawann/bensin-api/issues) dengan informasi:

- Langkah reproduksi
- Perilaku yang diharapkan vs aktual
- Browser/OS/versi Node.js (jika relevan)

## Pelaporan Kerentanan Keamanan

Jangan buka issue publik untuk kerentanan keamanan. Lihat [SECURITY.md](./SECURITY.md) untuk proses pelaporan privat.

---

Terima kasih telah berkontribusi! 🙏
