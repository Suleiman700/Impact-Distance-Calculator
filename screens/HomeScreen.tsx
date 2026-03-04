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

type TargetState = 'idle' | 'recording';

interface ButtonStatus {
    state: TargetState;
    startTime: number | null;
}

export default function HomeScreen({ navigation }: any) {
    const { settings, colors } = useSettings();
    const insets = useSafeAreaInsets();

    // Track the status of each button
    const [buttonStatuses, setButtonStatuses] = useState<ButtonStatus[]>(
        Array.from({ length: settings.targetCount }, () => ({ state: 'idle', startTime: null }))
    );

    // Track all completed measurements
    const [history, setHistory] = useState<TargetResult[]>([]);

    const [userLocation, setUserLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [mapVisible, setMapVisible] = useState(false);
    const [mapDistance, setMapDistance] = useState(0);

    // Reset when count changes
    useEffect(() => {
        setButtonStatuses(Array.from({ length: settings.targetCount }, () => ({ state: 'idle', startTime: null })));
        setHistory([]);
    }, [settings.targetCount]);

    // GPS Logic
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                try {
                    const last = await Location.getLastKnownPositionAsync({});
                    if (last) setUserLocation({ latitude: last.coords.latitude, longitude: last.coords.longitude });
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                } catch (e) {
                    console.warn('Location error:', e);
                }
            }
        })();
    }, []);

    const handleTargetPress = useCallback((index: number) => {
        setButtonStatuses((prev) => {
            const updated = [...prev];
            const current = updated[index];

            if (current.state === 'idle') {
                // START RECORDING
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                updated[index] = { state: 'recording', startTime: Date.now() };
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
                    timestamp: Date.now(), // Unique time for keys
                };

                setHistory(prevHistory => [newResult, ...prevHistory]); // Add to top

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Reset this specific button to Idle
                updated[index] = { state: 'idle', startTime: null };
            }
            return updated;
        });
    }, []);

    const handleReset = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setHistory([]);
        setButtonStatuses(Array.from({ length: settings.targetCount }, () => ({ state: 'idle', startTime: null })));
    };

    const handleOpenMap = (result: TargetResult) => {
        if (result.distance) {
            setMapDistance(result.distance);
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
                        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Toggle buttons to log events</Text>
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
                        onClear={handleReset}
                    />

                    <View style={{ height: spacing.xxl }} />
                </ScrollView>

                <MapDrawer
                    visible={mapVisible}
                    userLocation={userLocation}
                    distanceMeters={mapDistance}
                    onClose={() => setMapVisible(false)}
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
    subtitle: { fontSize: 14, marginTop: 2 },
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
