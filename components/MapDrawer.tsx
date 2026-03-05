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
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.75;

interface Props {
    visible: boolean;
    userLocation: { latitude: number; longitude: number } | null;
    distanceMeters: number;
    heading?: number | null;
    onClose: () => void;
}

export default function MapDrawer({ visible, userLocation, distanceMeters, heading, onClose }: Props) {
    const { colors, settings } = useSettings();
    const slideAnim = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const [isFullyClosed, setIsFullyClosed] = useState(true);

    useEffect(() => {
        const backAction = () => {
            if (visible) {
                onClose();
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

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

    if (!visible && isFullyClosed) return null;

    // Use a slighter wider zoom if heading exists so we can see the start and end easily.
    const zoom = distanceMeters > 0 ? (distanceMeters > 5000 ? 11 : 13) : 15;

    // Generate the HTML for Leaflet
    const leafletHtml = userLocation ? `
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
          
          // Configure icons for offline use
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
          }).setView([${userLocation.latitude}, ${userLocation.longitude}], ${zoom});

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

          // Add Marker at origin
          L.marker([${userLocation.latitude}, ${userLocation.longitude}]).addTo(map).bindPopup("Your Location");

          // Add Radius Circle OR Directional Trace
          if (${distanceMeters} > 0) {
            if ('${settings.directionMode}' === 'sensor') {
              // Draw line and arrow (no circle)
              const compassHeading = ${heading !== null && heading !== undefined ? heading : 0};
              const R = 6371e3; // metres
              const brng = compassHeading * Math.PI / 180;
              const lat1 = ${userLocation.latitude} * Math.PI / 180;
              const lon1 = ${userLocation.longitude} * Math.PI / 180;

              const lat2 = Math.asin(Math.sin(lat1) * Math.cos(${distanceMeters} / R) +
                                   Math.cos(lat1) * Math.sin(${distanceMeters} / R) * Math.cos(brng));
              const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(${distanceMeters} / R) * Math.cos(lat1),
                                           Math.cos(${distanceMeters} / R) - Math.sin(lat1) * Math.sin(lat2));

              const fLat = lat2 * 180 / Math.PI;
              const fLon = lon2 * 180 / Math.PI;

              L.polyline([[${userLocation.latitude}, ${userLocation.longitude}], [fLat, fLon]], { color: '${colors.danger}', dashArray: '5, 5', weight: 2 }).addTo(map);
              
              // Custom Arrow head using an SVG, rotated to the target's heading
              const tgtIcon = L.divIcon({
                html: '<div style="width: 20px; height: 20px; transform: rotate(' + compassHeading + 'deg); transform-origin: center center; display: flex; align-items: center; justify-content: center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="${colors.danger}" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 0px 2px rgba(0,0,0,0.5));"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg></div>',
                className: '',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              });
              
              const headingLabel = Math.round(compassHeading) + '°';
              L.marker([fLat, fLon], { icon: tgtIcon }).addTo(map);
            // L.marker([fLat, fLon], { icon: tgtIcon }).addTo(map).bindPopup("Estimated Target<br/>Heading: " + headingLabel).openPopup();

              // Adjust View to fit the line
              const group = new L.featureGroup([
                  L.marker([${userLocation.latitude}, ${userLocation.longitude}]),
                  L.marker([fLat, fLon])
              ]);
              map.fitBounds(group.getBounds(), { padding: [30, 30] });

            } else {
              // Draw just the circle
              L.circle([${userLocation.latitude}, ${userLocation.longitude}], {
                color: '${colors.accent}',
                fillColor: '${colors.accent}',
                fillOpacity: 0.2,
                radius: ${distanceMeters}
              }).addTo(map);
            }
          }
        </script>
      </body>
    </html>
    ` : '';

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={isFullyClosed ? 'none' : 'auto'}>
            <Animated.View
                style={[
                    styles.backdrop,
                    { opacity: backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }) },
                ]}
            >
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    activeOpacity={1}
                />
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

                <View style={[styles.header, { zIndex: 100, elevation: 20 }]}>
                    <Text style={[styles.title, { color: colors.textBright }]}>Map</Text>
                    <Pressable
                        onPress={onClose}
                        style={({ pressed }) => [
                            styles.closeButton,
                            {
                                backgroundColor: colors.cardBorder,
                                opacity: pressed ? 0.6 : 1,
                                transform: [{ scale: pressed ? 0.95 : 1 }]
                            }
                        ]}
                        hitSlop={30}
                    >
                        <Ionicons name="close" size={26} color={colors.text} />
                    </Pressable>
                </View>

                <View style={[styles.mapContainer, { backgroundColor: colors.bg }]}>
                    {userLocation ? (
                        <WebView
                            originWhitelist={['*']}
                            source={{ html: leafletHtml }}
                            style={styles.map}
                            scrollEnabled={true}
                        />
                    ) : (
                        <View style={styles.noLocation}>
                            <ActivityIndicator size="small" color={colors.accent} style={{ marginBottom: spacing.md }} />
                            <Text style={[styles.noLocationText, { color: colors.textMuted }]}>
                                Determining proximity coordinates...
                            </Text>
                        </View>
                    )}
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
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    title: {
        fontSize: 20,
        ...fonts.bold,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        fontSize: 16,
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    noLocation: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    noLocationText: {
        fontSize: 16,
        textAlign: 'center',
    },
});
