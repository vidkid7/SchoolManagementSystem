# Language Switcher Component

## Overview

The Language Switcher component allows users to toggle between Nepali (नेपाली) and English languages throughout the application. It persists the user's language preference in localStorage and updates all interface text immediately upon change.

## Features

- **Bilingual Support**: Nepali and English
- **Default Language**: Nepali (as per Nepal deployment requirements)
- **Persistent Preference**: Stores language choice in localStorage
- **Immediate Updates**: All interface text updates instantly on language change
- **Flag Icons**: Visual representation with country flags (🇳🇵 for Nepali, 🇬🇧 for English)
- **Dropdown Menu**: Clean dropdown interface with current language indicator

## Installation

The component is already integrated into the DashboardLayout. No additional installation is required.

## Usage

### In Components

To use translations in your components, import the `useTranslation` hook:

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.welcome')}</h1>
      <p>{t('dashboard.totalStudents')}</p>
    </div>
  );
}
```

### Adding New Translations

1. Add English translations to `frontend/src/i18n/locales/en/translation.json`:

```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my feature"
  }
}
```

2. Add Nepali translations to `frontend/src/i18n/locales/ne/translation.json`:

```json
{
  "myFeature": {
    "title": "मेरो सुविधा",
    "description": "यो मेरो सुविधा हो"
  }
}
```

3. Use in your component:

```tsx
const { t } = useTranslation();
<h1>{t('myFeature.title')}</h1>
```

### Translation with Variables

```tsx
// In translation file:
{
  "greeting": "Hello, {{name}}!"
}

// In component:
{t('greeting', { name: 'John' })}
```

### Pluralization

```tsx
// In translation file:
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}

// In component:
{t('items', { count: 5 })}
```

## API

### LanguageSwitcher Component

No props required. The component manages its own state.

```tsx
import { LanguageSwitcher } from './components/LanguageSwitcher';

<LanguageSwitcher />
```

### useTranslation Hook

```tsx
const { t, i18n } = useTranslation();

// Translate text
const text = t('key');

// Get current language
const currentLang = i18n.language; // 'ne' or 'en'

// Change language programmatically
i18n.changeLanguage('en');
```

## Translation File Structure

```
frontend/src/i18n/
├── config.ts                    # i18n configuration
└── locales/
    ├── en/
    │   └── translation.json     # English translations
    └── ne/
        └── translation.json     # Nepali translations
```

## Available Translation Keys

### Common
- `common.welcome`, `common.loading`, `common.save`, `common.cancel`, etc.

### Authentication
- `auth.login`, `auth.logout`, `auth.username`, `auth.password`, etc.

### Menu
- `menu.dashboard`, `menu.students`, `menu.staff`, `menu.academic`, etc.

### Dashboard
- `dashboard.welcome`, `dashboard.totalStudents`, `dashboard.attendanceTrend`, etc.

### Students
- `students.title`, `students.addStudent`, `students.studentList`, etc.

### Attendance
- `attendance.title`, `attendance.markAttendance`, `attendance.present`, etc.

### Examinations
- `examinations.title`, `examinations.createExam`, `examinations.grade`, etc.

### Finance
- `finance.title`, `finance.feeStructure`, `finance.invoices`, etc.

### Library
- `library.title`, `library.books`, `library.issueBook`, etc.

### Reports
- `reports.title`, `reports.generateReport`, `reports.exportPdf`, etc.

### Settings
- `settings.title`, `settings.profile`, `settings.language`, etc.

### Validation
- `validation.required`, `validation.invalidEmail`, etc.

### Messages
- `messages.success`, `messages.error`, `messages.confirmDelete`, etc.

## Requirements Satisfied

- ✅ **Requirement 30.1**: Support Nepali and English languages
- ✅ **Requirement 30.2**: Default to Nepali with easy toggle
- ✅ **Requirement 30.3**: Update all interface text immediately on change

## Testing

Run tests with:

```bash
npm test -- LanguageSwitcher.test.tsx
```

## Notes

- Language preference is stored in localStorage with key `'language'`
- Default language is Nepali (`'ne'`) for Nepal deployment
- The component uses Material-UI for consistent styling
- Flag emojis are used for visual representation (🇳🇵 🇬🇧)
