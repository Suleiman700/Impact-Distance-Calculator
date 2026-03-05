import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import * as Location from 'expo-location';
import { DeviceMotion } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, radius, fonts } from '../theme';
import { useSettings } from '../contexts/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { calcDistance } from '../utils/calculateDistance';
import { TargetResult } from '../types';
import TargetButton from '../components/TargetButton';
import ResultCard from '../components/ResultCard';
import MapDrawer from '../components/MapDrawer';
import GlobalHistoryMap from '../components/GlobalHistoryMap';

type TargetState = 'idle' | 'recording';

interface ButtonStatus {
    state: TargetState;
    startTime: number | null;
    startHeading: number | null;
    startTilt: number | null;
}

export default function HomeScreen({ navigation }: any) {
    const { settings, colors } = useSettings();
    const insets = useSafeAreaInsets();

    // Track the status of each button
    const [buttonStatuses, setButtonStatuses] = useState<ButtonStatus[]>(
        Array.from({ length: settings.targetCount }, () => ({ state: 'idle', startTime: null, startHeading: null, startTilt: null }))
    );

    // Track all completed measurements
    const [history, setHistory] = useState<TargetResult[]>([]);

    const [userLocation, setUserLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [mapVisible, setMapVisible] = useState(false);
    const [mapDistance, setMapDistance] = useState(0);
    const [mapResult, setMapResult] = useState<TargetResult | null>(null); // Track the full result being viewed
    const [globalMapVisible, setGlobalMapVisible] = useState(false);
    const [heading, setHeading] = useState<number | null>(null);
    const [tilt, setTilt] = useState<number | null>(null);

    // Reset when count changes
    useEffect(() => {
        setButtonStatuses(Array.from({ length: settings.targetCount }, () => ({ state: 'idle', startTime: null, startHeading: null, startTilt: null })));
        setHistory([]);
    }, [settings.targetCount]);

    // GPS & Compass Logic
    useEffect(() => {
        let headingSub: Location.LocationSubscription | null = null;
        let motionSub: any = null;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                try {
                    // Track heading
                    if (settings.directionMode === 'sensor') {
                        headingSub = await Location.watchHeadingAsync((headingData) => {
                            const head = headingData.trueHeading > 0 ? headingData.trueHeading : headingData.magHeading;
                            setHeading(head);
                        });
                    } else {
                        setHeading(null);
                    }

                    // Track tilt
                    if (settings.tiltEnabled) {
                        motionSub = DeviceMotion.addListener((motionData) => {
                            if (motionData.rotation) {
                                // beta: 0 is flat on back, 1.57 (90deg) is standing up
                                // We want 0 to be flat, 90 to be pointing straight up
                                let pitch = motionData.rotation.beta * (180 / Math.PI);
                                // Adjusting so holding it vertical is 90
                                if (pitch < 0) pitch = Math.abs(pitch);
                                setTilt(pitch);
                            }
                        });
                        DeviceMotion.setUpdateInterval(100);
                    } else {
                        setTilt(null);
                    }

                    // Manage location 
                    if (settings.locationMode !== 'manual') {
                        const last = await Location.getLastKnownPositionAsync({});
                        if (last) setUserLocation({ latitude: last.coords.latitude, longitude: last.coords.longitude });
                        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                    }
                } catch (e) {
                    console.warn('Tracking errors:', e);
                }
            }
        })();

        return () => {
            if (headingSub) headingSub.remove();
            if (motionSub) motionSub.remove();
        };
    }, [settings.locationMode, settings.directionMode, settings.tiltEnabled]);

    // Fast-fallback for manual location (avoids permissions request delay)
    useEffect(() => {
        if (settings.locationMode === 'manual') setUserLocation(settings.manualLocation);
    }, [settings.locationMode, settings.manualLocation]);

    const handleTargetPress = useCallback((index: number) => {
        // Use a functional update but we need access to the current heading state here.
        // It's better to read it directly from the component's current scope which is trapped here.
        const currentHeading = heading;

        setButtonStatuses((prev) => {
            const updated = [...prev];
            const current = updated[index];

            if (current.state === 'idle') {
                // START RECORDING
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                updated[index] = { state: 'recording', startTime: Date.now(), startHeading: currentHeading, startTilt: tilt };
            } else {
                // FINISH & SAVE TO HISTORY
                const endTime = Date.now();
                const duration = (endTime - (current.startTime || 0)) / 1000;
                const distance = calcDistance(duration);

                // Add to history list
                const newResult: TargetResult = {
                    index, // Button index
                    startTime: current.startTime,
                    endTime,
                    duration,
                    distance,
                    heading: current.startHeading,
                    tilt: current.startTilt,
                    timestamp: Date.now(), // Unique time for keys
                };

                setHistory((prevHistory) => [newResult, ...prevHistory]); // Add to top

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Reset this specific button to Idle
                updated[index] = { state: 'idle', startTime: null, startHeading: null, startTilt: null };
            }
            return updated;
        });
    }, [heading, tilt]);

    const handleReset = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setHistory([]);
        setButtonStatuses(Array.from({ length: settings.targetCount }, () => ({ state: 'idle', startTime: null, startHeading: null, startTilt: null })));
    };

    const handleOpenMap = (result: TargetResult) => {
        if (result.distance) {
            setMapDistance(result.distance);
            setMapResult(result);
            setMapVisible(true);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
            <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
            <View style={styles.content}>
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.title, { color: colors.textBright }]}>Impact Distance</Text>
                        <View style={styles.statusRow}>
                            <Ionicons
                                name={settings.locationMode === 'gps' ? "location" : "map"}
                                size={12}
                            // color={userLocation ? colors.success : colors.danger}
                            />
                            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                                {settings.locationMode === 'gps' ? 'GPS Active' : 'Manual Position'}
                                {heading !== null && ` • ${heading.toFixed(0)}°`}
                                {tilt !== null && settings.tiltEnabled && ` (Tilt: ${tilt.toFixed(0)}°)`}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.settingsButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                        onPress={() => navigation.navigate('Settings')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="settings-outline" size={24} color={colors.textBright} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Active Buttons */}
                    <View style={styles.buttonGrid}>
                        {buttonStatuses.map((btn, i) => (
                            <TargetButton
                                key={i}
                                index={i}
                                state={btn.state}
                                duration={null}
                                startTime={btn.startTime}
                                onPress={() => handleTargetPress(i)}
                            />
                        ))}
                    </View>

                    {/* Measurement History */}
                    <ResultCard
                        results={history}
                        onOpenMap={handleOpenMap}
                        onOpenGlobalMap={() => setGlobalMapVisible(true)}
                        onClear={handleReset}
                        onDelete={(timestamp) => {
                            setHistory(prev => prev.filter(item => item.timestamp !== timestamp));
                        }}
                    />

                    <View style={{ height: spacing.xxl }} />
                </ScrollView>

                <MapDrawer
                    visible={mapVisible}
                    userLocation={userLocation}
                    distanceMeters={mapDistance}
                    heading={mapResult?.heading}
                    tilt={mapResult?.tilt}
                    onClose={() => {
                        setMapVisible(false);
                        setTimeout(() => setMapResult(null), 300); // clear after animation
                    }}
                />

                <GlobalHistoryMap
                    visible={globalMapVisible}
                    userLocation={userLocation}
                    history={history}
                    onClose={() => setGlobalMapVisible(false)}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
    },
    title: { fontSize: 28, ...fonts.bold },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    subtitle: { fontSize: 13 },
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
    buttonGrid: { marginBottom: spacing.lg },
});
