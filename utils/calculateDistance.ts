/**
 * Speed of sound at sea level (~20°C) in meters per second.
 */
const SPEED_OF_SOUND = 343;

/**
 * Calculate distance in meters from time difference.
 */
export function calcDistance(seconds: number): number {
    return seconds * SPEED_OF_SOUND;
}

/**
 * Convert meters to kilometers.
 */
export function toKm(meters: number): number {
    return meters / 1000;
}

/**
 * Convert meters to miles.
 */
export function toMiles(meters: number): number {
    return meters / 1609.34;
}

/**
 * Format distance with unit label.
 */
export function formatDistance(meters: number, unit: 'km' | 'mile'): string {
    if (unit === 'km') {
        return `${toKm(meters).toFixed(2)} km`;
    }
    return `${toMiles(meters).toFixed(2)} mi`;
}

/**
 * Calculate destination coordinate based on start point, distance(m), and bearing(degrees).
 */
export function getDestinationPoint(
    lat: number,
    lon: number,
    distance: number,
    bearing: number
): { latitude: number; longitude: number } {
    const R = 6371000; // Earth's radius in meters
    const brng = (bearing * Math.PI) / 180;
    const φ1 = (lat * Math.PI) / 180;
    const λ1 = (lon * Math.PI) / 180;

    const φ2 = Math.asin(
        Math.sin(φ1) * Math.cos(distance / R) +
        Math.cos(φ1) * Math.sin(distance / R) * Math.cos(brng)
    );
    const λ2 = λ1 + Math.atan2(
        Math.sin(brng) * Math.sin(distance / R) * Math.cos(φ1),
        Math.cos(distance / R) - Math.sin(φ1) * Math.sin(φ2)
    );

    return {
        latitude: (φ2 * 180) / Math.PI,
        longitude: (λ2 * 180) / Math.PI,
    };
}