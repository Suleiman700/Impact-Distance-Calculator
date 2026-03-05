import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Svg as SvgView, Circle, Line, Text as SvgText, G as SvgG } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, fonts } from '../theme';
import { useSettings } from '../contexts/SettingsContext';
import { TargetResult, Session } from '../types';
import { formatDistance } from '../utils/calculateDistance';

interface Props {
    results: TargetResult[];
    activeSession: Session | null;
    onDone?: () => void;
    iconOnly?: boolean; // when true shows only icon button, no label
}

// Renders a polar top-down map of targets based on their heading + distance
function TargetMiniMap({
    results,
    isDark,
}: {
    results: TargetResult[];
    isDark: boolean;
}) {
    const size = 260;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = cx - 20;

    const hasHeading = results.some(r => r.heading != null);
    const maxDist = Math.max(...results.map(r => r.distance || 0), 1);

    const bgColor = isDark ? '#1A1D24' : '#FFFFFF';
    const gridColor = isDark ? '#2A2D34' : '#E4E7EC';
    const accentColor = isDark ? '#4DA3FF' : '#2E7CF6';
    const labelColor = isDark ? '#FFFFFF80' : '#98A2B3';
    const markerColor = isDark ? '#FF6B6B' : '#F04438';
    const originColor = isDark ? '#4DA3FF' : '#2E7CF6';

    // fallback: arrange targets in a fan/arc without heading
    const getPoint = (r: TargetResult, i: number): { px: number; py: number } => {
        const distRatio = (r.distance || 0) / maxDist;
        const normalized = distRatio * maxR;

        if (hasHeading && r.heading != null) {
            const angle = (r.heading - 90) * (Math.PI / 180);
            return {
                px: cx + normalized * Math.cos(angle),
                py: cy + normalized * Math.sin(angle),
            };
        } else {
            // spread targets in a 160° arc going up from the center
            const spread = Math.min(results.length - 1, 1) === 0 ? 0 : 160;
            const startAngle = -90 - spread / 2;
            const step = results.length <= 1 ? 0 : spread / (results.length - 1);
            const angleDeg = startAngle + i * step;
            const angle = angleDeg * (Math.PI / 180);
            return {
                px: cx + normalized * Math.cos(angle),
                py: cy + normalized * Math.sin(angle),
            };
        }
    };

    const rings = [0.33, 0.66, 1.0];

    return (
        <SvgView width={size} height={size}>
            {/* Background */}
            <Circle cx={cx} cy={cy} r={maxR + 10} fill={bgColor} />

            {/* Grid rings */}
            {rings.map((r, i) => (
                <Circle key={i} cx={cx} cy={cy} r={r * maxR} fill="none" stroke={gridColor} strokeWidth={1} strokeDasharray="4 3" />
            ))}

            {/* Cardinal lines if heading data available */}
            {hasHeading && (
                <>
                    <Line x1={cx} y1={cy - maxR} x2={cx} y2={cy + maxR} stroke={gridColor} strokeWidth={1} />
                    <Line x1={cx - maxR} y1={cy} x2={cx + maxR} y2={cy} stroke={gridColor} strokeWidth={1} />
                    <SvgText x={cx} y={cy - maxR - 4} textAnchor="middle" fill={labelColor} fontSize={9}>N</SvgText>
                </>
            )}

            {/* Lines from origin to each target */}
            {results.map((r, i) => {
                const { px, py } = getPoint(r, i);
                return (
                    <Line key={`line-${i}`} x1={cx} y1={cy} x2={px} y2={py}
                        stroke={markerColor} strokeWidth={1} opacity={0.4} />
                );
            })}

            {/* Target markers */}
            {results.map((r, i) => {
                const { px, py } = getPoint(r, i);
                return (
                    <SvgG key={`marker-${i}`}>
                        <Circle cx={px} cy={py} r={8} fill={markerColor} opacity={0.9} />
                        <SvgText x={px} y={py + 1} textAnchor="middle" dominantBaseline="middle"
                            fill="#FFFFFF" fontSize={8} fontWeight="bold">
                            {r.index + 1}
                        </SvgText>
                    </SvgG>
                );
            })}

            {/* Observer (you) */}
            <Circle cx={cx} cy={cy} r={6} fill={originColor} />
            <Circle cx={cx} cy={cy} r={10} fill="none" stroke={originColor} strokeWidth={1.5} opacity={0.4} />
        </SvgView>
    );
}

export default function ShareSummaryCard({ results, activeSession, onDone, iconOnly = false }: Props) {
    const { colors, settings } = useSettings();
    const viewRef = useRef<View>(null);
    const isDark = settings.theme === 'dark';

    const captureAndShare = async () => {
        try {
            if (!viewRef.current) return;

            const uri = await captureRef(viewRef, { format: 'png', quality: 0.95 });

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share Impact Summary',
                });
            } else {
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status === 'granted') {
                    await MediaLibrary.saveToLibraryAsync(uri);
                    Alert.alert('Saved', 'Summary image saved to your photo library.');
                } else {
                    Alert.alert('Sharing not available', 'Unable to share on this device.');
                }
            }

            onDone?.();
        } catch (e) {
            console.error('Share failed:', e);
            Alert.alert('Error', 'Failed to capture the summary image.');
        }
    };

    const totalTargets = results.length;
    const avgDist = totalTargets > 0
        ? results.reduce((sum, r) => sum + (r.distance || 0), 0) / totalTargets
        : 0;
    const maxDist = totalTargets > 0
        ? Math.max(...results.map(r => r.distance || 0))
        : 0;
    const sessionName = activeSession?.name;

    // Colors for the card visual (hardcoded for consistent capture)
    const cardBg = isDark ? '#0F1115' : '#F2F4F7';
    const cardBorder = isDark ? '#2A2D34' : '#E4E7EC';
    const textBright = isDark ? '#FFFFFF' : '#101828';
    const textMuted = isDark ? '#FFFFFF80' : '#98A2B3';
    const accentColor = isDark ? '#4DA3FF' : '#2E7CF6';
    const dangerColor = isDark ? '#FF6B6B' : '#F04438';

    return (
        <>
            {/* Hidden capture card rendered off-screen */}
            <View
                ref={viewRef}
                style={[styles.captureContainer, { backgroundColor: cardBg }]}
                collapsable={false}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <Text style={[styles.cardAppName, { color: textMuted }]}>Impact Distance</Text>
                    <Text style={[styles.cardTitle, { color: textBright }]}>{sessionName ?? 'Summary'}</Text>
                    <Text style={[styles.cardDate, { color: textMuted }]}>
                        {new Date().toLocaleString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })}
                    </Text>
                </View>

                {/* Map visualization */}
                {totalTargets > 0 && (
                    <View style={[styles.mapContainer, { borderColor: cardBorder }]}>
                        <TargetMiniMap results={results} isDark={isDark} />
                    </View>
                )}

                {/* Stats Row */}
                <View style={[styles.statsRow, { borderColor: cardBorder }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: accentColor }]}>{totalTargets}</Text>
                        <Text style={[styles.statLabel, { color: textMuted }]}>Targets</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: cardBorder }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: accentColor }]}>{formatDistance(avgDist, settings.unit)}</Text>
                        <Text style={[styles.statLabel, { color: textMuted }]}>Avg Distance</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: cardBorder }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: dangerColor }]}>{formatDistance(maxDist, settings.unit)}</Text>
                        <Text style={[styles.statLabel, { color: textMuted }]}>Max Distance</Text>
                    </View>
                </View>

                {/* Records */}
                {results.slice(0, 8).map((r, i) => (
                    <View
                        key={r.timestamp || i}
                        style={[
                            styles.recordRow,
                            {
                                borderBottomColor: cardBorder,
                                borderBottomWidth: i < results.length - 1 ? 1 : 0,
                            }
                        ]}
                    >
                        <View style={[styles.indexBadge, { backgroundColor: accentColor + '22' }]}>
                            <Text style={[styles.indexText, { color: accentColor }]}>T{r.index + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.recordDist, { color: textBright }]}>
                                {formatDistance(r.distance, settings.unit)}
                            </Text>
                            <Text style={[styles.recordMeta, { color: textMuted }]}>
                                {r.duration?.toFixed(3)}s
                                {r.heading != null ? ` • ${Math.round(r.heading)}°` : ''}
                            </Text>
                        </View>
                        <Text style={[styles.recordTime, { color: textMuted }]}>
                            {new Date(r.timestamp || 0).toLocaleTimeString('en-GB', {
                                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                            })}
                        </Text>
                    </View>
                ))}

                {results.length > 8 && (
                    <Text style={[styles.moreText, { color: textMuted }]}>+{results.length - 8} more records</Text>
                )}

                {/* Footer */}
                <View style={[styles.cardFooter, { borderTopColor: cardBorder + '80' }]}>
                    <Text style={[styles.footerText, { color: textMuted }]}>Generated by Impact Distance App</Text>
                </View>
            </View>

            {/* Trigger button */}
            <TouchableOpacity
                onPress={captureAndShare}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.6}
                style={{ flexDirection: 'row', alignItems: 'center' }}
            >
                <Ionicons name="share-outline" size={iconOnly ? 18 : 16} color={colors.accent} style={iconOnly ? undefined : { marginRight: 4 }} />
                {!iconOnly && (
                    <Text style={[styles.shareLabel, { color: colors.accent }]}>Share</Text>
                )}
            </TouchableOpacity>
        </>
    );
}

const styles = StyleSheet.create({
    captureContainer: {
        position: 'absolute',
        left: -9999,
        top: 0,
        width: 360,
        padding: spacing.lg,
        borderRadius: radius.xl,
    },
    cardHeader: { marginBottom: spacing.md },
    cardAppName: {
        fontSize: 11,
        ...fonts.medium,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    cardTitle: { fontSize: 26, ...fonts.bold, marginBottom: 4 },
    cardDate: { fontSize: 12 },
    mapContainer: {
        borderRadius: radius.md,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: spacing.md,
        alignSelf: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: radius.md,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    statItem: { flex: 1, padding: spacing.md, alignItems: 'center' },
    statDivider: { width: 1 },
    statValue: { fontSize: 18, ...fonts.bold },
    statLabel: { fontSize: 11, marginTop: 2 },
    recordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm + 2,
        gap: spacing.sm,
    },
    indexBadge: {
        width: 32,
        height: 32,
        borderRadius: radius.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    indexText: { fontSize: 12, ...fonts.bold },
    recordDist: { fontSize: 15, ...fonts.semiBold },
    recordMeta: { fontSize: 11, marginTop: 1 },
    recordTime: { fontSize: 11 },
    moreText: { fontSize: 12, textAlign: 'center', paddingVertical: spacing.sm },
    cardFooter: {
        marginTop: spacing.lg,
        borderTopWidth: 1,
        paddingTop: spacing.sm,
    },
    footerText: { fontSize: 10, textAlign: 'center' },
    shareLabel: { fontSize: 14, ...fonts.medium },
});
