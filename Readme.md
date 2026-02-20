# PharmaGuard

**AI-powered pharmacogenomic risk analysis platform** — upload your genetic data (VCF), select your medications, and receive personalized drug-safety assessments aligned with [CPIC](https://cpicpgx.org/) guidelines.

---

## Features

| Feature | Description |
|---------|-------------|
| **Drug Risk Analysis** | Upload a VCF file + select drugs → per-drug risk verdicts (Safe / Adjust Dosage / Toxic / Ineffective) with CPIC-aligned recommendations and AI-generated plain-English explanations |
| **Genetic Character Compatibility** | Upload two parents' VCF files → Punnett-square inheritance analysis predicting a child's medication-response risks across all screened genes |
| **Genome Map** | Interactive chromosome visualization (GRCh38 cytobands) showing pharmacogenomic variant locations, color-coded by functional impact |
| **Pill Scanner** | Camera-based real-time drug checker — captures a frame, runs OCR, and cross-references the detected drug name against your genetic profile |
| **Community** | Social feed for sharing pharmacogenomic experiences; includes a **Twin Finder** that matches you with users who share similar genetic profiles |
| **Report Chatbot** | AI chatbot that answers questions about your results in simple, non-medical language |
| **PDF Export** | Download a full risk report as a styled PDF |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Motion, Radix UI, shadcn/ui |
| Backend | Flask 3, Python 3.10+ |
| Database | MongoDB (via PyMongo) |
| AI / LLM | Groq API — Llama 3.3 70B |
| OCR | Pytesseract (server) / tesseract.js (client fallback) |
| Auth | Algorand Pera Wallet (Testnet) + guest mode |
| PDF | jsPDF + jspdf-autotable |

---

## Project Structure

```
Pharmaguard/
├── client/                 # Next.js frontend
│   ├── public/             # Static assets & sample VCF files
│   └── src/
│       ├── app/            # Pages (Next.js App Router)
│       ├── components/     # React components
│       ├── context/        # AuthContext (wallet + guest auth)
│       ├── lib/            # Utilities, cytoband data, Pera Wallet singleton
│       └── utils/          # OCR handler, VCF validator
│
├── py-backend/             # Flask API server
│   ├── app.py              # Main server — all API routes
│   ├── analyzer.py         # Core pharmacogenomic analysis engine
│   ├── parser.py           # VCF file parser
│   ├── matcher.py          # Variant ↔ star-allele matcher
│   ├── compatibility.py    # IVF / inheritance calculator
│   ├── pgx_knowledgebase.py# Gene & drug reference data
│   ├── cpic_tables.py      # CPIC Excel table loader
│   ├── database.py         # MongoDB connection
│   ├── seed_db.py          # Seed script (mock users, posts)
│   ├── data/               # Sample VCFs, CPIC tables, phenotype refs
│   └── requirements.txt
│
└── Readme.md
```

---

## Prerequisites

- **Python** 3.10+
- **Node.js** 18+ and npm
- **MongoDB** instance (local or [Atlas](https://www.mongodb.com/atlas))
- **Groq API key** — get one free at [console.groq.com](https://console.groq.com)
- **Tesseract OCR** (optional, needed for the Pill Scanner) — [install guide](https://github.com/tesseract-ocr/tesseract)

---

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd Pharmaguard
```

### 2. Backend

```bash
cd py-backend
python -m venv venv

# Activate the virtual environment
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside `py-backend/`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/pharmaguard
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
```

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `MONGO_URI` | Yes | — | MongoDB connection string |
| `GROQ_API_KEY` | Yes | — | Groq API key (powers AI summaries & chatbot) |
| `PORT` | No | `5000` | Flask server port |

Start the server:

```bash
python app.py
```

The API will be available at `http://localhost:5000`.

### 3. Seed the database (optional)

Populate MongoDB with sample users, genetic profiles, and community posts:

```bash
python seed_db.py
```

### 4. Frontend

```bash
cd client
npm install
```

Optionally create a `.env.local` file inside `client/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Service info |
| `GET` | `/health` | Health check (DB status) |
| `GET` | `/drugs` | List supported drugs |
| `GET` | `/genes` | List screened genes |
| `POST` | `/analyze` | Upload VCF + drugs → risk analysis |
| `POST` | `/api/ocr` | Server-side OCR (base64 or multipart) |
| `POST` | `/api/auth/signup` | Register (wallet address + role) |
| `POST` | `/api/auth/login` | Login by wallet address |
| `POST` | `/api/couple-analysis` | IVF compatibility analysis |
| `POST` | `/api/report-chat` | AI chatbot Q&A on report |
| `POST` | `/api/find-twins` | Find genetically similar users |
| `GET` | `/api/community/feed` | Community posts (filter by `?gene=` / `?drug=`) |
| `POST` | `/api/community/post` | Create a community post |
| `POST` | `/api/seed` | Seed DB via API |
| `POST` | `/api/chat/start` | Start a conversation |
| `GET` | `/api/chat` | List conversations (`?user_id=`) |
| `GET` | `/api/chat/<id>/messages` | Get messages |
| `POST` | `/api/chat/<id>/messages` | Send a message |

---

## Supported Genes & Drugs

| Gene | Drugs |
|------|-------|
| CYP2D6 | Codeine, Tramadol, Tamoxifen |
| CYP2C19 | Clopidogrel, Omeprazole, Escitalopram, Voriconazole |
| CYP2C9 | Warfarin, Celecoxib, Phenytoin |
| SLCO1B1 | Simvastatin, Atorvastatin |
| TPMT | Azathioprine, Mercaptopurine |
| DPYD | Fluorouracil, Capecitabine |

Additional genes are automatically loaded if CPIC Excel tables are placed in `py-backend/data/tables/`.

---

## Sample VCF Files

Ready-to-use test files are included:

- `client/public/sample_patient.vcf` — standard patient sample
- `client/public/samples/partner_*.vcf` — partner samples for IVF testing (carrier, high-risk, normal)

---

