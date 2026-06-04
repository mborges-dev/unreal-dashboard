import { notFound } from "next/navigation";
import { PROJECT_IDS, type ProjectId } from "@/lib/projects";
import { Shell } from "@/components/Shell";

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { project: string };
}) {
  if (!PROJECT_IDS.includes(params.project as ProjectId)) notFound();
  return <Shell>{children}</Shell>;
}
