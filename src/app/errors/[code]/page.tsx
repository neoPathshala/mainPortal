import { notFound } from "next/navigation";
import { ErrorPage } from "@/components/errors/ErrorPage";
import { isErrorCode } from "@/lib/error-pages";

export const metadata = { title: "Help getting back | neoPathshala", robots: { index: false, follow: false } };
// Dedicated recovery pages also make every state directly reviewable.
export default async function RecoveryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!isErrorCode(code)) notFound();
  return <ErrorPage code={code} />;
}
