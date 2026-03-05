export interface TargetResult {
    index: number;
    startTime: number | null;
    endTime: number | null;
    duration: number | null;
    distance: number;
    heading?: number | null; // Compass heading in degrees (0-360)
    tilt?: number | null; // Pitch angle in degrees for tracking 3D tilt
    timestamp: number;
    latitude?: number | null;
    longitude?: number | null;
    sessionId?: string; // Which session this result belongs to
}

export interface Session {
    id: string;
    name: string;
    createdAt: number;
    endedAt?: number | null;
}
