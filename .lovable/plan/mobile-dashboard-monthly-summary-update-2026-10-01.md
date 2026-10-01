# Mobile dashboard monthly summary update

## Changes
- Remove the AUTO/MANUAL badge only from the mobile Today’s Production card.
- Keep the mobile Analytics section to one Total Monthly Loads card.
- Populate that card with the existing Monthly Report summary: working days, Sunday working days, total loads, target loads, all three shift totals, and achievement percentage.
- Reuse `buildReport` and its existing month-range calculation rather than introducing new formulas.
- Keep desktop, TV Mode, report exports, production data, shift boundaries, and the 06:00 AM business-day behavior unchanged.

## Validation
- Check the mobile Dashboard and Analytics views for fit and readability.
- Confirm desktop remains unchanged and the project still builds successfully.
