# PPMS Production + Maintenance Upgrade

## Goal
Extend the existing PPMS into one production-ready system for Production, Maintenance, Super Admin, reporting, analytics, TV, and Android-sized web screens. Preserve the current production dashboard, 06:00 business-date rule, three shifts, AUTO/MANUAL enforcement, historical records, reports, and TV Mode.

## Safety baseline
- Keep all existing tables and production rows intact; use additive database changes only.
- Record current production counts and month totals before changes, then compare them after each database phase.
- Never add automatic retention deletion. Keep records active until a verified archive and recovery process exists.
- Keep the existing Super Admin as the only account and permission manager.
- Keep email/password sign-in. Store a separate username and Super Admin-assigned department.

## Build sequence

### 1. Identity and permissions
- Add user profiles for username and department: Production, Maintenance, or Admin.
- Add a permission catalogue and per-user grants for Dashboard, Production view/entry, Downtime view/entry/close, Reports, Analytics, TV Mode, and Notifications.
- Extend the existing account invitation flow so Super Admin assigns username, department, and permissions.
- Enforce all permissions in database rules and authenticated server actions; UI visibility mirrors, but never replaces, backend checks.
- Keep roles in the existing separate role table; profiles will not store privileged roles.

### 2. Maintenance data foundation
- Add Maintenance Team records with required name/designation, optional employee ID, and active/inactive status.
- Add downtime incidents with business date, shift, process, timestamps, reason, description, actions, materials, status, and calculated duration.
- Add an attendance relation supporting multiple maintenance members per incident, with immutable name/ID/designation snapshots for historical traceability.
- Add secure photo metadata for before/after images, backed by a private maintenance-photo storage bucket.
- Add indexes for date, status, shift, process, category, and active-incident queries.

### 3. Downtime workflow and screens
- Add protected Production, Downtime, Reports, Analytics, and Administration navigation without redesigning the existing dashboard.
- Build Active Downtime, Report Downtime, History, Maintenance Team, and Downtime Analytics screens.
- Implement Reported → Under Maintenance → Testing → Resolved → Closed transitions with department and permission checks.
- Show live elapsed time for open incidents and refresh active incidents through realtime updates.
- Make forms, filters, tables, photo capture/upload, and actions touch-friendly on Android-sized screens.

### 4. Reporting and analytics
- Keep the existing complete paginated production-report fetch path unchanged.
- Add downtime date-range filters, complete paginated exports, and actual-record analytics for totals, incident count, average/longest duration, reasons, shifts, processes, and maintenance members.
- Add printer-friendly PDF and professional Excel exports with company branding.
- Ensure exports fetch all matching database rows rather than only visible table pages.

### 5. Audit, terminology, and retention safeguards
- Expand audit details for department, module, previous/new values, and result; normal users cannot edit/delete audit history.
- Audit downtime, team, permission, production, and administrative changes.
- Use “Network Status” in normal user screens; keep ESP32/IoT wording only in technical Admin diagnostics.
- Add retention/archive audit structures and a safe eligibility/verification workflow, but do not remove any data automatically.

### 6. Validation
- Verify baseline and post-change production row counts/month totals match exactly.
- Test every permission combination server-side, including direct-request denial.
- Test the complete downtime workflow, multi-person attendance snapshots, private photos, filters, analytics, PDF, and Excel.
- Verify the current dashboard, AUTO/MANUAL mode, API recording, historical reports, TV Mode, realtime updates, and 06:00 shift logic remain correct.
- Test desktop, 1920×1080 TV, and Android-sized layouts.
- Run database security checks and resolve only findings introduced or affected by this upgrade.

## Technical details
- Use additive Lovable Cloud migrations with explicit grants, row-level security, and security-definer helpers whose execution is narrowly granted.
- Protected application operations use authenticated server functions; private photos use signed access.
- New app pages remain under the existing authenticated layout. Existing public dashboard/TV behavior remains unchanged unless a granted permission explicitly governs a newly added control.
- No Android-only database or separate native data store; the responsive web interface uses the same central records.
