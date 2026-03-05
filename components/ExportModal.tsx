import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, fonts } from '../theme';
import { useSettings } from '../contexts/SettingsContext';

interface Props {
    visible: boolean;
    onClose: () => void;
    onExportCSV: () => void;
    onExportJSON: () => void;
}

export default function ExportModal({ visible, onClose, onExportCSV, onExportJSON }: Props) {
    const { colors } = useSettings();

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
                        <Text style={[styles.title, { color: colors.textBright }]}>Export Data</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.description, { color: colors.text }]}>
                        Choose your preferred format to export and share your history records.
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}
                            onPress={() => {
                                onClose();
                                onExportCSV();
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#4CAF5022' }]}>
                                <Ionicons name="list" size={22} color="#4CAF50" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.buttonText, { color: colors.textBright }]}>CSV Format</Text>
                                <Text style={[styles.buttonSubtext, { color: colors.textMuted }]}>Best for Excel or Sheets</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}
                            onPress={() => {
                                onClose();
                                onExportJSON();
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#2196F322' }]}>
                                <Ionicons name="code-working" size={22} color="#2196F3" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.buttonText, { color: colors.textBright }]}>JSON Format</Text>
                                <Text style={[styles.buttonSubtext, { color: colors.textMuted }]}>Best for data analysis</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
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
        fontSize: 16,
        ...fonts.bold,
    },
    buttonSubtext: {
        fontSize: 12,
        ...fonts.medium,
        marginTop: 2,
    },
});
