import { ModeCard } from "@/components/mode-card";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="heroStack">
        <div className="panel heroCard heroBanner">
          <span className="eyebrow">Hair Clip Capture-to-Spec</span>
          <h1>Capture the clip. Confirm the fit. Leave with a usable extender spec.</h1>
          <p className="subtle heroLead">
            This flow is designed for a phone in hand, not a dashboard on a monitor. You move through one
            decision at a time: pick the capture mode, take a top photo, take a side photo, review quality,
            and generate a dual-wing-extender spec.
          </p>
          <div className="buttonRow" style={{ marginTop: 20 }}>
            <a className="button accent" href="#modes">
              Start Guided Capture
            </a>
          </div>
        </div>

        <div className="processStrip">
          <div className="processStep">
            <span>01</span>
            <strong>Choose capture mode</strong>
            <p>Start by deciding whether you have an A4 sheet available for scale.</p>
          </div>
          <div className="processStep">
            <span>02</span>
            <strong>Take the top photo</strong>
            <p>Use the vertical guide to capture the whole claw clip and its spacing.</p>
          </div>
          <div className="processStep">
            <span>03</span>
            <strong>Take the side photo</strong>
            <p>Keep the same vertical framing so the app can estimate thickness and seating depth.</p>
          </div>
          <div className="processStep">
            <span>04</span>
            <strong>Review and confirm spec</strong>
            <p>Check the generated dimensions, then adjust only if you already know a better fit value.</p>
          </div>
        </div>
      </section>

      <section id="modes" className="modeSection">
        <div className="sectionIntro">
          <span className="eyebrow">Choose a path</span>
          <h2>Pick the capture mode that matches what you have on the table.</h2>
          <p className="subtle">
            Both modes guide the same two-photo workflow. The difference is whether the system can trust scale
            enough to finalize the spec directly.
          </p>
        </div>
        <div className="modeStack">
          <ModeCard
            mode="a4"
            title="A4 Calibration Mode"
            badge="Primary workflow"
            description="Use an A4 sheet to recover scale, rectify perspective, and allow a finalized parametric spec."
            bullets={[
              "Exactly two photos: top and side",
              "Final spec can be produced directly",
              "Best for repeatable lab measurements"
            ]}
          />
          <ModeCard
            mode="no-card"
            title="No-Card Advisory Mode"
            badge="Flexible fallback"
            description="Use when a printed calibration card is unavailable. The app provides advisory measurements and requires confirmation."
            bullets={[
              "Still uses top and side photos",
              "Measurements are lower confidence",
              "Manual confirmation required before finalization"
            ]}
          />
        </div>
      </section>
    </main>
  );
}
