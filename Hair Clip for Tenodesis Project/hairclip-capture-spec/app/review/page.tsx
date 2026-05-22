import { ReviewStep } from "@/components/review-step";
import { CaptureMode, CaptureStep } from "@/lib/types";

export default async function ReviewPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string; step?: string }>;
}) {
  const params = await searchParams;
  const mode = (params.mode === "no-card" ? "no-card" : "a4") as CaptureMode;
  const step = (params.step === "side" ? "side" : "top") as CaptureStep;
  return (
    <main className="shell">
      <ReviewStep mode={mode} step={step} />
    </main>
  );
}
