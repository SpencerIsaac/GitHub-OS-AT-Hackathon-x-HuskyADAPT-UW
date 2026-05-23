# Onshape CAD Starter

This folder contains a starter path for rebuilding the generated dual-wing extender in Onshape.

## What Is Here

- `dual_wing_extender.fs`
  - starter FeatureScript scaffold for a detachable dual-wing extender
- app-side JSON export
  - generated from the capture app results screen
  - intended to provide a clean parameter set for Onshape modeling

## Recommended Workflow

1. Run the capture app and reach the generated spec screen.
2. Download the `Onshape JSON` export.
3. Open Onshape and create a new Feature Studio.
4. Paste in `dual_wing_extender.fs`.
5. Use the exported values to populate the feature parameters.
6. Regenerate the model and refine clamp fit as needed.

## Why This Is A Starter

The current capture pipeline estimates dimensions and outputs a first-pass attachment spec, but it does not yet create a direct Onshape API integration. This setup keeps the handoff simple:

- the app generates structured dimensions
- FeatureScript provides a repeatable CAD template
- the designer still reviews fit and usability before fabrication

## Suggested Next Step

If this workflow proves useful, the next iteration should parse the JSON into a more direct CAD parameter form or mirror the same geometry in a scriptable CAD tool such as CadQuery or OpenSCAD.
