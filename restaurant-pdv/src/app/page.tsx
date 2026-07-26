import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";

export default async function Home() {
  const session = await verifySession();

  if (!session) redirect("/login");
  if (session.role === "ADMIN") redirect("/admin");
  if (session.role === "GARCOM") redirect("/garcom");
  redirect("/caixa");
}
