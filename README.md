# Patient Intake Portal

A responsive, real-time patient intake experience designed as a portfolio project. Patients complete a validated form while staff monitor every update, activity state, and final submission from a separate view.

> Demo only: do not enter real patient information. Production healthcare software requires authenticated access, audited privacy controls, and an organization-specific compliance review.

## Live application

- Application: add the Vercel URL after deployment
- Patient demo: choose **Start patient form** on the landing page
- Staff demo: choose **Open staff view** to monitor incoming sessions

Open the patient and staff URLs in separate tabs. Changes in the patient form appear in the staff view immediately.

## Features

- Guided patient form with accessible, field-level validation
- Responsive layouts for mobile, tablet, and desktop
- Real-time form updates using Supabase Broadcast over WebSockets
- Connection awareness using Supabase Presence
- Local `BroadcastChannel` fallback for development without Supabase credentials
- Draft persistence and refresh recovery
- `Actively filling`, `Inactive`, and `Submitted` lifecycle
- Automatic inactive state after 30 seconds without form interaction
- Terminal submitted state that cannot be overwritten by inactivity
- Session-specific patient and staff URLs
- Multi-session staff notifications with new-tab review
- Loading, empty, saving, reconnecting, error, and success states
- Unit and end-to-end test coverage for critical flows

## Technology

- Next.js App Router, React, and TypeScript
- Tailwind CSS
- React Hook Form and Zod
- Supabase Realtime and PostgreSQL
- Vitest and Playwright
- ESLint and Prettier
- Vercel

## Prerequisites

- Node.js 24 or a supported current LTS release
- npm 10+
- A Supabase project for cross-device real-time behavior and persistence

## Local setup

1. Clone the repository and enter it:

   ```bash
   git clone <repository-url>
   cd patient-intake-portal
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

   On PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

4. Add the Supabase project URL and anon key to `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

5. Run `supabase/migrations/001_patient_sessions.sql` in the Supabase SQL editor.

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open `http://localhost:3000`.

Without Supabase variables, the application automatically uses browser storage and `BroadcastChannel`. This supports a two-tab local demo in the same browser but not cross-device synchronization.

## How to test the real-time flow

1. Choose **Open staff view** and confirm that it waits for patient activity.
2. Open the landing page in another tab and choose **Start patient form**.
3. Confirm that Staff opens the first patient session automatically.
4. Enter patient information and confirm that the staff view updates without refreshing.
5. Open a second patient form and confirm that Staff shows a notification without replacing the current session.
6. Open the notification in a new tab and confirm it shows the second session.
7. Stop interacting for 30 seconds and confirm that the status changes to **Inactive**.
8. Edit any field and confirm that it returns to **Actively filling**.
9. Submit valid information and confirm that both views show **Submitted**.

## Validation rules

- All fields are required except middle name, emergency contact, and religion.
- Email and phone number must have valid formats.
- Date of birth cannot be in the future.
- Emergency contact name and relationship must be completed together.
- Invalid information cannot be submitted.

## Commands

| Command                | Purpose                               |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Start the local development server    |
| `npm run build`        | Create a production build             |
| `npm run start`        | Run the production server             |
| `npm run lint`         | Run ESLint                            |
| `npm run typecheck`    | Run TypeScript without emitting files |
| `npm test`             | Run unit tests                        |
| `npm run test:e2e`     | Run Playwright tests                  |
| `npm run format`       | Format the repository                 |
| `npm run format:check` | Verify formatting                     |

## Project structure

```text
src/
├── app/                    Next.js routes and global styles
│   ├── patient/[sessionId] Patient form route
│   └── staff/[sessionId]   Staff monitoring route
├── components/             Reusable UI and feature components
├── hooks/                  Real-time session lifecycle
└── lib/                    Schema, storage, Supabase, and state rules
supabase/
└── migrations/             Database schema and demo policies
tests/
└── e2e/                    Browser-level acceptance tests
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for the architecture, responsive design decisions, synchronization flow, edge cases, and trade-offs.

## Deployment

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project settings.
4. Deploy and verify both `/patient/demo` and `/staff/demo` in separate browsers.
5. Add the production URL to this README before submission.

## Security notes

The included anonymous Supabase policies make the portfolio demo easy to explore with UUID capability links. They are intentionally limited to a demo. A production implementation must use authenticated patient/staff identities, restrictive row-level security, audit logging, retention policies, encryption governance, and a formal healthcare privacy review.
