import { redirect } from "next/navigation";
export default function ProjectIndex({ params }: { params: { project: string } }) {
  if (params.project === "global") redirect("/global");
  redirect(`/${params.project}/dashboard`);
}
