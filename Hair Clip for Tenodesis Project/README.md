# Hair Clip for Tenodesis Project

This project is a phone-first capture and measurement tool for claw clips and similar hair clips. A user opens the web app on a phone, takes two guided photos of a clip, and the system estimates the clip geometry needed for a detachable dual-wing extender concept. The app also saves each capture into a local database so the lab can steadily build a larger library of hair clips over time.

## Why This Exists

People who rely on tenodesis grasp can have trouble actuating standard claw clips because the clip wings are short and hard to grasp. The short-term goal is to prototype detachable lever extenders that make the clip easier to open. The longer-term goal is to collect enough real clip examples that we can improve measurement quality, cluster common clip families, and eventually work toward more universal attachment designs.

## Project Progression

This project now has a clear staged progression instead of trying to solve everything at once.

1. `Physical concept`
Start by proving that an assistive opening mechanism is plausible. Right now the working idea is a ratcheting clamshell-style concept that increases leverage and remains detachable.

2. `Attachment interface problem`
The next challenge is the clip-facing side of the device. Different claw clips vary in wing shape, spacing, thickness, and curvature, so the difficult question is how to mold or shape the attachment side so it stays on across many clips.

3. `Hair clip library`
Because of that variability, we need a growing library of real clip examples and dimensions. The capture app supports this by saving top and side images plus measurements and generated specs into a local database.

4. `Design generalization`
Once enough clips are collected, the library can guide whether the best path is:
- a universal attachment
- a small family of semi-universal attachments
- or a more adaptive future workflow

5. `Future modeling and fabrication`
Later, the saved dataset can support ML-assisted fitting, mesh-informed workflows, or compliant-material attachment ideas once the mechanical concept is stronger.

## What The Current App Does

- runs a guided two-photo capture flow on a phone
- supports:
  - `A4 calibration mode` for scale-aware measurement
  - `No-card mode` for advisory-only estimation
- sends captures to a local `FastAPI + OpenCV` analysis service
- estimates clip dimensions relevant to a detachable dual-wing extender
- generates a first-pass extender spec
- saves the top image, side image, analysis result, and spec into a local SQLite-backed dataset

## Database Storage

The capture database is already hooked up in the current app flow.

- when a user reaches the measured/spec result flow, the frontend sends the capture to `/api/captures`
- the local FastAPI service writes the record into:
  - `hairclip-capture-spec/analysis_api/data/captures.db`
  - `hairclip-capture-spec/analysis_api/data/captures/`
- each record stores:
  - top image path
  - side image path
  - capture mode
  - clip family
  - analysis JSON
  - generated spec JSON

This means the project is already set up to accumulate a reusable hair clip dataset instead of only producing one-off measurements.

## Why The Dataset Matters

The database is one of the main outputs of this project. Each saved capture can later support:

- better OpenCV tuning across more clip shapes
- training an ML model to recognize clip families and predict fit parameters
- comparing which extender recommendations worked well or failed
- exploring whether a smaller set of semi-universal attachment families is realistic
- future mesh-informed or compliant-material workflows once fabrication research is further along

## Current Structure

- `hairclip-capture-spec/`
  - Next.js phone UI
  - Vercel relay routes
  - Onshape JSON export path
  - local FastAPI/OpenCV backend
  - SQLite-backed capture dataset
- `project-brief.txt`
  - the original hackathon problem statement

## Current Limits

- measurements are first-pass estimates, not precision reverse engineering
- no CAD or STL generation yet
- the current spec is only for a `dual-wing-extender` family
- the capture database is local for now, not yet a shared cloud dataset

## Seeing The Object In 3D

Not fully yet, but there is a realistic path.

- `Current state`
The app measures and stores dimensions, but it does not yet generate a true 3D model of the clip or the attachment automatically.

- `Near-term path`
Use the measured geometry and generated spec as parameters for a CAD tool like:
  - Onshape
  - Blender
  - OpenSCAD
  - CadQuery

- `Most realistic next step`
Generate a simple parametric attachment model from the saved spec values, then preview or refine that model in Onshape, Blender, or another 3D viewer.

- `Current repo support`
The app now includes:
  - an `Onshape JSON` export from the results screen
  - a starter FeatureScript at `hairclip-capture-spec/cad/onshape/dual_wing_extender.fs`
  - a setup note at `hairclip-capture-spec/cad/onshape/README.md`

- `Later option`
If the image library becomes large enough, the project could explore multi-view reconstruction, mesh-assisted fitting, or ML-supported adaptation, but that should come after the basic mechanical attachment concept is validated.

## Next Good Steps

- collect a larger set of clip examples under consistent capture conditions
- build at least one low-fidelity physical prototype of the ratcheting clamshell or related lever concept
- add manual labeling for known clip dimensions and fit outcomes
- compare extender fit across multiple clip families
- connect saved dimensions to a parametric 3D attachment generator for preview in a rendering tool
- connect saved examples to later ML or mesh-based adaptation work
