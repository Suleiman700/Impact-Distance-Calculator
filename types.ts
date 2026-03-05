export interface TargetResult {
    index: number;
    startTime: number | null;
    endTime: number | null;
    duration: number | null;
    distance: number | null;
    heading?: number | null;
    timestamp?: number;
}
