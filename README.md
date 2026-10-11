# Stretch

A 30-day ₹10,000 personal finance simulator for Gen Z.

## Project Setup

```bash
pnpm install
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run Vitest tests
- `pnpm typecheck` - Run TypeScript type checking

## Quality Gates

Run all checks with:
```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
This command must stay green after every phase.