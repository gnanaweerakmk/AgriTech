# AgriTech module map

The five assigned web modules have separate screen files under `apps/web/modules`. Each module keeps its pages in a `screens.tsx` file and owns module-specific code added there. Route entry points are in `apps/web/app`.

## Assigned modules

| Assigned module | Web screens | Current live backend |
| --- | --- | --- |
| Crop & Land Management | `modules/crop-land/screens.tsx` | Farmer and landowner leasing is connected to `/leasing` and the Go leasing API. Crop plans, harvest estimates, disease observations and other crop pages use browser demo data. |
| Buyers & Sellers Management | `modules/buyers-sellers/screens.tsx` | Listings, bids, checkout and orders use browser demo data. Checkout does not call the demand limit API or a real payment gateway. |
| Transport & Logistics | `modules/transport-logistics/screens.tsx` | Booking, driver acceptance, fleet availability, tracking and history use browser demo data. |
| Storage & Inventory | `modules/storage-inventory/screens.tsx` | Warehouse capacity and stock movements use browser demo data. |
| Stakeholders & Governance | `modules/stakeholders-governance/screens.tsx` | Protected escrow and demand limits use Go and PostgreSQL routes. Other Governance screens use browser demo data. |

## Shared code

- Shared web controls and browser demo state: `apps/web/modules/shared/ui.tsx`
- Shared transaction history: `apps/web/modules/shared/history.tsx`
- Escrow API and PostgreSQL implementation: `services/api/internal/payment`
- API route registration: `services/api/cmd/api/main.go`
- Regional demand API: `services/api/cmd/api/demand.go`
- Farmer and landowner leasing API: `services/api/cmd/api/leasing.go`
- Database migrations: `infra/database`
- Keycloak roles and local development accounts: `infra/keycloak/agritech-realm.json`

## Run and sign in

From the repository root, start Docker Desktop and run:

```powershell
docker compose up --build -d
Set-Location apps/web
Copy-Item .env.example .env.local
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`. Use the sample local accounts described in `README.md`. The Leasing page needs a Farmer or Landowner account. The Escrow and Regional Demand pages need Super Admin or Auditor access.

For an existing database, apply new numbered SQL migrations before restarting the API. The automatic SQL imports in Compose run only when PostgreSQL first creates its data directory.
