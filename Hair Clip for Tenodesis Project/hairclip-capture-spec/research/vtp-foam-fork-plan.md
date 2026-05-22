# VTP Foam Research Fork Plan

## Confirmed Public Repo

- `TransformativeRoboticsLab/vtp-foam-durability`

## Purpose in This Project

This workstream is separate from the runtime capture-to-spec app. Its job is to understand how graded or compliant material ideas could eventually support:

- a soft inner grip against the clip wing
- a stiffer outer lever arm for improved tenodesis-oriented actuation

## Current Assessment

The confirmed public repo appears to be primarily:

- durability data
- analysis code
- foam behavior evaluation

It does **not** yet appear to be the full VTP slicer/plugin pipeline needed to directly generate fabrication toolpaths for this project.

## What Is In The Cloned Repo

The cloned workspace copy currently includes:

- `README.md`
- `abstract.txt`
- `src/main.py`
- `src/data_prep.py`
- `src/foam_compression.py`
- `src/audio_foam.py`
- multiple CSV data files under `src/`

That reinforces the current interpretation that this repo is useful for material-behavior research, but not yet the missing Prusa/VTP path conversion layer.

## Missing / Blocked

- The GitHub org page lists `VTP_Prusa_Plugin` as:
  - `A tool to convert PrusaSlicer output to VTP`
- That repository could not be directly resolved during earlier verification, so it is currently treated as:
  - renamed
  - private
  - or stale-listed

## Suggested Next Steps

1. Fork `vtp-foam-durability` for inspection and documentation.
2. Catalog what parts are reusable for graded-stiffness reasoning versus durability-only analysis.
3. Treat `VTP_Prusa_Plugin` as a follow-up blocker for actual VTP fabrication integration.
4. Keep the app spec output generic enough to later map into:
   - rigid prototype path
   - compliant insert path
   - graded-stiffness foam path

## Mapping from App Spec to Later Fabrication

Potential downstream inputs from the app:

- `recommended_attachment_opening_mm`
- `insertion_depth_mm`
- `tolerance_band_mm`
- `lever_length_mm`
- `clip_family`

Potential downstream fabrication interpretation:

- inner grip stiffness target
- outer lever stiffness target
- transition length between grip and lever
- material/process choice
