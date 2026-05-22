"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveImage } from "@/lib/storage";
import { CaptureMode, CaptureStep, QualityCheck } from "@/lib/types";

type Props = {
  mode: CaptureMode;
  step: CaptureStep;
};

const TOP_COPY = {
  title: "Photo 1 of 2: Top View",
  helper:
    "Center the full clip. In A4 mode, keep the whole calibration sheet visible and as flat as possible.",
  frameClass: "portrait",
};

const SIDE_COPY = {
  title: "Photo 2 of 2: Side View",
  helper:
    "Turn the clip to its side so the attachment thickness region is visible. Keep the hinge and wing profile in frame.",
  frameClass: "portrait",
};

function evaluateImage(src: string, mode: CaptureMode, step: CaptureStep): Promise<QualityCheck[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve([]);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let total = 0;
      let bright = 0;
      let dark = 0;
      let edges = 0;

      for (let i = 0; i < data.length; i += 4) {
        const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        total += lum;
        if (lum > 230) bright += 1;
        if (lum < 35) dark += 1;
        if (i > 4) {
          const prev = 0.2126 * data[i - 4] + 0.7152 * data[i - 3] + 0.0722 * data[i - 2];
          if (Math.abs(lum - prev) > 25) edges += 1;
        }
      }

      const pixels = width * height;
      const avg = total / pixels;
      const blurScore = edges / pixels;
      const brightRatio = bright / pixels;
      const darkRatio = dark / pixels;

      const checks: QualityCheck[] = [
        {
          key: "brightness",
          label: "Lighting",
          status: avg > 80 && avg < 205 ? "good" : "warning",
          detail:
            avg > 80 && avg < 205
              ? "Lighting looks usable for detection."
              : "Adjust lighting to reduce shadows or overexposure.",
        },
        {
          key: "blur",
          label: "Sharpness",
          status: blurScore > 0.045 ? "good" : "warning",
          detail:
            blurScore > 0.045
              ? "Edge detail looks strong enough for first-pass analysis."
              : "Image may be too soft. Hold still and retake if possible.",
        },
        {
          key: "glare",
          label: "Glare",
          status: brightRatio < 0.1 ? "good" : "warning",
          detail:
            brightRatio < 0.1
              ? "No major glare hotspots detected."
              : "High reflectivity may hide the clip boundary.",
        },
        {
          key: "framing",
          label: "Framing",
          status: darkRatio < 0.65 ? "good" : "warning",
          detail:
            darkRatio < 0.65
              ? `${step === "top" ? "Top" : "Side"} framing looks plausible.`
              : "The clip may be out of frame or the preview is too dark.",
        },
      ];

      if (mode === "a4") {
        checks.push({
          key: "card",
          label: "Calibration card",
          status: avg > 100 ? "good" : "warning",
          detail:
            avg > 100
              ? "The A4 card should be visible enough for rectification."
              : "Make sure the full A4 card is visible and flat.",
        });
      }

      resolve(checks);
    };
    img.src = src;
  });
}

export function CaptureFlow({ mode, step }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [error, setError] = useState<string | null>(null);

  const copy = useMemo(() => (step === "top" ? TOP_COPY : SIDE_COPY), [step]);

  useEffect(() => {
    let mounted = true;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
        if (!mounted) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        setError("Camera access failed. Allow camera permissions and try again.");
      }
    }
    start();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

async function captureNow() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    const sourceWidth = videoRef.current.videoWidth;
    const sourceHeight = videoRef.current.videoHeight;
    const maxDimension = 1440;
    const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
    canvas.width = Math.round(sourceWidth * scale);
    canvas.height = Math.round(sourceHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/jpeg", 0.82);
    setPreview(image);
    setQualityChecks(await evaluateImage(image, mode, step));
  }

  function startCountdown() {
    let value = 3;
    setCountdown(value);
    const timer = window.setInterval(async () => {
      value -= 1;
      if (value <= 0) {
        window.clearInterval(timer);
        setCountdown(null);
        await captureNow();
      } else {
        setCountdown(value);
      }
    }, 1000);
  }

  function continueFlow() {
    if (!preview) return;
    saveImage(step, preview, mode);
    router.push(`/review?step=${step}&mode=${mode}`);
  }

  return (
    <div className="panel stepCard">
      <div className="captureHeader">
        <span className="eyebrow">Guided Capture</span>
        <div className="progressBadge">{step === "top" ? "Step 1 of 2" : "Step 2 of 2"}</div>
      </div>
      <h1>{copy.title}</h1>
      <p className="subtle">{copy.helper}</p>
      <div className="stepMeta">
        <span>{mode === "a4" ? "A4 calibration mode" : "No-card advisory mode"}</span>
        <span>{step === "top" ? "Top-down measurement capture" : "Side profile capture"}</span>
      </div>
      <div className="captureChecklist">
        <div className="captureNote">
          <strong>{mode === "a4" ? "Keep the A4 sheet fully in frame." : "Keep the clip isolated against a calm background."}</strong>
          <div className="subtle">
            {step === "top"
              ? "The first image drives overall geometry and spacing."
              : "The second image helps estimate thickness and how far the extender can seat."}
          </div>
        </div>
      </div>
      <div className="cameraStage" style={{ marginTop: 20 }}>
        {preview ? <img alt="Capture preview" src={preview} /> : <video ref={videoRef} playsInline muted />}
        <div className="frameOverlay">
          <div className={`frameGuide ${copy.frameClass}`} />
        </div>
        {countdown !== null ? <div className="countdown">{countdown}</div> : null}
      </div>
      {error ? <p className="subtle">{error}</p> : null}
      <div className="buttonRow" style={{ marginTop: 20 }}>
        {!preview ? (
          <button className="button accent" onClick={startCountdown}>
            Capture with 3-second Countdown
          </button>
        ) : (
          <>
            <button className="button accent" onClick={continueFlow}>
              Keep This Photo
            </button>
            <button className="button secondary" onClick={() => setPreview(null)}>
              Retake
            </button>
          </>
        )}
      </div>
      {qualityChecks.length > 0 ? (
        <div className="qualityGrid" style={{ marginTop: 18 }}>
          {qualityChecks.map((check) => (
            <div className={`qualityItem ${check.status === "good" ? "good" : ""}`} key={check.key}>
              <strong>{check.label}</strong>
              <div className="subtle">{check.detail}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
