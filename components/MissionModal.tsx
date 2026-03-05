import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    Pressable,
    Animated,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, fonts } from '../theme';
import { useSettings } from '../contexts/SettingsContext';
import { Session } from '../types';

interface Props {
    visible: boolean;
    activeSession: Session | null;
    onStart: (name: string) => void;
    onEnd: () => void;
    onClose: () => void;
}

export default function MissionModal({ visible, activeSession, onStart, onEnd, onClose }: Props) {
    const { colors } = useSettings();
    const [name, setName] = useState('');
    const backdropAnim = React.useRef(new Animated.Value(0)).current;

    const now = new Date();
    const defaultName = `Mission ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

    useEffect(() => {
        if (visible) {
            setName(activeSession ? activeSession.name : defaultName);
            Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        } else {
            Animated.timing(backdropAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        }
    }, [visible]);

    const handleStart = () => {
        const missionName = name.trim() || defaultName;
        onStart(missionName);
        onClose();
    };

    const handleEnd = () => {
        onEnd();
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <Pressable style={styles.backdrop} onPress={onClose} />

                <Animated.View
                    style={[
                        styles.sheet,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.cardBorder,
                            opacity: backdropAnim,
                            transform: [{ scale: backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }],
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={[styles.iconBadge, { backgroundColor: activeSession ? colors.danger + '22' : colors.accentDim }]}>
                            <Ionicons
                                name={activeSession ? 'stop-circle-outline' : 'flag-outline'}
                                size={28}
                                color={activeSession ? colors.danger : colors.accent}
                            />
                        </View>
                        <Text style={[styles.title, { color: colors.textBright }]}>
                            {activeSession ? 'Active Mission' : 'New Mission'}
                        </Text>
                        <TouchableOpacity onPress={onClose} hitSlop={20}>
                            <Ionicons name="close" size={22} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {activeSession ? (
                        // END SESSION UI
                        <>
                            <View style={[styles.sessionInfo, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
                                <View style={[styles.dot, { backgroundColor: colors.danger }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.sessionName, { color: colors.textBright }]}>{activeSession.name}</Text>
                                    <Text style={[styles.sessionDate, { color: colors.textMuted }]}>
                                        Started {new Date(activeSession.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            </View>

                            <Text style={[styles.hint, { color: colors.textMuted }]}>
                                Ending this mission will stop grouping new recordings under it. Existing records are kept.
                            </Text>

                            <TouchableOpacity
                                style={[styles.primaryButton, { backgroundColor: colors.danger }]}
                                onPress={handleEnd}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="stop-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.primaryButtonText}>End Mission</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        // START SESSION UI
                        <>
                            <Text style={[styles.label, { color: colors.textMuted }]}>Mission Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.cardBorder, color: colors.textBright }]}
                                value={name}
                                onChangeText={setName}
                                placeholder={defaultName}
                                placeholderTextColor={colors.textMuted}
                                autoFocus
                                returnKeyType="done"
                                onSubmitEditing={handleStart}
                                selectTextOnFocus
                            />

                            <Text style={[styles.hint, { color: colors.textMuted }]}>
                                All recordings will be tagged with this mission until you end it.
                            </Text>

                            <TouchableOpacity
                                style={[styles.primaryButton, { backgroundColor: colors.accent }]}
                                onPress={handleStart}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="flag" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.primaryButtonText}>Start Mission</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 24,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        marginHorizontal: spacing.lg,
        borderRadius: radius.xl,
        borderWidth: 1,
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    iconBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        ...fonts.bold,
        flex: 1,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: spacing.md,
        alignSelf: 'center',
    },
    sessionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        marginBottom: spacing.md,
    },
    sessionName: {
        fontSize: 16,
        ...fonts.semiBold,
    },
    sessionDate: {
        fontSize: 12,
        marginTop: 2,
    },
    label: {
        fontSize: 13,
        ...fonts.medium,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        height: 52,
        borderRadius: radius.md,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        fontSize: 16,
        ...fonts.medium,
        marginBottom: spacing.md,
    },
    hint: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: spacing.lg,
    },
    primaryButton: {
        flexDirection: 'row',
        height: 52,
        borderRadius: radius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        ...fonts.bold,
    },
});
