export interface ThemeColors {
    bg: string;
    card: string;
    cardBorder: string;
    accent: string;
    accentDim: string;
    text: string;
    textBright: string;
    textMuted: string;
    recording: string;
    recordingDim: string;
    success: string;
    successDim: string;
    danger: string;
    statusBar: 'dark-content' | 'light-content';
}

export const lightColors: ThemeColors = {
    bg: '#F2F4F7',
    card: '#FFFFFF',
    cardBorder: '#E4E7EC',
    accent: '#2E7CF6',
    accentDim: '#2E7CF622',
    text: '#344054',
    textBright: '#101828',
    textMuted: '#98A2B3',
    recording: '#F04438',
    recordingDim: '#F0443822',
    success: '#12B76A',
    successDim: '#12B76A22',
    danger: '#F04438',
    statusBar: 'dark-content',
};

export const darkColors: ThemeColors = {
    bg: '#0F1115',
    card: '#1A1D24',
    cardBorder: '#2A2D34',
    accent: '#4DA3FF',
    accentDim: '#4DA3FF33',
    text: '#FFFFFFCC',
    textBright: '#FFFFFF',
    textMuted: '#FFFFFF80',
    recording: '#FF6B6B',
    recordingDim: '#FF6B6B33',
    success: '#4ECDC4',
    successDim: '#4ECDC433',
    danger: '#FF6B6B',
    statusBar: 'light-content',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
};

export const fonts = {
    regular: { fontWeight: '400' as const },
    medium: { fontWeight: '500' as const },
    semiBold: { fontWeight: '600' as const },
    bold: { fontWeight: '700' as const },
};
