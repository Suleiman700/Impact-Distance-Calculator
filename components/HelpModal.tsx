import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Pressable,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, fonts } from '../theme';
import { useSettings } from '../contexts/SettingsContext';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function HelpModal({ visible, onClose }: Props) {
    const { colors } = useSettings();

    const openEmail = () => {
        Linking.openURL('mailto:brightpixelwork@gmail.com');
    };

    const openGithub = () => {
        Linking.openURL('https://github.com/Suleiman700');
    };

    const openWebsite = () => {
        Linking.openURL('http://brightpixel.work/');
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <View
                    style={[
                        styles.modalContent,
                        { backgroundColor: colors.card, borderColor: colors.cardBorder }
                    ]}
                >
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.textBright }]}>Help & Support</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.description, { color: colors.text }]}>
                        If you have any questions, feedback, or need assistance, feel free to reach out.
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}
                            onPress={openEmail}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#EA433522' }]}>
                                <Ionicons name="mail" size={22} color="#EA4335" />
                            </View>
                            <Text style={[styles.buttonText, { color: colors.textBright }]}>Email Support</Text>
                            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}
                            onPress={openWebsite}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#4285F422' }]}>
                                <Ionicons name="globe-outline" size={22} color="#4285F4" />
                            </View>
                            <Text style={[styles.buttonText, { color: colors.textBright }]}>Official Website</Text>
                            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}
                            onPress={openGithub}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: colors.textBright + '11' }]}>
                                <Ionicons name="logo-github" size={22} color={colors.textBright} />
                            </View>
                            <Text style={[styles.buttonText, { color: colors.textBright }]}>GitHub Profile</Text>
                            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.versionText, { color: colors.textMuted }]}>
                            Impact Distance By BrightPixel
                        </Text>
                    </View>
                </View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: radius.xl,
        borderWidth: 1,
        padding: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 22,
        ...fonts.bold,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        ...fonts.medium,
        marginBottom: spacing.xl,
    },
    buttonContainer: {
        gap: spacing.md,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    buttonText: {
        flex: 1,
        fontSize: 16,
        ...fonts.bold,
    },
    footer: {
        marginTop: spacing.xl,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        ...fonts.medium,
        opacity: 0.6,
    },
});
