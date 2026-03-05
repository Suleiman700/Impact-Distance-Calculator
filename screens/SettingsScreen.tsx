import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, radius, fonts } from '../theme';
import { useSettings } from '../contexts/SettingsContext';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen({ navigation }: any) {
    const { settings, updateSettings, colors } = useSettings();
    const insets = useSafeAreaInsets();

    const units: Array<'km' | 'mile'> = ['km', 'mile'];
    const themes: Array<'light' | 'dark'> = ['light', 'dark'];
    const targetOptions = [1, 2, 3, 4, 5];

    const handleUpdate = (partial: Partial<typeof settings>) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        updateSettings(partial);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
            <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                        style={styles.backButtonContainer}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.accent} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.textBright }]}>Settings</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                    {/* Theme Toggle */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
                        <View style={[styles.segmented, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                            {themes.map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[
                                        styles.segment,
                                        settings.theme === t && { backgroundColor: colors.accent },
                                    ]}
                                    onPress={() => handleUpdate({ theme: t })}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.segmentText,
                                            { color: colors.textMuted },
                                            settings.theme === t && { color: '#FFF', ...fonts.semiBold },
                                        ]}
                                    >
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Unit Toggle */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Distance Unit</Text>
                        <View style={[styles.segmented, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                            {units.map((u) => (
                                <TouchableOpacity
                                    key={u}
                                    style={[
                                        styles.segment,
                                        settings.unit === u && { backgroundColor: colors.accent },
                                    ]}
                                    onPress={() => handleUpdate({ unit: u })}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.segmentText,
                                            { color: colors.textMuted },
                                            settings.unit === u && { color: '#FFF', ...fonts.semiBold },
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
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Number of Targets</Text>
                        <View style={styles.stepper}>
                            {targetOptions.map((n) => (
                                <TouchableOpacity
                                    key={n}
                                    style={[
                                        styles.stepperButton,
                                        { backgroundColor: colors.card, borderColor: colors.cardBorder },
                                        settings.targetCount === n && { backgroundColor: colors.accent, borderColor: colors.accent },
                                    ]}
                                    onPress={() => handleUpdate({ targetCount: n })}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.stepperText,
                                            { color: colors.textMuted },
                                            settings.targetCount === n && { color: '#FFF' },
                                        ]}
                                    >
                                        {n}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Live Stats Toggle */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Real-time Updates</Text>
                        <TouchableOpacity
                            style={[
                                styles.toggleContainer,
                                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                            ]}
                            onPress={() => handleUpdate({ showLiveStats: !settings.showLiveStats })}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.toggleLabel, { color: colors.text }]}>
                                Show Timer & Distance on Buttons
                            </Text>
                            <View style={[
                                styles.toggleSwitch,
                                { backgroundColor: settings.showLiveStats ? colors.accent : colors.cardBorder }
                            ]}>
                                <View style={[
                                    styles.toggleKnob,
                                    { transform: [{ translateX: settings.showLiveStats ? 20 : 0 }] }
                                ]} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Info */}
                    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.infoTitle, { color: colors.textBright }]}>How it works</Text>
                        <Text style={[styles.infoText, { color: colors.textMuted }]}>
                            1. Tap a target button when you see a flash{'\n'}
                            2. Tap again when you hear the sound{'\n'}
                            3. The app calculates the time difference{'\n'}
                            4. Distance is calculated using speed of sound (343 m/s){'\n'}
                            5. View the estimated distance on the map
                        </Text>
                    </View>

                    {/* Tutorial Button */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={[
                                styles.toggleContainer,
                                { backgroundColor: colors.card, borderColor: colors.cardBorder, marginTop: spacing.lg },
                            ]}
                            onPress={() => navigation.navigate('Intro')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.toggleLabel, { color: colors.text }]}>
                                Show Introduction Tutorial
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.lg,
    },
    backButtonContainer: {
        width: 44,
        height: 44,
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        ...fonts.bold,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: 14,
        ...fonts.medium,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    segmented: {
        flexDirection: 'row',
        borderRadius: radius.md,
        padding: 4,
        borderWidth: 1,
    },
    segment: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRadius: radius.sm,
    },
    segmentText: {
        fontSize: 15,
        ...fonts.medium,
    },
    stepper: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    stepperButton: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRadius: radius.md,
        borderWidth: 1,
    },
    stepperText: {
        fontSize: 18,
        ...fonts.bold,
    },
    infoCard: {
        borderRadius: radius.lg,
        borderWidth: 1,
        padding: spacing.lg,
        marginTop: spacing.lg,
    },
    infoTitle: {
        fontSize: 16,
        ...fonts.semiBold,
        marginBottom: spacing.sm,
    },
    infoText: {
        fontSize: 14,
        lineHeight: 22,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
    },
    toggleLabel: {
        fontSize: 15,
        ...fonts.medium,
    },
    toggleSwitch: {
        width: 44,
        height: 24,
        borderRadius: 12,
        padding: 2,
    },
    toggleKnob: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
    },
});
