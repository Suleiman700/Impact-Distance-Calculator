import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import { spacing, radius, fonts } from '../theme';
import { useSettings } from '../contexts/SettingsContext';
import { calcDistance, formatDistance } from '../utils/calculateDistance';

type TargetState = 'idle' | 'recording' | 'completed';

interface Props {
    index: number;
    state: TargetState;
    duration: number | null;
    startTime: number | null;
    onPress: () => void;
}

export default function TargetButton({ index, state, duration, startTime, onPress }: Props) {
    const { colors, settings } = useSettings();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Live timer state
    const [elapsed, setElapsed] = useState(0);

    // Live timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (state === 'recording' && startTime && settings.showLiveStats) {
            interval = setInterval(() => {
                setElapsed((Date.now() - startTime) / 1000);
            }, 50); // 50ms for smooth updates
        } else {
            setElapsed(0);
        }
        return () => clearInterval(interval);
    }, [state, startTime, settings.showLiveStats]);

    // Pulse animation while recording
    useEffect(() => {
        if (state === 'recording') {
            const loop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 0.6,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            );
            loop.start();
            return () => loop.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [state]);

    const handlePress = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.92,
                duration: 80,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 120,
                useNativeDriver: true,
            }),
        ]).start();
        onPress();
    };

    const getButtonStyle = () => {
        switch (state) {
            case 'recording':
                return { backgroundColor: colors.recording, borderColor: colors.recording };
            case 'completed':
                return { backgroundColor: colors.success, borderColor: colors.success };
            default:
                return { backgroundColor: colors.card, borderColor: colors.cardBorder };
        }
    };

    const getLabel = () => {
        switch (state) {
            case 'idle':
                return 'Tap on Flash';
            case 'recording':
                return 'Tap on Sound';
            case 'completed':
                return `${duration?.toFixed(2)}s ✓`;
        }
    };

    const getIcon = () => {
        switch (state) {
            case 'idle':
                return '⚡';
            case 'recording':
                return '🔴';
            case 'completed':
                return '✅';
        }
    };

    const liveDist = calcDistance(elapsed);

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.8}
                style={[styles.button, getButtonStyle()]}
            >
                <Animated.View style={[styles.inner, { opacity: state === 'recording' ? pulseAnim : 1 }]}>
                    <Text style={styles.icon}>{getIcon()}</Text>
                    <View style={styles.textContainer}>
                        <Text style={[styles.targetLabel, { color: state === 'idle' ? colors.textBright : '#FFF' }]}>
                            Target {index + 1}
                        </Text>
                        <Text style={[styles.stateLabel, { color: state === 'idle' ? colors.text : '#FFF' }]}>
                            {getLabel()}
                        </Text>
                    </View>

                    {/* Live Stats */}
                    {state === 'recording' && settings.showLiveStats && (
                        <View style={styles.liveStats}>
                            <Text style={styles.liveTimer}>{elapsed.toFixed(1)}s</Text>
                            <Text style={styles.liveDistance}>{formatDistance(liveDist, settings.unit)}</Text>
                        </View>
                    )}
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: radius.lg,
        borderWidth: 1,
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    icon: {
        fontSize: 28,
        marginRight: spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    targetLabel: {
        fontSize: 18,
        ...fonts.semiBold,
    },
    stateLabel: {
        fontSize: 14,
        marginTop: 2,
        ...fonts.regular,
    },
    liveStats: {
        alignItems: 'flex-end',
    },
    liveTimer: {
        fontSize: 18,
        color: '#FFF',
        ...fonts.bold,
    },
    liveDistance: {
        fontSize: 12,
        color: '#FFF',
        opacity: 0.9,
        ...fonts.medium,
        marginTop: 2,
    },
});
