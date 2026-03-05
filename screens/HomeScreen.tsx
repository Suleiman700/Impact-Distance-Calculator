import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Alert,
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
import { useHistory } from '../contexts/HistoryContext';
import { useKeepAwake } from 'expo-keep-awake';
import MissionModal from '../components/MissionModal';
import MenuDropdown from '../components/MenuDropdown';
import HelpModal from '../components/HelpModal';

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
    useKeepAwake(settings.keepScreenOn ? 'field-mode' : undefined);

    // Track the status of each button
    const [buttonStatuses, setButtonStatuses] = useState<ButtonStatus[]>(
        Array.from({ length: settings.targetCount }, () => ({ state: 'idle', startTime: null, startHeading: null, startTilt: null }))
    );

    const { history, addResult, deleteResult, clearHistory, activeSession, startSession, endSession } = useHistory();

    const [displayClearedAt, setDisplayClearedAt] = useState(0);
    const recentHistory = history.filter(h => (h.timestamp || 0) > displayClearedAt);

    const [userLocation, setUserLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [mapVisible, setMapVisible] = useState(false);
    const [mapDistance, setMapDistance] = useState(0);
    const [mapResult, setMapResult] = useState<TargetResult | null>(null); // Track the full result being viewed
    const [globalMapVisible, setGlobalMapVisible] = useState(false);
    const [missionModalVisible, setMissionModalVisible] = useState(false);
    const [helpModalVisible, setHelpModalVisible] = useState(false);
    const [heading, setHeading] = useState<number | null>(null);
    const [tilt, setTilt] = useState<number | null>(null);

    // Reset when count changes
    useEffect(() => {
        setButtonStatuses(Array.from({ length: settings.targetCount }, () => ({ state: 'idle', startTime: null, startHeading: null, startTilt: null })));
    }, [settings.targetCount]);

    // Sensor Logic: Always captured for data integrity, even if visual modes are 'off'
    useEffect(() => {
        let headingSub: Location.LocationSubscription | null = null;
        let motionSub: any = null;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                try {
                    // Always start Compass for history metadata
                    headingSub = await Location.watchHeadingAsync((data) => {
                        setHeading(data.magHeading);
                    });

                    // Always start DeviceMotion for tilt tracking
                    motionSub = DeviceMotion.addListener((motion) => {
                        if (motion.rotation) {
                            const pitch = -(motion.rotation.beta * 180) / Math.PI;
                            setTilt(pitch);
                        }
                    });
                    DeviceMotion.setUpdateInterval(100);
                } catch (e) {
                    console.warn('Sensor initialization failed:', e);
                }
            }
        })();

        return () => {
            if (headingSub) headingSub.remove();
            if (motionSub) motionSub.remove();
        };
    }, []); // Run once on mount to keep sensors alive for history capture

    // Location Logic
    useEffect(() => {
        let locationSub: any = null;

        (async () => {
            if (settings.locationMode !== 'manual') {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    try {
                        const last = await Location.getLastKnownPositionAsync({});
                        if (last) setUserLocation({ latitude: last.coords.latitude, longitude: last.coords.longitude });
                        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                    } catch (e) {
                        console.warn('Location tracking errors:', e);
                    }
                }
            }
        })();

        return () => {
            if (locationSub && locationSub.remove) locationSub.remove();
        };
    }, [settings.locationMode]);

    // Fast-fallback for manual location (avoids permissions request delay)
    useEffect(() => {
        if (settings.locationMode === 'manual') setUserLocation(settings.manualLocation);
    }, [settings.locationMode, settings.manualLocation]);

    const handleTargetPress = useCallback((index: number) => {
        const currentTarget = buttonStatuses[index];
        const currentHeading = heading;
        const currentTilt = tilt;

        if (currentTarget.state === 'idle') {
            // START RECORDING
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setButtonStatuses(prev => {
                const updated = [...prev];
                updated[index] = {
                    state: 'recording',
                    startTime: Date.now(),
                    startHeading: currentHeading,
                    startTilt: currentTilt
                };
                return updated;
            });
        } else {
            // FINISH & SAVE
            const endTime = Date.now();
            const duration = (endTime - (currentTarget.startTime || 0)) / 1000;
            const distance = calcDistance(duration);

            const newResult: TargetResult = {
                index,
                startTime: currentTarget.startTime,
                endTime,
                duration,
                distance,
                heading: currentTarget.startHeading,
                tilt: currentTarget.startTilt,
                timestamp: Date.now(),
                latitude: userLocation?.latitude,
                longitude: userLocation?.longitude,
            };

            // Call side-effects OUTSIDE of any state setter callback
            addResult(newResult);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            setButtonStatuses(prev => {
                const updated = [...prev];
                updated[index] = { state: 'idle', startTime: null, startHeading: null, startTilt: null };
                return updated;
            });
        }
    }, [buttonStatuses, heading, tilt, userLocation, addResult]);

    const handleClearRecent = () => {
        Alert.alert(
            'Clear Recent Records',
            'This will dismiss the current records from the home screen. They will still be available in the History tab.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Dismiss All',
                    style: 'destructive',
                    onPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setDisplayClearedAt(Date.now());
                        setButtonStatuses(Array.from({ length: settings.targetCount }, () => ({ state: 'idle', startTime: null, startHeading: null, startTilt: null })));
                    }
                }
            ]
        );
    };

    const handleOpenMap = (result: TargetResult) => {
        if (result.distance) {
            setMapDistance(result.distance);
            setMapResult(result);
            setMapVisible(true);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.title, { color: colors.textBright }]}>Impact Distance</Text>
                        <View style={styles.statusRow}>
                            <Ionicons
                                name={settings.locationMode === 'gps' ? "location" : "map"}
                                size={12}
                                color={colors.textMuted}
                            />
                            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                                {settings.locationMode === 'gps' ? 'GPS Active' : 'Manual Position'}
                                {heading !== null && ` • ${heading.toFixed(0)}°`}
                                {tilt !== null && settings.tiltEnabled && ` (Tilt: ${tilt.toFixed(0)}°)`}
                            </Text>
                        </View>

                        {/* Mission Status */}
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.xs }}
                            onPress={() => setMissionModalVisible(true)}
                        >
                            <View style={[styles.missionBadge, { backgroundColor: activeSession ? colors.danger + '22' : colors.card, borderColor: activeSession ? colors.danger : colors.cardBorder }]}>
                                <View style={[styles.missionDot, { backgroundColor: activeSession ? colors.danger : colors.textMuted }]} />
                                <Text style={[styles.missionText, { color: activeSession ? colors.danger : colors.textMuted }]}>
                                    {activeSession ? `Mission: ${activeSession.name}` : "Start New Mission"}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <MenuDropdown
                        items={[
                            {
                                id: 'history',
                                label: 'History',
                                icon: 'time-outline',
                                onPress: () => navigation.navigate('History'),
                            },
                            {
                                id: 'settings',
                                label: 'Settings',
                                icon: 'settings-outline',
                                onPress: () => navigation.navigate('Settings'),
                            },
                            {
                                id: 'help',
                                label: 'Help',
                                icon: 'help-circle-outline',
                                onPress: () => setHelpModalVisible(true),
                            },
                        ]}
                    />
                </View>

                {/* Top Buttons (Standard Layout) - natural height */}
                {settings.buttonPosition === 'top' && (
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
                )}

                {/* History fills all remaining space with its own internal scroll */}
                <View style={styles.historyArea}>
                    <ResultCard
                        results={recentHistory}
                        activeSession={activeSession}
                        onOpenMap={handleOpenMap}
                        onOpenGlobalMap={() => setGlobalMapVisible(true)}
                        onClear={handleClearRecent}
                        onDelete={deleteResult}
                    />
                </View>

                {/* Bottom Buttons (One-Handed Layout) */}
                {settings.buttonPosition === 'bottom' && (
                    <View style={[styles.bottomButtonArea, { backgroundColor: colors.bg }]}>
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
                    </View>
                )}

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

                <MissionModal
                    visible={missionModalVisible}
                    activeSession={activeSession}
                    onStart={(name) => {
                        setDisplayClearedAt(Date.now());
                        startSession(name);
                    }}
                    onEnd={endSession}
                    onClose={() => setMissionModalVisible(false)}
                />

                <HelpModal
                    visible={helpModalVisible}
                    onClose={() => setHelpModalVisible(false)}
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
    missionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.sm,
        borderWidth: 1,
    },
    missionDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    missionText: {
        fontSize: 12,
        ...fonts.medium,
    },
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyArea: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
    },
    buttonGrid: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
        paddingTop: spacing.sm,
    },
    bottomButtonArea: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: spacing.md,
    },
});
