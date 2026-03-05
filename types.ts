export interface TargetResult {
    index: number;
    startTime: number | null;
    endTime: number | null;
    duration: number | null;
    distance: number;
    heading?: number | null; // Compass heading in degrees (0-360)
    tilt?: number | null; // Pitch angle in degrees for tracking 3D tilt
    timestamp: number;
}
