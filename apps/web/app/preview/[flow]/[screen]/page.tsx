import { notFound } from "next/navigation";
import { flows, type Flow } from "../../../../lib/preview";
import { Preview } from "../../workspace";

export default async function PreviewPage({ params }: { params: Promise<{ flow: string; screen: string }> }) {
  const { flow, screen } = await params;
  if (!Object.hasOwn(flows, flow)) notFound();
  const entry = flows[flow as Flow];
  if (!Object.hasOwn(entry.screens, screen)) notFound();
  return <Preview key={flow + "/" + screen} flow={flow as Flow} screen={screen} />;
}

