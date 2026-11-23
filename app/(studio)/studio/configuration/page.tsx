import { notFound } from "next/navigation";
export default function Page() {
  if (process.env.STUDIO_CONNECTED !== "true") notFound();
  return null;
}
