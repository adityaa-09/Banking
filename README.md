# LoanDesk BMS — Banking Business Management System

A complete, production-ready React application to manage your banking division's operations — projects, bank agreements, APF numbers, loan cases, and revenue tracking.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher) → https://nodejs.org
- npm (comes with Node.js)

### Install & Run

```bash
# 1. Open this folder in terminal
cd loandesk-bms

# 2. Install dependencies
npm install

# 3. Start the development server
npm start
```

The app will open at **http://localhost:3000**

---

## 📁 Folder Structure

```
loandesk-bms/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Layout.jsx       # Sidebar + top bar
│   │   └── UI.jsx           # Shared components (Button, Modal, Table, etc.)
│   ├── data/
│   │   └── mockData.js      # Sample data (replace with API calls)
│   ├── hooks/
│   │   └── useAppContext.js  # Global state (React Context)
│   ├── pages/
│   │   ├── Dashboard.jsx    # KPIs and overview
│   │   ├── Projects.jsx     # Mandate / project list
│   │   ├── Banks.jsx        # Bank agreements & POCs
│   │   ├── APFNumbers.jsx   # APF tracking
│   │   ├── Cases.jsx        # Loan case management
│   │   └── Revenue.jsx      # Revenue tracker & charts
│   ├── utils/
│   │   └── helpers.js       # Formatters, calculators
│   ├── App.js
│   ├── index.js
│   └── index.css
└── package.json
```

---

## 📋 Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | Live KPIs: active projects, cases, revenue, monthly summary |
| **Projects / Mandates** | Add/view all client projects with developer, location, type |
| **Banks & Agreements** | Bank details, agreement type (Gross/Net), commission %, multiple POCs per bank, agreement file reference |
| **APF Numbers** | Project × Bank matrix for APF numbers, approved amounts, validity |
| **Case Management** | Full loan case lifecycle: In Process → Sanctioned → Disbursed, with sanction doc tracking |
| **Revenue Tracker** | Charts, monthly breakdown, bank-wise leaderboard, total commission calculation |

---

## 💡 Key Features

- ✅ **Gross vs Net agreement types** — stored per bank, factored into revenue calculations
- ✅ **Multiple POCs per bank** — add unlimited contacts per bank partner
- ✅ **APF scoped to Project + Bank** — unique per combination
- ✅ **Commission auto-calculated** — based on disbursed amount × bank's agreement %
- ✅ **Sanction doc tracking** — filename stored per case
- ✅ **Monthly revenue + loan volume charts** (Recharts)
- ✅ **Collapsible sidebar**
- ✅ **Filter + search** on every listing page

---

## 🔧 Connecting to a Real Backend

Currently all data lives in `src/data/mockData.js` and React state.

To connect to a real database:
1. Replace initial data in `src/hooks/useAppContext.js` with `useEffect` + `fetch`/`axios` calls
2. Wire save handlers in each page to `POST`/`PUT` API endpoints
3. Add file upload for agreement docs and sanction docs (use FormData + multipart)

---

## 🏗️ Build for Production

```bash
npm run build
```

Output goes to `/build` folder — ready to deploy on any static host or Node server.
