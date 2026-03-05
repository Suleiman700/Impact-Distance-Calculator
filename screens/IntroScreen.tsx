import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    interpolate,
    useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useSettings } from '../contexts/SettingsContext';
import { spacing, radius, fonts } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Slide {
    id: string;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
}

const slides: Slide[] = [
    {
        id: '1',
        title: 'See the Flash',
        description: 'When you witness a distant explosion or impact, immediately tap the recording button to start the timer.',
        icon: 'flash-outline',
        color: '#FFD700',
    },
    {
        id: '2',
        title: 'Hear the Sound',
        description: 'Wait for the sound wave to reach you. As soon as you hear the impact, tap the button again to stop the timer.',
        icon: 'volume-high-outline',
        color: '#00BFFF',
    },
    {
        id: '3',
        title: 'Triangulate',
        description: 'The app calculates the distance based on the speed of sound and shows you the approximate location on a map.',
        icon: 'map-outline',
        color: '#32CD32',
    },
];

const SlideItem = ({ item, index, scrollX, colors }: { item: Slide; index: number; scrollX: Animated.SharedValue<number>; colors: any }) => {
    const animatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollX.value,
            [(index - 0.5) * width, index * width, (index + 0.5) * width],
            [0, 1, 0],
            'clamp'
        );
        const scale = interpolate(
            scrollX.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [0.8, 1, 0.8],
            'clamp'
        );
        return {
            opacity,
            transform: [{ scale }],
        };
    });

    return (
        <View style={[styles.slide, { width }]}>
            <Animated.View style={[styles.iconContainer, { backgroundColor: item.color + '20' }, animatedStyle]}>
                <Ionicons name={item.icon} size={100} color={item.color} />
            </Animated.View>
            <Animated.View style={[styles.textContainer, animatedStyle]}>
                <Text style={[styles.title, { color: colors.textBright }]}>{item.title}</Text>
                <Text style={[styles.description, { color: colors.textMuted }]}>{item.description}</Text>
            </Animated.View>
        </View>
    );
};

const PaginationDot = ({ index, scrollX, colors }: { index: number; scrollX: Animated.SharedValue<number>; colors: any }) => {
    const animatedStyle = useAnimatedStyle(() => {
        const dotWidth = interpolate(
            scrollX.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [10, 30, 10],
            'clamp'
        );
        const opacity = interpolate(
            scrollX.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [0.3, 1, 0.3],
            'clamp'
        );
        return {
            width: dotWidth,
            opacity,
        };
    });
    return (
        <Animated.View
            style={[styles.dot, { backgroundColor: colors.accent }, animatedStyle]}
        />
    );
};

export default function IntroScreen({ navigation }: any) {
    const { settings, colors, updateSettings } = useSettings();
    const scrollX = useSharedValue(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
    });

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        if (settings.showOnboarding) {
            updateSettings({ showOnboarding: false });
            navigation.replace('Home');
        } else {
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.replace('Home');
            }
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={colors.statusBar} />

            <View style={styles.header}>
                <TouchableOpacity onPress={handleComplete}>
                    <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
                </TouchableOpacity>
            </View>

            <Animated.FlatList
                ref={flatListRef}
                data={slides}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(event) => {
                    setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / width));
                }}
                renderItem={({ item, index }) => (
                    <SlideItem item={item} index={index} scrollX={scrollX} colors={colors} />
                )}
            />

            <View style={styles.footer}>
                <View style={styles.pagination}>
                    {slides.map((_, index) => (
                        <PaginationDot key={index} index={index} scrollX={scrollX} colors={colors} />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.accent }]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>
                        {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        alignItems: 'flex-end',
    },
    skipText: {
        fontSize: 16,
        ...fonts.bold,
    },
    slide: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    iconContainer: {
        width: 200,
        height: 200,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        textAlign: 'center',
        marginBottom: spacing.md,
        ...fonts.bold,
    },
    description: {
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 26,
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xxl,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    dot: {
        height: 10,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    button: {
        height: 60,
        borderRadius: radius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        ...fonts.bold,
    },
});
