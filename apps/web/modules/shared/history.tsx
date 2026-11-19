"use client";
import { useState } from "react";
import { Panel, ReportButton, Table, Tabs } from "../shared/ui";

export function History({ title, rows, children }: { title: string; rows: string[][]; children?: React.ReactNode }) {
  const [query, search] = useState("");
  const [filter, setFilter] = useState("All payments");
  const columns = ["Transaction / booking", "Date", "Amount", "Payment status"];
  const matching = rows.filter(row => row.join(" ").toLowerCase().includes(query.trim().toLowerCase())
    && (filter === "All payments" || filter === row[3]));
  return <>
    <Panel title={title}>
      <label>Search references<input value={query} type="search" placeholder="Search booking or reference" onChange={event => search(event.target.value)} /></label>
      <Tabs items={["All payments", "Pending", "Verified"]} active={filter} onChange={setFilter} />
      <Table columns={columns} rows={matching} />
      {matching.length > 0 && <ReportButton name="agritech-transaction-history" rows={[columns, ...matching]}>Export transactions</ReportButton>}
    </Panel>
    {children}
  </>;
}
