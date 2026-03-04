import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, fonts } from '../theme';
import { TargetResult } from '../types';
import { formatDistance } from '../utils/calculateDistance';
import { useSettings } from '../contexts/SettingsContext';

interface Props {
    results: TargetResult[];
    onOpenMap: (result: TargetResult) => void;
}

export default function ResultCard({ results, onOpenMap }: Props) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const { settings } = useSettings();

    const completedResults = results.filter((r) => r.distance !== null);

    useEffect(() => {
        if (completedResults.length > 0) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [completedResults.length]);

    if (completedResults.length === 0) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
        >
            <Text style={styles.title}>Results</Text>

            {completedResults.map((r) => (
                <View key={r.index} style={styles.row}>
                    <View style={styles.rowLeft}>
                        <Text style={styles.targetName}>Target {r.index + 1}</Text>
                        <Text style={styles.time}>{r.duration?.toFixed(3)}s</Text>
                    </View>
                    <View style={styles.rowRight}>
                        <Text style={styles.distance}>
                            {r.distance !== null ? formatDistance(r.distance, settings.unit) : '--'}
                        </Text>
                        <TouchableOpacity
                            style={styles.mapButton}
                            onPress={() => onOpenMap(r)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.mapButtonText}>🗺 Map</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        padding: spacing.lg,
        marginTop: spacing.lg,
    },
    title: {
        color: colors.textBright,
        fontSize: 20,
        ...fonts.bold,
        marginBottom: spacing.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
    },
    rowLeft: {
        flex: 1,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    targetName: {
        color: colors.text,
        fontSize: 14,
        ...fonts.medium,
    },
    time: {
        color: colors.textMuted,
        fontSize: 13,
        marginTop: 2,
    },
    distance: {
        color: colors.accent,
        fontSize: 18,
        ...fonts.bold,
    },
    mapButton: {
        backgroundColor: colors.accentDim,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: radius.sm,
    },
    mapButtonText: {
        color: colors.accent,
        fontSize: 13,
        ...fonts.semiBold,
    },
});
