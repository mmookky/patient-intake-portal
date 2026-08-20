# Patient Intake Portal

A responsive, real-time patient intake experience designed as a portfolio project. Patients complete a validated form while staff monitor every update, activity state, and final submission from a separate view.

> Demo only: do not enter real patient information. Production healthcare software requires authenticated access, audited privacy controls, and an organization-specific compliance review.

## Live application

- Application: [patient-intake-portal-two.vercel.app](https://patient-intake-portal-two.vercel.app)
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
- Automatic inactive state after 10 seconds without interaction or when the patient leaves the tab
- Mouse, keyboard, touch, scroll, and tab-focus activity restore the active state
- Terminal submitted state that cannot be overwritten by inactivity
- A submitted patient can start a fresh form with a new session ID
- Session-specific patient and staff URLs
- Multi-session staff notifications with unread badges and new-tab review
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
   git clone https://github.com/mmookky/patient-intake-portal.git
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
7. Dismiss a notification toast and confirm that its unread badge remains until the session is opened or removed from the list.
8. Stop interacting for 10 seconds, switch away from the patient tab, or blur the window and confirm that the status changes to **Inactive**.
9. Move the pointer, type, scroll, touch the page, or return to the patient tab and confirm that it returns to **Actively filling**.
10. Submit valid information and confirm that both views remain **Submitted**.
11. Choose **Start a new form** and confirm that a blank form opens under a new session ID.

## Validation rules

- All fields are required except middle name, emergency contact, and religion.
- Name-like fields accept Unicode letters, spaces, apostrophes, and hyphens; numbers and unsupported symbols are rejected.
- Phone numbers must contain 8 to 15 digits, and email addresses must have a valid format.
- Date of birth must be a real date, cannot be in the future, and must be within the last 120 years.
- Gender and preferred language must match the available options.
- Addresses must contain meaningful letters or numbers and cannot exceed 300 characters.
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
4. Deploy and open the production landing page. Choose **Start patient form** to create a valid UUID session, and open `/staff` in another browser or device.
5. Verify the complete real-time flow on the production domain before submission.

## Security notes

The included anonymous Supabase policies make the portfolio demo easy to explore with UUID capability links. They are intentionally limited to a demo. A production implementation must use authenticated patient/staff identities, restrictive row-level security, audit logging, retention policies, encryption governance, and a formal healthcare privacy review.
