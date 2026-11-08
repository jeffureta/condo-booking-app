# Accessible Condo Booking System

A fast, lightweight, and 100% free condo/property booking solution powered by **Google Apps Script** and **Google Calendar**.

## Features

- **Google Calendar Direct Integration**: Automatically synchronizes reservations with a designated secondary Google Calendar.
- **Conflict Prevention**: Built-in verification logic prevents overlapping dates and double-bookings.
- **Mobile & Screen-Reader Accessible (WCAG AA)**:
  - 48px+ touch targets across interactive controls.
  - Dynamic `aria-live` region announcements for status updates.
  - WCAG AA compliant high color contrast.
  - One-tap "Add to Google Calendar" and `.ics` download on confirmation.
- **No Guest Sign-In Friction**: Guests can view real-time availability and request dates without requiring a Google Account.
- **Zero Cost**: Built entirely within Google's standard free tier.

---

## Testing & Quality Gates

Run the automated test suite locally:
```bash
npm test
```

## Smart Git Workflow

This repository adheres to the autonomous **Smart Git Workflow** (`/smart-git-workflow`):
1. **Feature Branching**: Semantic branches (`feat/<name>`, `fix/<name>`, `chore/<name>`).
2. **Safety Gate**: Mandatory automated test verification (`npm test`) before pushes or PR creation.
3. **Autonomous PR & Auto-Merge**: Created and merged via GitHub CLI (`gh pr create`, `gh pr merge --auto --squash`).

---

## Deployment & Setup

For full step-by-step setup and sharing instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).
