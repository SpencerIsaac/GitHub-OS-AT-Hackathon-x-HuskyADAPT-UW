"use client";

import Link from "next/link";
import { useMemo } from "react";
import { loadRecord } from "@/lib/storage";
import { CaptureMode, CaptureStep } from "@/lib/types";

export function ReviewStep({ step, mode }: { step: CaptureStep; mode: CaptureMode }) {
  const record = useMemo(() => loadRecord(), []);
  const image = step === "top" ? record.topImage : record.sideImage;
  const nextHref =
    step === "top" ? `/capture/side?mode=${mode}` : `/results?mode=${mode}`;

  return (
    <div className="panel stepCard">
      <span className="eyebrow">Checkpoint</span>
      <h1>{step === "top" ? "Top View Review" : "Side View Review"}</h1>
      <p className="subtle">
        {step === "top"
          ? "Make sure the whole clip is centered and the card edges are visible in A4 mode."
          : "Make sure the wing profile and thickness region are visible before analysis."}
      </p>
      {image ? (
        <div className="cameraStage" style={{ minHeight: 360, marginTop: 18 }}>
          <img src={image} alt={`${step} capture`} />
        </div>
      ) : (
        <p className="subtle">No image found for this step yet.</p>
      )}
      <div className="buttonRow" style={{ marginTop: 20 }}>
        <Link className="button accent" href={nextHref}>
          {step === "top" ? "Continue to Side Photo" : "Run Analysis"}
        </Link>
        <Link className="button secondary" href={`/capture/${step}?mode=${mode}`}>
          Retake Photo
        </Link>
      </div>
    </div>
  );
}
