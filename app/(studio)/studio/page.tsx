import { redirect } from "next/navigation";
export default function StudioPage() {
  if (process.env.STUDIO_CONNECTED === "true") return null;
  redirect("/studio/validation");
}
