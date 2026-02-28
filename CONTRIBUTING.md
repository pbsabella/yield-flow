# Contributing to YieldFlow

First off, thank you for considering contributing to YieldFlow. As a prototype in active development, community feedback and technical contributions are vital for refining our financial logic and user experience.

## Code of Conduct

By participating in this project, you agree to maintain a professional and respectful environment. We value technical candor and constructive peer review.

## Our Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **Components:** Radix UI / shadcn/ui
- **State:** React Context API

## How to Contribute

### 1. Reporting Issues

Before opening a new issue, please search existing ones. When reporting a bug, include:

- A clear description of the issue.
- Steps to reproduce.
- Your local timezone (crucial for date-related bugs).
- Expected vs. actual financial calculations.

### 2. Development Workflow

1. **Fork** the repository and create your branch from `master`.
2. **Install** dependencies using `npm install`.
3. **Implement** your changes. If adding new features, include relevant unit tests.
4. **Lint & Format** your code before committing.
5. **Submit** a Pull Request with a clear description of the changes.

## Engineering Standards

### Date Handling (The Local-First Rule)

To maintain financial accuracy across timezones, we avoid the "JavaScript Date Trap."

- **Never** use `toISOString()` or `new Date(isoString)` for stored records.
- **Always** use our custom primitives: `toISODate(date)` and `parseLocalDate(str)`.
- Refer to `ENGINEERING.md` for the full technical specification.

## Pull Request Guidelines

- Use [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`, `refactor:`).
- Keep PRs focused; avoid "mega-PRs" that combine unrelated changes.
- Ensure all automated tests pass (`npm test`).

---

Thank you for helping build a better way to track yields.
