# SchoolSystem Frontend - i18n Translation Files

## Overview
This directory contains all i18n (internationalization) and translation files from the SchoolSystem frontend application.

**Total Files:** 3  
**Total Size:** 162.25 KB  
**Languages Supported:** English (en), Nepali (ne)  

---

## Files in This Export

### 1. config.ts
**Size:** 1.88 KB  
**Type:** TypeScript Configuration File  
**Purpose:** i18next library initialization and configuration  

**Key Settings:**
- Framework: i18next with React integration
- Languages: English (en), Nepali (ne)
- Fallback Language: Nepali (ne)
- Detection Method: Browser localStorage + navigator language
- Storage Key: 'language'

---

### 2. en.translation.json
**Size:** 58.87 KB  
**Language:** English (en)  
**Type:** JSON Translation Dictionary  

**Contents:**
- 35 top-level categories
- 800+ translation strings
- Complete coverage for all application features

**Categories:**
common, auth, app, menu, dashboard, students, sportsECA, academic, promote, staff, bulkImport, attendance, examinations, finance, admissions, library, reports, settings, roles, systemSettings, backup, archive, theme, accessibility, validation, messages, currency, communication, certificates, documents, calendar, audit, adminSettings, userManagement, notifications

---

### 3. ne.translation.json
**Size:** 101.50 KB  
**Language:** Nepali (ne)  
**Type:** JSON Translation Dictionary  

**Contents:**
- 35 top-level categories (matching English)
- 800+ translation strings in Nepali
- Complete coverage for all application features
- Uses Devanagari script (hence larger file size)

**Categories:** (Same as English)

---

## Usage

### In React Components
\\\	ypescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return <h1>{t('common.welcome')}</h1>;
}
\\\

### Language Switching
The application automatically:
1. Checks localStorage for 'language' key
2. Falls back to browser language preference
3. Defaults to Nepali (ne) if no preference

---

## File Locations (Original)

\\\
frontend/src/i18n/
├── config.ts
└── locales/
    ├── en/
    │   └── translation.json
    └── ne/
        └── translation.json
\\\

---

## Source Repository

**Project:** SchoolSystem  
**Path:** C:\\Users\\A C E R\\Downloads\\SchoolSystem-master\\frontend

---

## Last Updated
2026-03-13 19:43:55
