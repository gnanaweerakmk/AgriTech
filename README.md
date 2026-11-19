# AgriTech web prototype and Sprint 0 starter

AgriTech's Next.js web app includes an interactive implementation of the linked team's Figma prototype. It has workspaces for login and registration, Stakeholders & Governance, Crop & Land, Buyers & Sellers, Transport & Logistics, and Storage & Inventory.

## Open the web demo on Windows

Use Node.js 20.9 or newer. From the project folder:

```powershell
Set-Location apps/web
npm.cmd install
npm.cmd run dev
```

Open [AgriTech](http://localhost:3000) and select **Explore the demo**. Switch workspaces from the green demo bar. Registration uses the sample code shown on screen. Demo changes remain in the current browser profile. Use sample inputs throughout.

| Workspace | Example demo workflow |
| --- | --- |
| Login and registration | Submit a sample registration and review it in Governance |
| Stakeholders and Governance | Review documents and roles, resolve a dispute, triage an alert, export CSV reports, and browse bank, auditor, and authority workspaces |
| Crop and Land | Record a harvest estimate, request land, submit a cultivation plan, and simulate a lease payment |
| Buyers and Sellers | Publish a listing, review bids, prepare dispatch, and work through sample checkout with a local demand check |
| Transport and Logistics | Book transport, simulate payment verification, and advance a separate assigned shipment using sample handover codes |
| Storage and Inventory | Edit warehouse capacity, record stock movements, check updated occupancy, and export an inventory report |

The design was adapted for responsive web layouts. The sample workflows use browser data. The Go/PostgreSQL service currently supports the protected escrow ledger. Real registration, document collection, identity administration, cross-module persistence, AI, GPS, gateway payments, and native mobile clients require additional implementation.

### Dashboard and review demo

Use **Menu** to switch modules and governance destinations. The former Role workspaces URL redirects to the admin dashboard. Each module has History, and governance reviews also have section and record timelines. Successful demo changes are saved in this browser and update connected views.

- **Admin:** interactive daily transaction metrics and an inventory forecast summary. Chart totals and report exports use the same sample ledger as the auditor.
- **Bank Officer → Loan Applications:** inline document previews with optional PDF downloads, past loans, platform transactions, and explanatory sample credit assessments. LN-103 demonstrates insufficient history; LN-104 demonstrates missing data-access consent.
- **Auditor → Platform Ledger:** filter transactions, inspect fees, settlements, refunds and event timelines, export CSV records, and save separate review notes.
- **Authorities:** Agriculture Department lists plots and illustrative crop predictions. Land Registration Authority records ownership and suitability decisions separately; suitability approval requires verified ownership. Warehouse and demand tools remain available in the menu.
- **Storage → Inventory Forecast:** a 14-day projection from the preceding seven calendar days of recorded movements. Initial sample observations cover 14–20 October 2026; later days without movements count as zero flow. Posted stock changes update the projection. WH-021 demonstrates insufficient history.

Credit and crop assessments are matched fictional model responses. Inventory projections use a simple daily-average calculation. None are trained AI predictions or official financial, land, or agricultural assessments. Bundled PDFs and preview images under `apps/web/public/demo` contain fictional records only. Browser activity history is a demonstration, not an immutable audit log.

From `apps/web`, run `npm.cmd test`, `npm.cmd run typecheck`, and `npm.cmd run build` to validate the demo.

## Run the protected escrow ledger

Start Docker Desktop with Linux containers. From the project root:

```powershell
docker compose up --build -d
Invoke-RestMethod http://localhost:8081/healthz
Set-Location apps/web
Copy-Item .env.example .env.local
npm.cmd install
npm.cmd run dev
```

Open [AgriTech](http://localhost:3000) and choose **Log in securely**. The portal delegates credentials to Keycloak. A fresh realm import selects the AgriTech login theme. For an existing local realm, select **agritech** under **Realm settings → Themes → Login theme** in Keycloak, then save.

| Local demo username | Access |
| --- | --- |
| `superadmin` | Create holds, release or refund, view audit history |
| `auditor` | View escrow records and audit history |
| `stakeholder` | Governance access denied |

All three local demo accounts use `AgriTechDemo123!`. The sample escrow workflow changes database records only.

1. Sign in as `superadmin`, hold `ORDER-001` for LKR 2,500, and release it. Open **View events** to see the hold and release.
2. Hold a second reference and refund it. Repeat the creation with the same reference and amount to confirm the reference remains unique.
3. Sign in as `auditor` and confirm the ledger is read-only. Try `stakeholder` and confirm access is denied.

Run `npm.cmd run typecheck` and `npm.cmd run build` in `apps/web`. Run `go test ./...` in `services/api` with Go 1.26.

| Path | Contents |
| --- | --- |
| `apps/web/app/preview` | Interactive web screens and sample workflows |
| `apps/web/app/auth` and `apps/web/app/governance` | Keycloak sign-in and protected escrow ledger |
| `services/api` | Go API, role checks, escrow service, and PostgreSQL adapter |
| `infra/keycloak` | Local realm, demo account settings, and login theme |
| `infra/database` | PostgreSQL schema with PostGIS and escrow events |

[AgriTech Figma prototype](https://www.figma.com/proto/NHDsGB0JrJHsGLJPDhJJR0/AgriTech-UI----our-one-?node-id=115-2810&show-proto-sidebar=1)


## Regional demand limits

Super Admins can set a limit per region and crop at /governance/demand. Auditors have read-only access. The Buyers & Sellers preview still uses sample data for its checkout checks.

A fresh database applies the migration automatically. For an existing Compose database, apply the additive migration from PowerShell:

```powershell
Get-Content -Raw infra/database/002-regional-demand.sql | docker compose exec -T database psql -v ON_ERROR_STOP=1 -U agritech -d agritech
docker compose up --build -d api
```

## Farmer and landowner leasing

Open /leasing and sign in with the farmer or landowner account on a freshly imported local realm. These use the same development password as the other local demo accounts. For an existing realm, create the farmer and landowner roles and assign them to separate development accounts. Apply the additive database migration and rebuild the API:

```powershell
Get-Content -Raw infra/database/003-leasing.sql | docker compose exec -T database psql -v ON_ERROR_STOP=1 -U agritech -d agritech
docker compose up --build -d api
```

Publish a plot as the landowner, submit a lease request as the farmer, then approve or reject it as the landowner. The lease tables persist these changes. Plot title verification, lease payments, and general role onboarding are separate workflows.

## Assigned web modules

| Module | Source folder |
| --- | --- |
| Crop & Land Management | apps/web/modules/crop-land |
| Buyers & Sellers Management | apps/web/modules/buyers-sellers |
| Transport & Logistics | apps/web/modules/transport-logistics |
| Storage & Inventory | apps/web/modules/storage-inventory |
| Stakeholders & Governance | apps/web/modules/stakeholders-governance |

Each folder contains its own screen implementation. Next.js route entry points stay in apps/web/app. Shared preview controls and transaction history are in apps/web/modules/shared. The shared payment backend is in services/api/internal/payment. Go route wiring and the live demand and leasing handlers are in services/api/cmd/api. PostgreSQL migrations are in infra/database.
This repository is an active prototype. Review [MODULES.md](MODULES.md) for module boundaries and a clear list of browser demos versus workflows backed by Keycloak and PostgreSQL.
