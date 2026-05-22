import { CaptureFlow } from "@/components/capture-flow";
import { CaptureMode } from "@/lib/types";

export default async function CaptureTopPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = (params.mode === "no-card" ? "no-card" : "a4") as CaptureMode;
  return (
    <main className="shell">
      <CaptureFlow mode={mode} step="top" />
    </main>
  );
}
