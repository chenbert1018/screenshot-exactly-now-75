import { Capacitor, registerPlugin } from "@capacitor/core";

type SubjectCutoutResult = { imageData?: string };

interface SubjectCutoutPlugin {
  createCutout(options: { imageData: string }): Promise<SubjectCutoutResult>;
}

const SubjectCutout = registerPlugin<SubjectCutoutPlugin>("SubjectCutout");

export function isNativeSubjectCutoutAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

export function createNativeSubjectCutout(imageData: string): Promise<SubjectCutoutResult> {
  return SubjectCutout.createCutout({ imageData });
}
