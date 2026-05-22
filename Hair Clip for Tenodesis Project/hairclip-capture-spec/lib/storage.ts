import { AnalysisResult, CaptureMode, CaptureStep, SpecResponse } from "./types";

const PREFIX = "hairclip-capture";

export type CaptureRecord = {
  mode: CaptureMode;
  topImage?: string;
  sideImage?: string;
  analysis?: AnalysisResult;
  spec?: SpecResponse;
};

function key(name: string) {
  return `${PREFIX}:${name}`;
}

export function loadRecord(): CaptureRecord {
  if (typeof window === "undefined") {
    return { mode: "a4" };
  }

  const raw = window.localStorage.getItem(key("record"));
  if (!raw) {
    return { mode: "a4" };
  }

  try {
    return JSON.parse(raw) as CaptureRecord;
  } catch {
    return { mode: "a4" };
  }
}

export function saveRecord(record: CaptureRecord) {
  window.localStorage.setItem(key("record"), JSON.stringify(record));
}

export function clearRecord() {
  window.localStorage.removeItem(key("record"));
}

export function saveImage(step: CaptureStep, image: string, mode: CaptureMode) {
  const record = loadRecord();
  const next = { ...record, mode };
  if (step === "top") {
    next.topImage = image;
  } else {
    next.sideImage = image;
  }
  saveRecord(next);
}
