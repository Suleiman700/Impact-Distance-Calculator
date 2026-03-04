import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    TouchableOpacity,
    Platform,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors, spacing, radius, fonts } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.65;

interface Props {
    visible: boolean;
    userLocation: { latitude: number; longitude: number } | null;
    distanceMeters: number;
    onClose: () => void;
}

export default function MapDrawer({ visible, userLocation, distanceMeters, onClose }: Props) {
    const slideAnim = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const [isFullyClosed, setIsFullyClosed] = React.useState(true);

    useEffect(() => {
        if (visible) {
            setIsFullyClosed(false);
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 200,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: DRAWER_HEIGHT,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setIsFullyClosed(true);
            });
        }
    }, [visible]);

    if (!visible && isFullyClosed) return null;

    // Calculate region to fit the circle
    const delta = distanceMeters > 0 ? (distanceMeters / 111320) * 2.5 : 0.01;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
            {/* Backdrop */}
            <Animated.View
                style={[
                    styles.backdrop,
                    { opacity: backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }) },
                ]}
            >
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
            </Animated.View>

            {/* Drawer */}
            <Animated.View
                style={[styles.drawer, { transform: [{ translateY: slideAnim }] }]}
            >
                {/* Handle */}
                <View style={styles.handleContainer}>
                    <View style={styles.handle} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Impact Radius</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>
                </View>

                {/* Map */}
                {userLocation ? (
                    <MapView
                        style={styles.map}
                        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                        initialRegion={{
                            ...userLocation,
                            latitudeDelta: delta,
                            longitudeDelta: delta,
                        }}
                        customMapStyle={darkMapStyle}
                    >
                        <Marker coordinate={userLocation} title="Your Location" />
                        {distanceMeters > 0 && (
                            <Circle
                                center={userLocation}
                                radius={distanceMeters}
                                strokeColor={colors.accent}
                                fillColor={colors.accentDim}
                                strokeWidth={2}
                            />
                        )}
                    </MapView>
                ) : (
                    <View style={styles.noLocation}>
                        <Text style={styles.noLocationText}>Waiting for GPS location…</Text>
                    </View>
                )}
            </Animated.View>
        </View>
    );
}

const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
];

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    drawer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: DRAWER_HEIGHT,
        backgroundColor: colors.card,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        overflow: 'hidden',
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.textMuted,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
    },
    title: {
        color: colors.textBright,
        fontSize: 18,
        ...fonts.bold,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.cardBorder,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        color: colors.text,
        fontSize: 16,
    },
    map: {
        flex: 1,
        borderTopWidth: 1,
        borderTopColor: colors.cardBorder,
    },
    noLocation: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noLocationText: {
        color: colors.textMuted,
        fontSize: 16,
    },
});
