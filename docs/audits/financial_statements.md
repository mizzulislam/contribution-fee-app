# Instruksi Pengoptimalan Library Siklus Akuntansi Soematra Kost

## 1. Konteks Proyek
* **Nama Proyek:** Soematra Kost (Aplikasi manajemen kos)
* **Tech Stack:** React, Vite, TypeScript, Tailwind CSS, Google Sheets API (melalui Google Apps Script Web App) [1].
* **Skema Database Relevan:** 
  * `MasterData` (Bagan Akun: `id`, `account_number`, `account_name`, `account_type`, `status`) [2].
  * `JournalEntries` (Jurnal Umum: `id`, `date`, `description`, `debits`, `credits`, `source`, `source_id`) [2].
  * `Payments`, `Expenses`, `Bills` (Dokumen Sumber) [2].

## 2. Tujuan Pengoptimalan
Sistem saat ini sudah memiliki pencatatan dasar, namun belum memiliki fungsi agregasi dan siklus akhir bulan/tahun yang lengkap. Library di `src/lib` perlu diperluas secara modular untuk mendukung:
1. **Adjusting Entries (Jurnal Penyesuaian):** Khususnya untuk *Unearned Rent Revenue* (Pendapatan Sewa Diterima Dimuka) [3] dan *Depreciation* (Penyusutan Aset) [4].
2. **General Ledger & Trial Balance:** Fungsi agregator saldo berjalan.
3. **Financial Statements:** Generator *Classified Balance Sheet*, *Income Statement*, *Retained Earnings Statement*, dan *Statement of Cash Flows* [5, 6].
4. **Closing Entries (Tutup Buku):** Memindahkan saldo akun nominal (sementara) ke *Retained Earnings* di akhir tahun [7, 8].

---

## SUPER PROMPT UNTUK AGENT AI DI ANTIGRAVITY IDE
*(Salin teks di bawah ini dan tempelkan ke prompt AI Agent di IDE Anda)*

**Role & Context:**
Act as a Senior TypeScript Developer and Financial Accounting Expert. I am building "Soematra Kost", a boarding house management web app using React, Vite, TypeScript, and Google Sheets as the database backend [1]. 

**Strict Rule:** 
DO NOT overhaul, delete, or rewrite the existing architecture or global state management unless absolutely necessary. Your task is to EXTEND the current accounting library inside the `src/lib` folder using pure TypeScript functions (and necessary interfaces) by adding 4 new modular features. All new functions must process array of objects derived from my Google Sheets tabs (`MasterData`, `JournalEntries`, `Payments`, `Expenses`) [2].

**Task 1: Adjusting Entries Module (Jurnal Penyesuaian)**
Create a pure function `generateAdjustingEntries(payments, assets, date)` that returns an array of objects matching the `JournalEntries` schema (`id`, `date`, `description`, `debits`, `credits`, `source`, `source_id`) [2].
*   **Unearned Rent Logic:** Scan the `Payments` array. If a payment covers a future period beyond the current month, calculate the earned portion. Generate a journal entry to Debit "Unearned Rent Revenue" (Liability) and Credit "Rent Revenue" (Revenue) for the earned amount [3, 9].
*   **Depreciation Logic:** Using the straight-line method, calculate monthly depreciation for items in the assets array. Generate an entry to Debit "Depreciation Expense" and Credit "Accumulated Depreciation" [4, 10].

**Task 2: Ledger & Trial Balance Aggregator (Buku Besar & Neraca Saldo)**
Create a function `buildTrialBalance(masterData, journalEntries)` that calculates the running and ending balance of every account.
*   **Logic:** Iterate through `JournalEntries`. Match `debits` and `credits` (which should be stored as JSON string/arrays in the DB) to the `MasterData` [2].
*   **Normal Balance Rules:** 
    *   Assets & Expenses = Total Debits - Total Credits.
    *   Liabilities, Equity & Revenues = Total Credits - Total Debits.
*   **Output:** Return an `AdjustedTrialBalance` array containing account objects with their final balanced amounts, ensuring Total Debits strictly equals Total Credits [11, 12].

**Task 3: Financial Statements Generator (Laporan Keuangan)**
Create a function `generateFinancialStatements(trialBalance)` that takes the output from Task 2 and maps it into 3 specific interfaces:
1.  **Multiple-Step Income Statement:** Group Revenues, subtract Cost/Expenses to get Net Income [13, 14].
2.  **Retained Earnings Statement:** Beginning Retained Earnings + Net Income - Dividends [15, 16].
3.  **Classified Balance Sheet:** Group accounts strictly into: Current Assets, Property Plant & Equipment, Current Liabilities, Long-term Liabilities, and Stockholders' Equity [6]. Ensure Total Assets = Total Liabilities + Stockholders' Equity [5, 17].

**Task 4: Closing the Books Module (Jurnal Penutup)**
Create a function `generateClosingEntries(trialBalance, date)` to be executed at the end of the fiscal year.
*   **Logic:** Generate `JournalEntries` objects to close all temporary accounts (Revenues, Expenses, Dividends) [7, 18].
*   **Steps:** 
    1. Debit Revenue accounts, Credit Income Summary.
    2. Debit Income Summary, Credit Expense accounts.
    3. Debit/Credit Income Summary to zero it out, and transfer Net Income/Loss to Retained Earnings (Equity).
    4. Debit Retained Earnings, Credit Dividends [19, 20].

**Output Requirement:**
Provide the TypeScript code containing the required Interfaces, the 4 modular functions described above, and brief inline comments explaining the accounting logic used. Follow Clean Code principles and ensure strict typings.
