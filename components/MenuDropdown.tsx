import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, fonts } from '../theme';
import { useSettings } from '../contexts/SettingsContext';

interface MenuItem {
    id: string;
    label: string;
    icon: string;
    onPress: () => void;
    danger?: boolean;
}

interface Props {
    items: MenuItem[];
}

export default function MenuDropdown({ items }: Props) {
    const { colors } = useSettings();
    const [visible, setVisible] = useState(false);

    const open = () => setVisible(true);
    const close = () => setVisible(false);

    const handleItem = (item: MenuItem) => {
        close();
        item.onPress();
    };

    return (
        <View>
            <TouchableOpacity
                onPress={open}
                style={[styles.triggerButton, {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                }]}
                hitSlop={8}
                activeOpacity={0.7}
            >
                <Ionicons name="ellipsis-vertical" size={20} color={colors.textBright} />
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
                <Pressable style={styles.backdrop} onPress={close} />

                <View
                    style={[
                        styles.dropdown,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.cardBorder,
                            shadowColor: colors.textBright,
                        }
                    ]}
                >
                    {items.map((item, i) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.menuItem,
                                i < items.length - 1 && {
                                    borderBottomWidth: 1,
                                    borderBottomColor: colors.cardBorder,
                                }
                            ]}
                            onPress={() => handleItem(item)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={item.icon as any}
                                size={18}
                                color={item.danger ? colors.danger : colors.text}
                            />
                            <Text style={[
                                styles.menuLabel,
                                { color: item.danger ? colors.danger : colors.text }
                            ]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    triggerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
    dropdown: {
        position: 'absolute',
        top: 70,
        right: 16,
        minWidth: 180,
        borderRadius: radius.lg,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 10,
        overflow: 'hidden',
        zIndex: 999,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md + 2,
    },
    menuLabel: {
        fontSize: 15,
        ...fonts.medium,
    },
});
