"use client";

import Link from "next/link";
import { useState } from "react";
import { DemoForm, Panel, useDemoState } from "../../modules/shared/ui";

export default function Register() {
  const [stage, setStage] = useState(0);
  const [role, setRole] = useState("Farmer");
  const [contact, setContact] = useState({ name: "", email: "" });
  const [submissions, saveSubmissions] = useDemoState<string[][]>("registration-submissions", []);
  return <div className="app">
    <header><div className="shell bar"><Link className="brand" href="/">AgriTech</Link><Link className="button" href="/">Login / Sign Up</Link></div></header>
    <main className="shell content">
      <h1>Create an AgriTech account</h1>
      <p className="notice">Registration demo. Use example details. Sample verification code: 123456.</p>
      {stage === 0 && <Panel title="Personal information"><DemoForm id="registration-contact" fields={[
        ["Full name", "Sample Applicant"], ["Email", "applicant@example.com", "email"], ["Phone", "0770000000", "tel"],
      ]} actions={["Request verification code"]} onSubmit={(_, values) => {
        setContact({ name: values["Full name"], email: values.Email });
        setStage(1); return "";
      }} /></Panel>}
      {stage === 1 && <Panel title="Verify phone"><DemoForm id="registration-code" fields={[["Verification code"]]}
        actions={["Verify code"]} onSubmit={(_, values) => {
          if (values["Verification code"] !== "123456") return "Enter the sample code shown above.";
          setStage(2); return "";
        }} /></Panel>}
      {stage === 2 && <Panel title="Choose your role"><form className="panel-form" onSubmit={event => {
        event.preventDefault();
        const id = "DEMO-" + crypto.randomUUID().slice(0, 8).toUpperCase();
        const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Colombo" }).format(new Date());
        saveSubmissions([...submissions, [id, contact.name, contact.email, role, "1 sample document", date]]);
        setStage(3);
      }}>
        <label>Role<select value={role} onChange={event => setRole(event.target.value)}>
          {["Farmer", "Land Owner", "Driver", "Vehicle Owner", "Individual Buyer", "Warehouse Operator", "Exporter"].map(option =>
            <option key={option}>{option}</option>)}
        </select></label>
        <p>Sample evidence will be attached to this demonstration.</p>
        <div><button className="button">Submit registration</button></div>
      </form></Panel>}
      {stage === 3 && <Panel title="Registration submitted"><p role="status">Your sample {role} registration is ready for review.</p>
        <div><Link className="button" href="/preview/governance/registration">View sample verification queue</Link></div></Panel>}
    </main>
  </div>;
}

