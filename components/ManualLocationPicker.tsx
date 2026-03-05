import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    BackHandler,
    Pressable,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { spacing, radius, fonts } from '../theme';
import { useSettings } from '../contexts/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { LEAFLET_CSS, LEAFLET_JS, MARKER_ICON, MARKER_ICON_2X, MARKER_SHADOW } from '../assets/leaflet/leafletSource';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.85;

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelectLocation: (location: { latitude: number; longitude: number }) => void;
    initialLocation: { latitude: number; longitude: number } | null;
}

export default function ManualLocationPicker({ visible, onClose, onSelectLocation, initialLocation }: Props) {
    const { colors, settings } = useSettings();
    const slideAnim = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const [isFullyClosed, setIsFullyClosed] = useState(true);
    const [selectedPos, setSelectedPos] = useState(initialLocation);

    useEffect(() => {
        const backAction = () => {
            if (visible) {
                onClose();
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        if (visible) {
            setIsFullyClosed(false);
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 25,
                    stiffness: 240,
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
            ]).start(({ finished }) => {
                if (finished) setIsFullyClosed(true);
            });
        }

        return () => backHandler.remove();
    }, [visible, onClose]);

    const handleMapMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'locationSelected') {
                setSelectedPos({ latitude: data.lat, longitude: data.lng });
            }
        } catch (e) {
            console.warn('Map message error:', e);
        }
    };

    const handleConfirm = () => {
        if (selectedPos) {
            onSelectLocation(selectedPos);
            onClose();
        }
    };

    if (!visible && isFullyClosed) return null;

    const startLat = selectedPos?.latitude || 30.0444; // Default to Cairo or some neutral point if none
    const startLng = selectedPos?.longitude || 31.2357;

    const leafletHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          ${LEAFLET_CSS}
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; background: ${colors.bg}; }
          .leaflet-tile { 
            filter: ${settings.theme === 'dark' ? 'invert(100%) hue-rotate(180deg) brightness(85%) contrast(85%)' : 'none'}; 
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          ${LEAFLET_JS}
          
          const DefaultIcon = L.icon({
            iconUrl: '${MARKER_ICON}',
            iconRetinaUrl: '${MARKER_ICON_2X}',
            shadowUrl: '${MARKER_SHADOW}',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });
          L.Marker.prototype.options.icon = DefaultIcon;

          const map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([${startLat}, ${startLng}], 10);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

          let marker;
          if (${!!selectedPos}) {
            marker = L.marker([${startLat}, ${startLng}]).addTo(map);
          }

          map.on('click', function(e) {
            const { lat, lng } = e.latlng;
            if (marker) {
                marker.setLatLng(e.latlng);
            } else {
                marker = L.marker(e.latlng).addTo(map);
            }
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelected',
                lat: lat,
                lng: lng
            }));
          });
        </script>
      </body>
    </html>
    `;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={isFullyClosed ? 'none' : 'auto'}>
            <Animated.View
                style={[
                    styles.backdrop,
                    { opacity: backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }) },
                ]}
            >
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
            </Animated.View>

            <Animated.View
                style={[
                    styles.drawer,
                    {
                        backgroundColor: colors.card,
                        transform: [{ translateY: slideAnim }],
                        borderColor: colors.cardBorder,
                        borderTopWidth: 1,
                        zIndex: 10,
                    }
                ]}
            >
                <View style={styles.handleContainer}>
                    <View style={[styles.handle, { backgroundColor: colors.cardBorder }]} />
                </View>

                <View style={styles.header}>
                    <View>
                        <Text style={[styles.title, { color: colors.textBright }]}>Set Manual Location</Text>
                        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Tap on map to set your position</Text>
                    </View>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={26} color={colors.text} />
                    </Pressable>
                </View>

                <View style={styles.mapContainer}>
                    <WebView
                        originWhitelist={['*']}
                        source={{ html: leafletHtml }}
                        style={styles.map}
                        onMessage={handleMapMessage}
                    />
                </View>

                <View style={[styles.footer, { paddingBottom: spacing.xl + 10 }]}>
                    <TouchableOpacity
                        style={[
                            styles.confirmButton,
                            { backgroundColor: colors.accent, opacity: selectedPos ? 1 : 0.5 }
                        ]}
                        onPress={handleConfirm}
                        disabled={!selectedPos}
                    >
                        <Text style={styles.confirmButtonText}>Confirm Location</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
}

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
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        overflow: 'hidden',
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    handle: {
        width: 42,
        height: 6,
        borderRadius: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    title: {
        fontSize: 20,
        ...fonts.bold,
    },
    subtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapContainer: {
        flex: 1,
        backgroundColor: '#eee',
    },
    map: {
        flex: 1,
    },
    footer: {
        padding: spacing.lg,
    },
    confirmButton: {
        height: 56,
        borderRadius: radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFF',
        fontSize: 16,
        ...fonts.bold,
    },
});
