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
