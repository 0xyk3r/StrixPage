# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StrixPage is a Vue 3 admin dashboard template for the ProjectAn Strix business platform. It's a Chinese-language enterprise application with built-in security features, state management, and PWA support.

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (localhost:19889, test mode)
pnpm build            # Full build (type-check + build-only in parallel)
pnpm build-only       # Build without type-checking
pnpm type-check       # TypeScript type checking with vue-tsc
pnpm lint             # ESLint with automatic fixes
pnpm format           # Prettier formatting for src/
pnpm preview          # Preview production build
```

## Technical Stack

- **Framework:** Vue 3.5 with Composition API, TypeScript 5.8, Vite 7.0
- **Node:** 22+ required
- **Package Manager:** pnpm
- **UI Library:** Naive UI with auto-import configured
- **State Management:** Pinia with localStorage persistence
- **HTTP Client:** Axios with custom encryption/decryption interceptors
- **Icons:** Lucide Vue Next
- **Local Storage:** Dexie (IndexedDB wrapper)

## Architecture

### Source Structure

- `src/@types/` - TypeScript type definitions (auto-generated and custom)
- `src/components/` - Reusable components, prefixed with `Strix` for custom components
- `src/directives/` - Custom Vue directives (permission-based access control)
- `src/plugins/` - Vue plugins (axios, event-bus, service worker, resize-detector)
- `src/router/` - Vue Router with dynamic route definitions
- `src/stores/` - Pinia stores for state management
- `src/utils/` - Utility functions prefixed with `strix-` (messages, dialogs, dates, files)
- `src/views/System/` - Page components organized by feature module

### Key Patterns

**Component Auto-Import:** Naive UI components are automatically imported via `unplugin-vue-components`. No manual imports needed for Naive UI components.

**State Management:** Pinia stores in `src/stores/` handle:
- `login-info.ts` - Authentication state
- `strix-settings.ts` - App settings and theme
- `tabs-bar.ts` - Tab navigation
- `dicts.ts` - Dictionary data
- `http-canceler.ts` - Request cancellation

**HTTP Security:** The Axios plugin (`src/plugins/axios.ts`) implements:
- RSA asymmetric encryption for key exchange
- AES encryption for request bodies
- Request signing with MD5 hash
- Token-based authentication in headers

**Utility Functions:** Located in `src/utils/`, these provide standardized:
- Toast/alert messages (`strix-message.ts`)
- Dialog management (`strix-dialog.ts`)
- Loading indicators (`strix-loading-bar.ts`)
- Date formatting (`strix-date-util.ts`)
- File operations (`strix-file-util.ts`)

### Environment Configuration

Environment variables in `.env` include RSA keys and AES IV for encryption. These are accessed via Vite's `import.meta.env`.

## Code Style

- 2-space indentation, single quotes, 100-character line width
- LF line endings, UTF-8 encoding
- VS Code auto-fixes on save (ESLint + Prettier)
- TypeScript strict mode enabled
