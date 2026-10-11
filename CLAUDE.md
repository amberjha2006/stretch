# Stretch Project

## Product Summary
Stretch is a 30-day ₹10,000 personal finance simulator for Gen Z, where users simulate financial decisions before committing and see the effect on balance, daily allowance, savings goals, forecast, risk and financial health.

## Stack
- Vite + React 18 + TypeScript (react-ts template) using pnpm
- Runtime dependencies: react-router-dom, framer-motion, recharts, zustand, lucide-react, clsx, tailwind-merge
- Dev dependencies: tailwindcss@3, postcss, autoprefixer, vitest, jsdom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, eslint (flat config), typescript-eslint, eslint-plugin-react-hooks, prettier, eslint-config-prettier
- Tailwind v3 with tailwind.config.js and postcss.config.js, @tailwind directives in src/index.css. Class-based dark mode.
- TypeScript strict mode. The "@/" alias to src/ must work in tsconfig.app.json AND vite.config.ts (and vitest).
- Vitest configured in vite.config.ts with jsdom, globals, and a setup file src/test/setup.ts importing @testing-library/jest-dom.
- ESLint flat config (eslint.config.js) plus Prettier (single quotes, semicolons, trailing commas es5, printWidth 100).

## Folder Rules
- `src/lib/`: Never imports React
- `src/app`: Application logic and hooks
- `src/pages`: Page components
- `src/components/ui`: Reusable UI components
- `src/components/features`: Feature-specific components
- `src/lib`: Utility functions (format.ts, etc.)
- `src/store`: Zustand stores
- `src/styles`: CSS/Tailwind files
- `src/test`: Test files and setup

## Naming Conventions
- Components: PascalCase (e.g., `Header.tsx`)
- Files: kebab-case (e.g., `user-profile.tsx`)
- Variables: camelCase (e.g., `userName`)
- Functions: camelCase (e.g., `calculateTotal()`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_AMOUNT`)

## Code Requirements
- `formatINR(n)` function in `src/lib/format.ts` using en-IN grouping and the ₹ symbol
- The command `pnpm typecheck && pnpm lint && pnpm test && pnpm build` must stay green after every phase

## Scripts
- `dev`: Start development server
- `build`: Build for production
- `preview`: Preview production build
- `lint`: Run ESLint
- `format`: Format code with Prettier
- `test`: Run Vitest tests
- `typecheck`: Run TypeScript type checking