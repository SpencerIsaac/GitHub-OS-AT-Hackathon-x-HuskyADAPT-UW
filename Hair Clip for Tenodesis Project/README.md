# Hair Clip for Tenodesis Project

This project is a phone-first capture and measurement tool for claw clips and similar hair clips. A user opens the web app on a phone, takes two guided photos of a clip, and the system estimates the clip geometry needed for a detachable dual-wing extender concept. The app also saves each capture into a local database so the lab can steadily build a larger library of hair clips over time.

## Why This Exists

People who rely on tenodesis grasp can have trouble actuating standard claw clips because the clip wings are short and hard to grasp. The short-term goal is to prototype detachable lever extenders that make the clip easier to open. The longer-term goal is to collect enough real clip examples that we can improve measurement quality, cluster common clip families, and eventually work toward more universal attachment designs.

## What The Current App Does

- runs a guided two-photo capture flow on a phone
- supports:
  - `A4 calibration mode` for scale-aware measurement
  - `No-card mode` for advisory-only estimation
- sends captures to a local `FastAPI + OpenCV` analysis service
- estimates clip dimensions relevant to a detachable dual-wing extender
- generates a first-pass extender spec
- saves the top image, side image, analysis result, and spec into a local SQLite-backed dataset

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
  - local FastAPI/OpenCV backend
  - SQLite-backed capture dataset
- `project-brief.txt`
  - the original hackathon problem statement

## Current Limits

- measurements are first-pass estimates, not precision reverse engineering
- no CAD or STL generation yet
- the current spec is only for a `dual-wing-extender` family
- the capture database is local for now, not yet a shared cloud dataset

## Next Good Steps

- collect a larger set of clip examples under consistent capture conditions
- add manual labeling for known clip dimensions and fit outcomes
- compare extender fit across multiple clip families
- connect saved examples to later ML or mesh-based adaptation work
