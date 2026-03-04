import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import { colors, spacing, radius, fonts } from '../theme';

type TargetState = 'idle' | 'recording' | 'completed';

interface Props {
    index: number;
    state: TargetState;
    duration: number | null;
    onPress: () => void;
}

export default function TargetButton({ index, state, duration, onPress }: Props) {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

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

    // Scale bounce on press
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

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.8}
                disabled={state === 'completed'}
                style={[styles.button, getButtonStyle()]}
            >
                <Animated.View style={[styles.inner, { opacity: state === 'recording' ? pulseAnim : 1 }]}>
                    <Text style={styles.icon}>{getIcon()}</Text>
                    <View style={styles.textContainer}>
                        <Text style={styles.targetLabel}>Target {index + 1}</Text>
                        <Text style={styles.stateLabel}>{getLabel()}</Text>
                    </View>
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
        color: colors.textBright,
        fontSize: 18,
        ...fonts.semiBold,
    },
    stateLabel: {
        color: colors.text,
        fontSize: 14,
        marginTop: 2,
        ...fonts.regular,
    },
});
