import { useEffect, useState, useSyncExternalStore } from "react";
import { VisionSession } from "./vision-session";

export function useVisionSession() {
  const [session] = useState((): VisionSession => new VisionSession());
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
  useEffect((): (() => void) => (): void => session.dispose(), [session]);
  return { ...state, load: session.load, prepare: session.prepare, analyze: session.analyze, scan: session.scan, cancel: session.cancel };
}
