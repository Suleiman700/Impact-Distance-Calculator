import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { colors, spacing, radius, fonts } from '../theme';
import { useSettings } from '../contexts/SettingsContext';

export default function SettingsScreen({ navigation }: any) {
    const { settings, updateSettings } = useSettings();

    const units: Array<'km' | 'mile'> = ['km', 'mile'];
    const targetOptions = [1, 2, 3, 4, 5];

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Text style={styles.backButton}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Settings</Text>
                    <View style={{ width: 60 }} />
                </View>

                {/* Unit Toggle */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Distance Unit</Text>
                    <View style={styles.segmented}>
                        {units.map((u) => (
                            <TouchableOpacity
                                key={u}
                                style={[
                                    styles.segment,
                                    settings.unit === u && styles.segmentActive,
                                ]}
                                onPress={() => updateSettings({ unit: u })}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        settings.unit === u && styles.segmentTextActive,
                                    ]}
                                >
                                    {u === 'km' ? 'Kilometers' : 'Miles'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Target Count Stepper */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Number of Targets</Text>
                    <View style={styles.stepper}>
                        {targetOptions.map((n) => (
                            <TouchableOpacity
                                key={n}
                                style={[
                                    styles.stepperButton,
                                    settings.targetCount === n && styles.stepperButtonActive,
                                ]}
                                onPress={() => updateSettings({ targetCount: n })}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.stepperText,
                                        settings.targetCount === n && styles.stepperTextActive,
                                    ]}
                                >
                                    {n}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Info */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>How it works</Text>
                    <Text style={styles.infoText}>
                        1. Tap a target button when you see a flash{'\n'}
                        2. Tap again when you hear the sound{'\n'}
                        3. Distance is calculated using speed of sound (343 m/s){'\n'}
                        4. View the estimated impact radius on the map
                    </Text>
                </View>
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
        paddingHorizontal: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.lg,
        paddingBottom: spacing.lg,
    },
    backButton: {
        color: colors.accent,
        fontSize: 16,
        ...fonts.medium,
    },
    title: {
        color: colors.textBright,
        fontSize: 20,
        ...fonts.bold,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 14,
        ...fonts.medium,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    segmented: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: 4,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    segment: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRadius: radius.sm,
    },
    segmentActive: {
        backgroundColor: colors.accent,
    },
    segmentText: {
        color: colors.textMuted,
        fontSize: 15,
        ...fonts.medium,
    },
    segmentTextActive: {
        color: colors.textBright,
        ...fonts.semiBold,
    },
    stepper: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    stepperButton: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    stepperButtonActive: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    stepperText: {
        color: colors.textMuted,
        fontSize: 18,
        ...fonts.bold,
    },
    stepperTextActive: {
        color: colors.textBright,
    },
    infoCard: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        padding: spacing.lg,
        marginTop: spacing.lg,
    },
    infoTitle: {
        color: colors.textBright,
        fontSize: 16,
        ...fonts.semiBold,
        marginBottom: spacing.sm,
    },
    infoText: {
        color: colors.textMuted,
        fontSize: 14,
        lineHeight: 22,
    },
});
