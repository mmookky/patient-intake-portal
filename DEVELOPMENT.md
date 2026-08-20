# Development Planning

This project is an independent front-end candidate assignment for Agnos and is not presented as an official company product.

## Product scope

The application intentionally focuses on the two interfaces requested by the assignment: patient data entry and staff monitoring. The landing page is a demo-oriented entry point, not an authentication mechanism. Appointment management, medical records, analytics, and staff editing are outside scope.

## Information architecture

- `/` explains the product and links to both roles.
- `/patient/[sessionId]` owns data entry, validation, activity detection, autosave, and submission.
- `/staff/[sessionId]` owns read-only monitoring of one patient session.
- A UUID session ID separates concurrent patients and acts as the channel topic.

## UI and responsive decisions

The interface uses a restrained healthcare visual language: blue for primary actions and confirmed state, green for active connection, amber for inactivity, generous whitespace, visible labels, and high-contrast content.

Patient fields are grouped by meaning rather than presented as one long list. Desktop layouts use two columns where fields are naturally paired. Below the medium breakpoint, every field becomes one column and the primary action expands for comfortable touch use.

The staff interface is a patient detail view rather than a wide table. Long values such as address and email wrap safely. Desktop screens place session activity beside the details; narrow screens stack it below. A table would be appropriate for a future multi-patient queue, but that is not required by this assignment.

## Component architecture

- `RoleSelector`: creates a patient session or opens the shared demo session.
- `PatientForm`: owns the form, autosave, inactivity timer, and submit transaction.
- `StaffView`: loads the latest snapshot and renders real-time updates.
- `FormField`: keeps labels, required markers, and errors consistent.
- `ConnectionIndicator`: presents connection state without relying on color alone.
- `useRealtimeSession`: encapsulates Supabase channel setup, Presence, Broadcast, cleanup, and local fallback.
- `patient-schema`: provides the shared TypeScript model and Zod validation contract.
- `session-lifecycle`: centralizes valid activity-state transitions.
- `session-store`: maps the application model to Supabase and local development storage.

## Real-time synchronization flow

```text
Patient input
    │
    ├── immediate state update
    ├── broadcast snapshot through session channel
    └── debounced draft persistence
                 │
                 ▼
        Supabase Realtime / PostgreSQL
                 │
                 ├── live broadcast → Staff View
                 └── saved snapshot → refresh or late join
```

Broadcast provides low-latency ephemeral updates. PostgreSQL supplies durable recovery when staff open the page after earlier broadcasts or refresh the browser. In local development without credentials, `BroadcastChannel` and `localStorage` reproduce the same two-tab interaction.

## Status lifecycle

```text
Active ──30 seconds without interaction──▶ Inactive
  ▲                                         │
  └──────────────new form input─────────────┘

Active/Inactive ──valid successful submit──▶ Submitted
Submitted is terminal
```

Submission is persisted before the UI reports success. A failed save leaves the form editable and provides a retryable error. Once submitted, inactivity and later input updates cannot change the terminal status.

## Edge cases

- Invalid values remain editable and cannot be submitted.
- Closing or losing a connection does not erase the last staff snapshot.
- Staff joining late loads the database snapshot before receiving new broadcasts.
- Empty optional fields render as “Not provided yet,” never `null` or `undefined`.
- Debouncing reduces database writes while Broadcast keeps the interface responsive.
- The submit button is disabled during submission to prevent duplicate requests.
- Session-specific channels prevent updates from different patients from mixing.
- Connection and activity state use text and icons as well as color.

## Technical trade-offs

Supabase Realtime was chosen instead of hosting a custom WebSocket server. It satisfies the assignment's WebSocket-or-equivalent requirement while allowing the Next.js frontend to deploy cleanly on Vercel. The assignment policies favor easy review over production authorization. Authentication and stricter RLS are documented rather than added as unrelated product scope.

The client currently broadcasts complete form snapshots. The payload is small, and snapshots simplify reconnect and ordering behavior for this assignment. A larger production form could broadcast typed patches with server versioning.

## Git strategy

Commits use Conventional Commits and represent reviewable milestones:

1. `chore: initialize Next.js application`
2. `feat: build real-time patient intake experience`
3. `test: cover validation and critical session flows`
4. `docs: document setup architecture and deployment`

Future fixes should use `fix:`, refactors should use `refactor:`, and changes that only affect tooling should use `chore:`.
