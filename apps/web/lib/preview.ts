export const flows = {
  governance: {
    label: "Stakeholder and Governance", person: "R. Jayasinghe", role: "Super Admin",
    screens: {
      dashboard: "Dashboard", registration: "Registration Verification", disputes: "Escrow Disputes",
      investigations: "AI Investigations", identity: "Keycloak Admin", reports: "Reports",
      offers: "Loan Offers", applications: "Loan Applications", ledger: "Platform Ledger",
      audit: "Anomaly Review & Audit", plans: "Cultivation Plans", monitoring: "Crop Monitoring",
      warehouses: "Warehouse Inspections", demand: "Local Demand", land: "Land & Environmental Review",
    },
  },
  transport: {
    label: "Transport and logistics", person: "Green Basket Co.", role: "Transport requester",
    screens: { driver: "Driver Jobs", fleet: "Fleet Availability", book: "Book Transport", assigned: "Assigned Shipment & Pickup QR", tracking: "Shipment Tracking", history: "Transaction History" },
  },
  cultivation: {
    label: "Crop and Land", person: "Kavindu Silva", role: "Farmer",
    screens: {
      owner: "Landowner Dashboard", overview: "Overview", crops: "My Crops & Harvests", plots: "Find & Request Land",
      plans: "Cultivation Plans", health: "Crop Health", recommendations: "Crop Recommendations",
      leases: "My Leases & Payments", history: "Transaction History",
    },
  },
  market: {
    label: "Buyer and Seller", person: "Nimal Perera", role: "Seller",
    screens: {
      listings: "Listings", bids: "Buyer Bids", dispatch: "Dispatch & Transport", history: "Transaction History",
      marketplace: "Marketplace", checkout: "Checkout", orders: "My Orders",
    },
  },
  storage: {
    label: "Storage and Inventory", person: "D. Senanayake", role: "Warehouse operator",
    screens: {
      settings: "Warehouse Settings", movements: "Receiving & Stock Movements",
      capacity: "Capacity", inventory: "Inventory & Reports", history: "Transaction History",
    },
  },
} as const;

export type Flow = keyof typeof flows;
export const flowEntries = Object.entries(flows) as [Flow, (typeof flows)[Flow]][];
export const previewPath = (flow: Flow, screen?: string) =>
  "/preview/" + flow + "/" + (screen ?? ({ governance: "dashboard", transport: "book", cultivation: "overview", market: "listings", storage: "settings" }[flow]));

