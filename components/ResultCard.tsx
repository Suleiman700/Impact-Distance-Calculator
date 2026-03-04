import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { spacing, radius, fonts } from '../theme';
import { TargetResult } from '../types';
import { formatDistance } from '../utils/calculateDistance';
import { useSettings } from '../contexts/SettingsContext';

interface Props {
    results: TargetResult[];
    onOpenMap: (result: TargetResult) => void;
    onClear: () => void;
}

export default function ResultCard({ results, onOpenMap, onClear }: Props) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { settings, colors } = useSettings();

    useEffect(() => {
        if (results.length > 0) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }
    }, [results.length]);

    if (results.length === 0) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    opacity: fadeAnim,
                },
            ]}
        >
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.title, { color: colors.textBright }]}>History</Text>
                    <View style={[styles.countBadge, { backgroundColor: colors.accentDim }]}>
                        <Text style={[styles.countText, { color: colors.accent }]}>{results.length}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={onClear}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.6}
                >
                    <Text style={[styles.clearText, { color: colors.textMuted }]}>Clear all</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.scrollWrapper}>
                <ScrollView
                    style={styles.scrollArea}
                    contentContainerStyle={styles.scrollContent}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    persistentScrollbar={true}
                >
                    {results.map((r, i) => (
                        <View
                            key={r.timestamp || i}
                            style={[
                                styles.row,
                                { borderBottomColor: colors.cardBorder },
                                i === results.length - 1 && { borderBottomWidth: 0 }
                            ]}
                        >
                            <View style={styles.rowLeft}>
                                <Text style={[styles.targetName, { color: colors.textBright }]}>
                                    Target {r.index + 1}
                                </Text>
                                <View style={styles.statsRow}>
                                    <Text style={[styles.timeLabel, { color: colors.textMuted }]}>
                                        {new Date(r.timestamp || 0).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                                    </Text>
                                    <Text style={[styles.separator, { color: colors.textMuted }]}> • </Text>
                                    <Text style={[styles.duration, { color: colors.textMuted }]}>
                                        {r.duration?.toFixed(3)}s
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.rowRight}>
                                <Text style={[styles.distance, { color: colors.accent }]}>
                                    {r.distance !== null ? formatDistance(r.distance, settings.unit) : '--'}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.mapButton, { backgroundColor: colors.accentDim }]}
                                    onPress={() => onOpenMap(r)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.mapButtonText, { color: colors.accent }]}>🗺 Map</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: radius.lg,
        borderWidth: 1,
        paddingTop: spacing.lg,
        paddingHorizontal: spacing.lg,
        marginTop: spacing.md,
        // Ensure the container itself can constrain the height if needed
        maxHeight: 400,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    title: {
        fontSize: 20,
        ...fonts.bold,
    },
    countBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.sm,
    },
    countText: {
        fontSize: 12,
        ...fonts.bold,
    },
    clearText: {
        fontSize: 14,
        ...fonts.medium,
    },
    scrollWrapper: {
        // This wrapper helps enforce the scroll behavior on Android
        flexShrink: 1,
        marginBottom: spacing.sm,
    },
    scrollArea: {
        // maxHeight is key, but let's make it more substantial
        maxHeight: 320,
    },
    scrollContent: {
        paddingBottom: spacing.sm,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
    },
    rowLeft: {
        flex: 1,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    separator: {
        fontSize: 12,
        opacity: 0.6,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    targetName: {
        fontSize: 14,
        ...fonts.semiBold,
    },
    timeLabel: {
        fontSize: 11,
    },
    duration: {
        fontSize: 11,
        ...fonts.regular,
    },
    distance: {
        fontSize: 17,
        ...fonts.bold,
    },
    mapButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: radius.sm,
    },
    mapButtonText: {
        fontSize: 13,
        ...fonts.semiBold,
    },
});
