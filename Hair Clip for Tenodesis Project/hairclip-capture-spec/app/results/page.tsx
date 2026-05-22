import { ResultsClient } from "@/components/results-client";
import { CaptureMode } from "@/lib/types";

export default async function ResultsPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = (params.mode === "no-card" ? "no-card" : "a4") as CaptureMode;
  return (
    <main className="shell">
      <ResultsClient mode={mode} />
    </main>
  );
}
