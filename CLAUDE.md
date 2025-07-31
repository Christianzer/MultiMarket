# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 + TypeScript admin dashboard application built with:
- **Vue 3** with Composition API and `<script setup>` syntax
- **Vite** as the build tool and dev server
- **shadcn-vue** component library (Vue port of shadcn/ui)
- **Tailwind CSS** for styling with custom design tokens
- **Pinia** for state management
- **Vue Router** for client-side routing
- **Radix Vue** for accessible UI primitives

## Development Commands

### Core Development
- `npm run dev` - Start development server
- `npm run build` - Build for production (runs type checking + build)
- `npm run preview` - Preview production build
- `npm run build-only` - Build without type checking

### Code Quality
- `npm run type-check` - Run TypeScript type checking with vue-tsc
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier

## Architecture

### Project Structure
- **`src/main.ts`** - Application entry point with global component registration
- **`src/App.vue`** - Root component with router view and theme initialization
- **`src/router/index.ts`** - Vue Router configuration with nested dashboard routes
- **`src/stores/`** - Pinia stores for state management
- **`src/layouts/`** - Page layout components (dashboard, default)
- **`src/views/`** - Page components organized by route structure
- **`src/components/`** - Reusable components organized by type:
  - `ui/` - shadcn-vue components with consistent index.ts exports
  - `core/` - Application-specific components (navbar, sidebar)
  - `examples/` - Demo/example components

### Component System
The project uses shadcn-vue components with:
- **Consistent exports**: Each component folder has an `index.ts` that exports all related components
- **Composition API**: All components use `<script setup lang="ts">` syntax
- **TypeScript**: Strict typing throughout with proper interfaces
- **Tailwind + CSS Variables**: Design system using HSL color variables defined in CSS

### State Management
- **App Store** (`src/stores/app.ts`): Theme management, sidebar state, responsive layout
- **Pinia**: Used for all global state with TypeScript interfaces

### Routing
- **Nested routes**: Dashboard routes are children of `/dashboard` with shared layout
- **Route meta**: Each route has a `title` property for document titles
- **Lazy loading**: All page components are dynamically imported

### Styling System
- **Tailwind Config**: Custom breakpoints (md: 1024px, lg: 1025px)
- **CSS Variables**: Theme colors defined as HSL variables
- **Dark Mode**: Class-based dark mode with theme switching
- **Components**: Uses `cn()` utility (clsx + tailwind-merge) for conditional classes

## Authentication System

### JWT Authentication
- **Login endpoint**: POST `/api/login` with `username`/`password`
- **JWT token** stored in localStorage with user data
- **Route guards** protect dashboard routes (`requiresAuth: true`)
- **Auto-redirect** to login if not authenticated

### Dynamic Branding
- **Supermarket theming**: Logo, primaryColor (#228B22), secondaryColor (#FFD700)
- **Default fallback** when `supermarket` is null
- **Colors applied** to CSS variables for consistent theming
- **Logo displayed** in sidebar and login page

### Stores
- **AuthStore**: Login/logout, user state, token management
- **AppStore**: Theme, sidebar, branding configuration

## Configuration API

### Variables d'environnement
- **VITE_API_BASE_URL**: URL de base de l'API (ex: http://localhost:8000/api)
- **VITE_APP_ENV**: Environnement de l'application (development/production)
- **VITE_APP_NAME**: Nom de l'application
- **VITE_APP_VERSION**: Version de l'application

### Services API
- **authService**: Service d'authentification avec méthodes mock et vraie API
- **apiService**: Service générique pour appels API avec gestion des tokens
- **api**: Fonctions utilitaires pour endpoints courants (users, products, sales, etc.)

### Configuration
- Fichier `.env` pour les variables d'environnement
- Configuration centralisée dans `src/config/api.ts`
- Gestion automatique des headers d'authentification
- Gestion d'erreurs API avec types TypeScript

## Key Conventions

### File Organization
- Components use PascalCase filenames
- Each UI component folder contains the component + index.ts export
- Views are organized by route hierarchy in `src/views/`
- Stores use descriptive names (app.ts, auth.ts, counter.ts)

### Import Patterns
- Use `@/` alias for src directory imports
- Import UI components from index files: `import { Button } from '@/components/ui/button'`
- Global components (PageHeader, Icon, VueFeather) are registered in main.ts

### Component Development
- Use Composition API with `<script setup lang="ts">`
- Define proper TypeScript interfaces for props and state
- Follow shadcn-vue component patterns for consistency
- Use the `cn()` utility for conditional class names

### Responsive Design
- Desktop-first approach with custom breakpoints
- Sidebar collapses on mobile (< 1024px)
- Layout adjustments handled in app store

## Build Configuration

### Vite Setup
- Root directory set to `src/`
- TypeScript with strict checking
- Tailwind CSS with PostCSS
- Path alias `@/` points to `src/`
- Production builds include sourcemaps

### Dependencies
- **UI**: radix-vue, lucide-vue-next, @radix-icons/vue
- **Forms**: vee-validate with Zod validation
- **Tables**: @tanstack/vue-table
- **Charts**: @unovis/vue
- **Utilities**: @vueuse/core, class-variance-authority