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
import { TargetResult } from '../types';

import { LEAFLET_CSS, LEAFLET_JS, MARKER_ICON, MARKER_ICON_2X, MARKER_SHADOW, LEAFLET_HEAT_JS } from '../assets/leaflet/leafletSource';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.75;

interface Props {
    visible: boolean;
    userLocation: { latitude: number; longitude: number } | null;
    history: TargetResult[];
    onClose: () => void;
}

export default function GlobalHistoryMap({ visible, userLocation, history, onClose }: Props) {
    const { colors, settings } = useSettings();
    const slideAnim = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const [isFullyClosed, setIsFullyClosed] = useState(true);
    const [showHeatmap, setShowHeatmap] = useState(false);

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
            ]).start(() => {
                setIsFullyClosed(true);
            });
        }

        return () => backHandler.remove();
    }, [visible, onClose]);

    if (!visible && isFullyClosed) return null;

    const maxDistance = history.reduce((max, r) => Math.max(max, r.distance ?? 0), 0);
    const zoom = maxDistance > 0 ? (maxDistance > 5000 ? 11 : maxDistance > 1000 ? 13 : 15) : 15;

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
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          ${LEAFLET_JS}
          ${LEAFLET_HEAT_JS}
          
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

          // Add Marker for user
          const userMarker = L.marker([${userLocation.latitude}, ${userLocation.longitude}]).bindPopup("Your Location");
          ${!showHeatmap ? 'userMarker.addTo(map);' : ''}

          const allMarkers = [userMarker];
          const heatData = [];

          // Add Targets
          ${history.map((r) => {
        if (!r.distance || r.distance <= 0) return '';

        if (settings.directionMode === 'sensor') {
            const heading = r.heading ?? 0;
            return `
                      (function() {
                          const R = 6371e3;
                          const brng = ${heading} * Math.PI / 180;
                          const originLat = ${r.latitude ?? userLocation.latitude};
                          const originLon = ${r.longitude ?? userLocation.longitude};
                          const lat1 = originLat * Math.PI / 180;
                          const lon1 = originLon * Math.PI / 180;
                          
                          // Project 3D line to 2D Ground: ground = slant * cos(tilt)
                          const tiltVal = ${r.tilt ?? 0};
                          const clampedTilt = Math.min(90, Math.max(0, Math.abs(tiltVal)));
                          const tiltRad = clampedTilt * Math.PI / 180;
                          const groundDist = ${r.distance} * Math.cos(tiltRad);

                          const lat2 = Math.asin(Math.sin(lat1) * Math.cos(groundDist / R) +
                                              Math.cos(lat1) * Math.sin(groundDist / R) * Math.cos(brng));
                          const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(groundDist / R) * Math.cos(lat1),
                                                      Math.cos(groundDist / R) - Math.sin(lat1) * Math.sin(lat2));
                                                      
                          const fLat = lat2 * 180 / Math.PI;
                          const fLon = lon2 * 180 / Math.PI;
                          
                          // Draw the projected 2D Ground Line
                          const line = L.polyline([[originLat, originLon], [fLat, fLon]], { 
                              color: '${colors.danger}', 
                              weight: 1, 
                              opacity: 0.6 
                          });
                          ${!showHeatmap ? 'line.addTo(map);' : ''}

                          const tgtIcon = L.divIcon({
                              html: '<div style="width: 16px; height: 16px; transform: rotate(${heading}deg); transform-origin: center center; display: flex; align-items: center; justify-content: center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="${colors.danger}" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 0px 1px rgba(0,0,0,0.5));"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg></div>',
                              className: '',
                              iconSize: [16, 16],
                              iconAnchor: [8, 8]
                          });
                          
                          let popupDesc = "Target ${r.index + 1}: ${r.distance.toFixed(0)}m (Sound Range)<br/>" +
                                      "Ground Dist: " + Math.round(groundDist) + "m<br/>" +
                                      "Heading: ${Math.round(heading)}°";
                          if (tiltVal !== 0) popupDesc += " • Tilt: " + Math.round(tiltVal) + "°";

                          const m = L.marker([fLat, fLon], { icon: tgtIcon }).bindPopup(popupDesc);
                          ${!showHeatmap ? 'm.addTo(map);' : ''}
                          allMarkers.push(m);
                          heatData.push([fLat, fLon, 1]);
                      })();
                  `;
        } else {
            return `
                      (function() {
                          const originLat = ${r.latitude ?? userLocation.latitude};
                          const originLon = ${r.longitude ?? userLocation.longitude};
                          
                          // Project 3D line to 2D Ground for radius: ground = slant * cos(tilt)
                          const tiltVal = ${r.tilt ?? 0};
                          const clampedTilt = Math.min(90, Math.max(0, Math.abs(tiltVal)));
                          const tiltRad = clampedTilt * Math.PI / 180;
                          const groundDist = ${r.distance} * Math.cos(tiltRad);

                          const c = L.circle([originLat, originLon], {
                              color: '${colors.accent}',
                              fillColor: '${colors.accent}',
                              fillOpacity: 0.1,
                              weight: 2,
                              radius: groundDist
                          }).bindPopup("Target ${r.index + 1}: ${r.distance.toFixed(0)}m (Ground: " + Math.round(groundDist) + "m)");
                          ${!showHeatmap ? 'c.addTo(map);' : ''}
                          allMarkers.push(c);
                          heatData.push([originLat, originLon, 1]);
                      })();
                  `;
        }
    }).join('\n')}

    ${showHeatmap ? `
        if (heatData.length > 0) {
            L.heatLayer(heatData, { radius: 35, blur: 25, maxZoom: 17, max: 1.0 }).addTo(map);
        }
    ` : ''}

if (allMarkers.length > 1) {
    const group = new L.featureGroup(allMarkers);
    map.fitBounds(group.getBounds(), { padding: [30, 30] });
}
        </script >
      </body >
    </html >
    ` : '';

    return (
        <View
            style={[StyleSheet.absoluteFill, { zIndex: visible ? 1000 : (isFullyClosed ? -1 : 1000) }]}
            pointerEvents={visible ? 'auto' : 'none'}
        >
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
                    <Text style={[styles.title, { color: colors.textBright }]}>All Targets Map</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Pressable
                            onPress={() => setShowHeatmap(!showHeatmap)}
                            style={({ pressed }) => [
                                styles.closeButton,
                                {
                                    backgroundColor: showHeatmap ? colors.danger + '33' : colors.cardBorder,
                                    marginRight: spacing.sm,
                                    opacity: pressed ? 0.6 : 1,
                                    transform: [{ scale: pressed ? 0.95 : 1 }]
                                }
                            ]}
                            hitSlop={15}
                        >
                            <Ionicons name="flame" size={18} color={showHeatmap ? colors.danger : colors.text} />
                        </Pressable>
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
                            hitSlop={15}
                        >
                            <Ionicons name="close" size={20} color={colors.text} />
                        </Pressable>
                    </View>
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
