import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    SafeAreaView,
} from 'react-native';
import * as Location from 'expo-location';
import { colors, spacing, radius, fonts } from '../theme';
import { useSettings } from '../contexts/SettingsContext';
import { calcDistance } from '../utils/calculateDistance';
import { TargetResult } from '../types';
import TargetButton from '../components/TargetButton';
import ResultCard from '../components/ResultCard';
import MapDrawer from '../components/MapDrawer';

type TargetState = 'idle' | 'recording' | 'completed';

interface TargetData {
    state: TargetState;
    result: TargetResult;
}

function createInitialTargets(count: number): TargetData[] {
    return Array.from({ length: count }, (_, i) => ({
        state: 'idle' as TargetState,
        result: {
            index: i,
            startTime: null,
            endTime: null,
            duration: null,
            distance: null,
        },
    }));
}

export default function HomeScreen({ navigation }: any) {
    const { settings } = useSettings();
    const [targets, setTargets] = useState<TargetData[]>(
        createInitialTargets(settings.targetCount)
    );
    const [userLocation, setUserLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [mapVisible, setMapVisible] = useState(false);
    const [mapDistance, setMapDistance] = useState(0);

    // Reset targets when target count changes
    useEffect(() => {
        setTargets(createInitialTargets(settings.targetCount));
    }, [settings.targetCount]);

    // Get GPS location
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                setUserLocation({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                });
            }
        })();
    }, []);

    const handleTargetPress = useCallback((index: number) => {
        setTargets((prev) => {
            const updated = [...prev];
            const target = { ...updated[index] };
            const result = { ...target.result };

            if (target.state === 'idle') {
                // First tap: start recording
                result.startTime = Date.now();
                target.state = 'recording';
            } else if (target.state === 'recording') {
                // Second tap: stop recording & calculate
                result.endTime = Date.now();
                result.duration = (result.endTime - (result.startTime || 0)) / 1000;
                result.distance = calcDistance(result.duration);
                target.state = 'completed';
            }

            target.result = result;
            updated[index] = target;
            return updated;
        });
    }, []);

    const handleReset = () => {
        setTargets(createInitialTargets(settings.targetCount));
    };

    const handleOpenMap = (result: TargetResult) => {
        if (result.distance) {
            setMapDistance(result.distance);
            setMapVisible(true);
        }
    };

    const completedResults = targets
        .map((t) => t.result)
        .filter((r) => r.distance !== null);

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Impact Distance</Text>
                        <Text style={styles.subtitle}>Tap on flash, then on sound</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => navigation.navigate('Settings')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.settingsIcon}>⚙️</Text>
                    </TouchableOpacity>
                </View>

                {/* Target Count Badge */}
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {settings.targetCount} Target{settings.targetCount > 1 ? 's' : ''}
                    </Text>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Target Buttons */}
                    {targets.map((target, i) => (
                        <TargetButton
                            key={i}
                            index={i}
                            state={target.state}
                            duration={target.result.duration}
                            onPress={() => handleTargetPress(i)}
                        />
                    ))}

                    {/* Results */}
                    <ResultCard results={targets.map((t) => t.result)} onOpenMap={handleOpenMap} />

                    {/* Reset Button */}
                    {completedResults.length > 0 && (
                        <TouchableOpacity
                            style={styles.resetButton}
                            onPress={handleReset}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.resetText}>↺ Reset All</Text>
                        </TouchableOpacity>
                    )}

                    <View style={{ height: spacing.xxl }} />
                </ScrollView>

                {/* Map Drawer */}
                <MapDrawer
                    visible={mapVisible}
                    userLocation={userLocation}
                    distanceMeters={mapDistance}
                    onClose={() => setMapVisible(false)}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
    },
    title: {
        color: colors.textBright,
        fontSize: 28,
        ...fonts.bold,
    },
    subtitle: {
        color: colors.textMuted,
        fontSize: 14,
        marginTop: 2,
    },
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsIcon: {
        fontSize: 20,
    },
    badge: {
        alignSelf: 'flex-start',
        marginLeft: spacing.lg,
        marginTop: spacing.sm,
        marginBottom: spacing.md,
        backgroundColor: colors.accentDim,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
    },
    badgeText: {
        color: colors.accent,
        fontSize: 13,
        ...fonts.semiBold,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
    },
    resetButton: {
        marginTop: spacing.lg,
        alignSelf: 'center',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
    },
    resetText: {
        color: colors.textMuted,
        fontSize: 15,
        ...fonts.medium,
    },
});
