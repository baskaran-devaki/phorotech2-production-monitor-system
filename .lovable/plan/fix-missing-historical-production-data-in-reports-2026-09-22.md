# Fix missing historical production data in reports

## Root cause confirmed
- The shared production query requests all rows once, but the data service returns at most 1,000 rows per request.
- Dashboard, TV Mode, report preview, PDF, and Excel currently filter that already-truncated list in the browser.
- The database itself is safe: July 2026 contains 694 rows across all 31 days, including July 1–7, with a monthly total of 5,067 loads. No delete/truncate reset trigger exists.

## Changes
1. Add a small reusable paginated production-record fetcher that retrieves every matching row in 1,000-row pages, with optional inclusive date bounds.
2. Update the shared Dashboard/TV data hook to use the paginated fetcher, preserving current ordering, realtime refresh, 06:00 AM business-date logic, and all shift calculations.
3. Update the Monthly Report workflow so preview, PDF, and Excel fetch all records for the selected month/date range directly from the database before building totals; do not rely on currently loaded or visible rows.
4. Restyle only the generated PDF to a white, printer-friendly header and body. Replace every page footer with exactly `Generated Time: DD-MM-YYYY HH:MM` and no other footer text.

## Verification
- Compare July 2026 database total, Dashboard-derived total, report preview total, and PDF report total.
- Verify July 1–7 rows are present in historical report data.
- Verify a previous-month report and TV current/previous-month calculations use complete paginated records.
- Render the generated PDF and visually inspect every page for clipping, overlap, dark backgrounds, and footer format.
- Confirm no migration, record write, deletion, reset, RLS, authentication, IoT, shift, or business-date changes are made.

## Technical details
- Use inclusive `.gte("entry_date", from)` / `.lte("entry_date", to)` filters and deterministic ordering before paging with `.range(from, to)`.
- Stop paging only when a page contains fewer than 1,000 rows; surface query errors instead of silently generating partial reports.
