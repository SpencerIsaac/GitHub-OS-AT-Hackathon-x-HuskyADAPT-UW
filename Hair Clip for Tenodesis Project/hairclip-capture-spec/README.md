# Hair Clip Capture-to-Spec System

Phone-testable capture and analysis workflow for generating a detachable dual-wing-extender device spec for hair clips used with tenodesis-oriented assistive concepts.

The system is also meant to build a reusable clip dataset over time. Every saved capture can become another example for future measurement tuning, ML-assisted clip classification, and universal-attachment research.

## What This Includes

- `Next.js` frontend designed to deploy on Vercel and open on a phone
- `FastAPI + OpenCV` local analysis service for lab machines
- local capture persistence into a SQLite-backed dataset library
- guided two-photo capture flow:
  - top view
  - side view
- two capture modes:
  - `A4 calibration mode` for trusted millimeter-scale specs
  - `No-card mode` for advisory-only measurement estimates
- structured device spec output in JSON plus a readable summary
- saved capture records containing the source photos, analysis result, and generated spec
- research notes for the VTP foam workstream

## App Structure

```text
app/                  Next.js pages and routes
components/           UI for guided capture, review, and results
lib/                  Shared browser-side types, storage, and config
analysis_api/         Local FastAPI/OpenCV service
analysis_api/data/    Saved clip captures and SQLite dataset
research/             Foam/VTP research notes and follow-up plan
```

## Frontend Routes

- `/` mode selection
- `/capture/top`
- `/capture/side`
- `/review`
- `/results`

## Quick Start

### 1. Install frontend dependencies

```bash
npm install
npm run dev
```

The frontend will run at `http://localhost:3000`.

### 2. Run the local analysis API

```bash
cd analysis_api
./run_api.sh
```

### 3. Configure the frontend API target

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_ANALYSIS_API_BASE=http://127.0.0.1:8000
```

For phone testing with Vercel, point this variable at your tunneled local API URL.

## Phone Testing on Vercel

### Local machine

Start the analysis service:

```bash
cd analysis_api
./run_api.sh
```

Expose the API publicly during development:

```bash
npm run tunnel:api
```

This will print a public HTTPS URL such as:

```text
https://example-subdomain.loca.lt
```

### Vercel frontend

1. Deploy the frontend to Vercel:

```bash
npm run vercel:deploy
```

2. In the Vercel project settings, set:

```text
NEXT_PUBLIC_ANALYSIS_API_BASE=https://your-public-api-url
```

3. Redeploy the frontend after updating the environment variable.
4. Open the Vercel app on a phone and run the guided capture flow.

### Optional local-Vercel parity

If you want to test with Vercel's local runtime behavior on the lab machine:

```bash
npm run vercel:dev
```

## Wiring Status

- Frontend deploy path prepared for Vercel
- Local analysis API runner added
- API tunnel command added
- Environment variable wiring documented
- Phone flow ready once Vercel auth and tunnel URL are configured

## Capture Workflow

### A4 calibration mode

- Requires two photos.
- Expects the full A4 card in the top view.
- Can produce a finalized spec directly.

### No-card mode

- Uses the same two-photo flow.
- Produces advisory measurements only.
- Requires confirmation or manual overrides before trusted use.

## Current Spec Output

The spec generator currently targets one family only:

- `dual-wing-extenders`

The output includes:

- clip family
- measurement set
- warnings and confidence
- manual overrides
- recommended attachment opening
- insertion depth
- tolerance/compliance band
- lever length class and suggested lever length

## Dataset Goal

The app can save each capture into a local database so the lab can build a larger library of:

- top and side clip images
- capture mode metadata
- first-pass measured geometry
- generated extender recommendations

That dataset can later support:

- better OpenCV heuristics
- ML models for clip-family classification and parameter prediction
- tracking which extender geometries actually worked
- future universal or mesh-informed attachment exploration

## Known Limits

- This is a first-pass CV pipeline, not precision reverse engineering.
- No-card mode is intentionally lower confidence.
- The app ends at a structured device spec; it does not yet generate CAD or STL files.
- The current OpenCV heuristics are tuned for practical prototyping, not clinical or manufacturing validation.
