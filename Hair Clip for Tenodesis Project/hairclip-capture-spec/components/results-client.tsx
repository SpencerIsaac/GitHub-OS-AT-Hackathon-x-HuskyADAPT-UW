"use client";

import { FormEvent, useEffect, useState } from "react";
import { clearRecord, loadRecord, saveRecord } from "@/lib/storage";
import { AnalysisResult, CaptureMode, SaveCaptureResponse, SpecResponse } from "@/lib/types";

type Props = {
  mode: CaptureMode;
};

type OverrideState = {
  wing_thickness_mm: string;
  attachment_opening_mm: string;
  insertion_depth_mm: string;
};

const emptyOverrides: OverrideState = {
  wing_thickness_mm: "",
  attachment_opening_mm: "",
  insertion_depth_mm: ""
};

function prettifyLabel(key: string) {
  return key
    .replace(/_mm$/g, "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ResultsClient({ mode }: Props) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [spec, setSpec] = useState<SpecResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captureSaved, setCaptureSaved] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<OverrideState>(emptyOverrides);

  useEffect(() => {
    async function run() {
      const record = loadRecord();
      if (record.analysis) {
        setAnalysis(record.analysis);
        setSpec(record.spec ?? null);
        setLoading(false);
        return;
      }
      if (!record.topImage || !record.sideImage) {
        setError("Both top and side images are required before analysis.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            top_image: record.topImage,
            side_image: record.sideImage
          })
        });
        if (!response.ok) {
          throw new Error(`Analysis request failed with status ${response.status}.`);
        }
        const result = (await response.json()) as AnalysisResult;
        setAnalysis(result);
        saveRecord({ ...record, analysis: result });

        const specResponse = await fetch("/api/spec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysis: result,
            manual_overrides: {}
          })
        });
        if (specResponse.ok) {
          const generatedSpec = (await specResponse.json()) as SpecResponse;
          setSpec(generatedSpec);
          saveRecord({ ...record, analysis: result, spec: generatedSpec });
          const captureResponse = await fetch("/api/captures", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              top_image: record.topImage,
              side_image: record.sideImage,
              analysis: result,
              spec: generatedSpec,
            }),
          });
          if (captureResponse.ok) {
            const saved = (await captureResponse.json()) as SaveCaptureResponse;
            setCaptureSaved(saved.capture_id);
          }
        }
      } catch (err) {
        setError(
          "Analysis failed. The app could not reach the OpenCV service through its relay. This usually means the local analysis service or its public tunnel is down, or the uploaded images were too large to relay."
        );
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [mode]);

  async function finalizeSpec(event: FormEvent) {
    event.preventDefault();
    if (!analysis) return;
    setFinalizing(true);
    const manualOverrides = {
      wing_thickness_mm: overrides.wing_thickness_mm ? Number(overrides.wing_thickness_mm) : null,
      attachment_opening_mm: overrides.attachment_opening_mm ? Number(overrides.attachment_opening_mm) : null,
      insertion_depth_mm: overrides.insertion_depth_mm ? Number(overrides.insertion_depth_mm) : null
    };

    try {
      const response = await fetch("/api/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          manual_overrides: manualOverrides
        })
      });
      if (!response.ok) {
        throw new Error(`Spec request failed with status ${response.status}.`);
      }
      const result = (await response.json()) as SpecResponse;
      setSpec(result);
      const record = loadRecord();
      saveRecord({ ...record, analysis, spec: result });
      if (record.topImage && record.sideImage) {
        const captureResponse = await fetch("/api/captures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            top_image: record.topImage,
            side_image: record.sideImage,
            analysis,
            spec: result,
          }),
        });
        if (captureResponse.ok) {
          const saved = (await captureResponse.json()) as SaveCaptureResponse;
          setCaptureSaved(saved.capture_id);
        }
      }
    } catch (err) {
      setError(
        "Spec generation failed. The app could not reach the OpenCV service through its relay. Verify the local service and tunnel, then try again."
      );
    } finally {
      setFinalizing(false);
    }
  }

  return (
    <div className="resultsStack">
      <div className="panel resultCard">
        <span className="eyebrow">Step 4</span>
        <h1>Review The Measured Clip</h1>
        <p className="subtle">
          {mode === "a4"
            ? "A4 mode can produce a finalized spec directly once analysis completes."
            : "No-card mode stays advisory until key dimensions are confirmed or edited."}
        </p>
        {loading ? <p className="subtle">Running OpenCV analysis...</p> : null}
        {error ? <p className="subtle">{error}</p> : null}
        {analysis ? (
          <>
            <div className="metricStack" style={{ marginTop: 18 }}>
              <div className="metricCard">
                <strong>Clip family</strong>
                <div className="metricValue metricText">{analysis.clip_family}</div>
              </div>
              <div className="metricCard">
                <strong>Overall confidence</strong>
                <div className="metricValue">{Math.round(analysis.confidence.overall * 100)}%</div>
              </div>
              <div className="metricCard">
                <strong>Calibration</strong>
                <div className="metricValue metricText">
                  {analysis.confidence.calibrated ? "Trusted millimeter scale" : "Advisory only"}
                </div>
              </div>
            </div>
            <div className="measurementList" style={{ marginTop: 18 }}>
              {Object.entries(analysis.measurements).map(([key, measurement]) => (
                <div className="measurementRow" key={key}>
                  <div>
                    <strong>{prettifyLabel(key)}</strong>
                    <div className="subtle">Confidence {Math.round(measurement.confidence * 100)}%</div>
                  </div>
                  <div className="measurementValue">
                    {measurement.value ?? "--"} {measurement.units}
                  </div>
                </div>
              ))}
            </div>
            <div className="qualityGrid" style={{ marginTop: 18 }}>
              {analysis.quality_checks.map((check) => (
                <div className={`qualityItem ${check.status === "good" ? "good" : ""}`} key={check.key}>
                  <strong>{check.label}</strong>
                  <div className="subtle">{check.detail}</div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="panel resultCard">
        <span className="eyebrow">Generated Spec</span>
        <h1>Dual Wing Extender</h1>
        <p className="subtle">
          The first-pass extender spec is generated automatically. Use overrides only if you want to correct or tighten fit.
        </p>
        {spec ? (
          <div className="metricStack" style={{ marginTop: 18 }}>
            <div className="metricCard">
              <strong>Attachment opening</strong>
              <div className="metricValue">{spec.extender_spec.recommended_attachment_opening_mm ?? "--"} mm</div>
            </div>
            <div className="metricCard">
              <strong>Insertion depth</strong>
              <div className="metricValue">{spec.extender_spec.insertion_depth_mm ?? "--"} mm</div>
            </div>
            <div className="metricCard">
              <strong>Lever length</strong>
              <div className="metricValue">{spec.extender_spec.lever_length_mm ?? "--"} mm</div>
              <div className="subtle">{spec.extender_spec.lever_length_class} lever class</div>
            </div>
            <div className="metricCard">
              <strong>Tolerance band</strong>
              <div className="metricValue">{spec.extender_spec.tolerance_band_mm ?? "--"} mm</div>
            </div>
          </div>
        ) : null}
        <form className="fieldGrid" onSubmit={finalizeSpec} style={{ marginTop: 18 }}>
          <label>
            Wing thickness (mm)
            <input
              value={overrides.wing_thickness_mm}
              onChange={(event) => setOverrides((prev) => ({ ...prev, wing_thickness_mm: event.target.value }))}
              placeholder={mode === "a4" ? "Optional refinement" : "Recommended in no-card mode"}
            />
          </label>
          <label>
            Attachment opening (mm)
            <input
              value={overrides.attachment_opening_mm}
              onChange={(event) => setOverrides((prev) => ({ ...prev, attachment_opening_mm: event.target.value }))}
              placeholder="Optional override"
            />
          </label>
          <label>
            Insertion depth (mm)
            <input
              value={overrides.insertion_depth_mm}
              onChange={(event) => setOverrides((prev) => ({ ...prev, insertion_depth_mm: event.target.value }))}
              placeholder="Optional override"
            />
          </label>
          <div className="buttonRow">
            <button className="button accent" disabled={!analysis || finalizing}>
              {finalizing ? "Generating Spec..." : "Generate Spec"}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                clearRecord();
                window.location.href = "/";
              }}
            >
              Start Over
            </button>
          </div>
        </form>
        {spec ? (
          <>
            <div className="qualityGrid" style={{ marginTop: 18 }}>
              <div className={`qualityItem ${spec.finalized ? "good" : ""}`}>
                <strong>{spec.finalized ? "Finalized spec" : "Advisory spec"}</strong>
                <div className="subtle">{spec.summary}</div>
              </div>
              <div className={`qualityItem ${captureSaved ? "good" : ""}`}>
                <strong>{captureSaved ? "Capture saved to dataset" : "Dataset save pending"}</strong>
                <div className="subtle">
                  {captureSaved
                    ? `Stored for future hair clip training and design iteration. Record ID: ${captureSaved}`
                    : "The capture library stores images plus measurements so the lab can build a larger clip dataset over time."}
                </div>
              </div>
            </div>
            <details style={{ marginTop: 18 }}>
              <summary className="subtle" style={{ cursor: "pointer" }}>Show raw JSON spec</summary>
              <div className="specBlock" style={{ marginTop: 12 }}>
                {JSON.stringify(spec, null, 2)}
              </div>
            </details>
          </>
        ) : null}
      </div>
    </div>
  );
}
