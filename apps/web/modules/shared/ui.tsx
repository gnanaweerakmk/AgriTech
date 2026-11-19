"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

export function useDemoState<T,>(key: string, fallback: T) {
  const storageKey = "agritech-preview-v1:" + key;
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) setValue(JSON.parse(saved) as T);
    } catch {}
  }, [storageKey]);

  function update(next: T) {
    setValue(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  }
  return [value, update] as const;
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="panel"><h2>{title}</h2>{children}</section>;
}

export function Metrics({ items }: { items: [string, string, string?][] }) {
  return <div className="metrics">{items.map(([label, value, detail], index) =>
    <div className={"metric" + (index === 0 ? " highlight" : "")} key={label}>
      <small>{label}</small><strong>{value}</strong>{detail && <small>{detail}</small>}
    </div>)}</div>;
}

export function Status({ children, tone = "" }: { children: ReactNode; tone?: string }) {
  return <span className={"status " + tone}>{children}</span>;
}

export function Table({ columns, rows, selected }: {
  columns: string[]; rows: ReactNode[][]; selected?: number;
}) {
  return <div className="tableWrap"><table>
    <thead><tr>{columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead>
    <tbody>{rows.map((row, i) => <tr key={i} className={i === selected ? "selected" : undefined}>
      {row.map((cell, j) => j === 0 ? <th scope="row" key={j}>{cell}</th> : <td key={j}>{cell}</td>)}
    </tr>)}</tbody>
  </table>{rows.length === 0 && <p className="notice">No matching records.</p>}</div>;
}

export function Tabs({ items, active, onChange }: { items: string[]; active: string; onChange: (value: string) => void }) {
  return <div className="tabs">{items.map(item => <button className="secondary" type="button" key={item}
    aria-pressed={active === item} onClick={() => onChange(item)}>{item}</button>)}</div>;
}

export type Field = [label: string, initial?: string, type?: string];

export function DemoForm({ id, fields, actions, children, onSubmit }: {
  id: string; fields: Field[]; actions: string[]; children?: ReactNode;
  onSubmit?: (action: string, values: Record<string, string>) => string;
}) {
  const [record, save] = useDemoState(id, { values: {} as Record<string, string>, message: "" });
  const [edits, setEdits] = useState<Record<string, string>>({});
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ?? actions[0];
    const values = Object.fromEntries(Array.from(new FormData(event.currentTarget), ([key, value]) => [key, String(value)]));
    const message = onSubmit?.(action, values) ?? "Saved in this demo: " + action;
    save({ values, message });
  }
  return <form className="panel-form" onSubmit={submit}>
    <div className="fields">{fields.map(([label, initial = "", type = "text"]) => {
      const value = edits[label] ?? record.values[label] ?? initial;
      const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setEdits(previous => ({ ...previous, [label]: event.target.value }));
      return <label key={label}>{label}{type === "textarea"
        ? <textarea name={label} value={value} onChange={onChange} required />
        : <input name={label} type={type} value={value} onChange={onChange} required min={type === "number" ? 0 : undefined} step={type === "number" ? "any" : undefined} />}</label>;
    })}</div>
    {children}
    <div className="links">{actions.map((action, index) =>
      <button key={action} className={index === 0 ? "button" : "secondary"} type="submit" value={action}>{action}</button>)}</div>
    {record.message && <p role="status" className="form-feedback">{record.message}</p>}
  </form>;
}

export function csv(name: string, rows: (string | number)[][]) {
  const content = rows.map(row => row.map(cell => {
    const value = String(cell);
    const safe = /^[\t\r\n ]*[=+\-@]|^[\t\r\n]/.test(value) ? "'" + value : value;
    return '"' + safe.replaceAll('"', '""') + '"';
  }).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name + ".csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ReportButton({ name, rows, children }: { name: string; rows: (string | number)[][]; children: ReactNode }) {
  return <div><button className="button" onClick={() => csv(name, rows)}>{children}</button></div>;
}

