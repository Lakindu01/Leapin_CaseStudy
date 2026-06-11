#### 1. Timeline Gaps (Missing Data)
A gap occurs when a member receives a care service on a specific date, but no rate record in the database encompasses that date.
*   **Visual Scenario:**
    *   Rate Record A: Valid `2026-01-01` to `2026-03-31`
    *   Rate Record B: Valid `2026-06-01` to `2026-12-31`
    *   **The Gap:** A claim is submitted for a service date of `2026-04-15`.
*   **Technical Impact:** The database query yields `null`. Attempting to extract rates from a non-existent record will crash the calculation logic with an unhandled runtime error.

#### 2. Timeline Overlaps (Conflicting Data)
An overlap occurs when multiple rate records cover the exact same service date due to overlapping date boundaries.
*   **Visual Scenario:**
    *   Rate Record A: Valid `2026-01-01` to `2026-12-31` (Member pays 20%)
    *   Rate Record B: Valid `2026-10-01` to `2026-12-31` (Member pays 25%)
    *   **The Overlap:** A claim is submitted for a service date of `2026-11-15` (falls into both buckets).
*   **Technical Impact:** The database returns multiple valid rows. The application cannot deterministically evaluate the financial calculations because it is ambiguous whether the 20% or 25% rate should apply.

#### 3. serverless-http wrapping Express is acceptable or do we need specifically individual Lambda handlers per route.
**Option A** — Keep serverless-http wrapping Express
  One Lambda, one handler, Express routes inside. Still fully serverless. serverless-http is in your dependencies for exactly this reason. Simpler to build, easier to test locally.
**Option B** — Individual Lambda per route
  Each endpoint is its own Lambda function in serverless.yml. More "pure" serverless but significantly more boilerplate — every handler needs its own file, own export, own function block in serverless.yml.


---
#### Rule for Gaps (Missing Rates)
If a claim service date does not match any effective contribution rate record, the application will immediately halt processing[cite: 1]. It will reject the claim and return a structured `400 Bad Request` payload:
