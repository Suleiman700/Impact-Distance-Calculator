import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    SectionList,
    Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, fonts } from '../theme';
import { useSettings } from '../contexts/SettingsContext';
import { useHistory } from '../contexts/HistoryContext';
import { formatDistance } from '../utils/calculateDistance';
import { TargetResult, Session } from '../types';
import ShareSummaryCard from '../components/ShareSummaryCard';
import ExportModal from '../components/ExportModal';

type TabId = 'records' | 'missions';

export default function HistoryScreen({ navigation }: any) {
    const { colors } = useSettings();
    const { settings } = useSettings();
    const insets = useSafeAreaInsets();
    const { history, sessions, activeSession, deleteResult, deleteSession, clearHistory } = useHistory();
    const [activeTab, setActiveTab] = useState<TabId>('records');
    const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
    const [exportModalVisible, setExportModalVisible] = useState(false);

    // Group records by session
    const sections = useMemo(() => {
        const noSession = history.filter(r => !r.sessionId);
        const result: { title: string; sessionId?: string; data: TargetResult[]; session?: Session }[] = [];

        // Sessions with records
        sessions.forEach(s => {
            const records = history.filter(r => r.sessionId === s.id);
            if (records.length > 0) {
                result.push({ title: s.name, sessionId: s.id, data: records, session: s });
            }
        });

        // Unsessioned records
        if (noSession.length > 0) {
            result.push({ title: 'No Mission', data: noSession });
        }

        return result;
    }, [history, sessions]);

    const totalRecords = history.length;
    const avgDist = totalRecords > 0
        ? history.reduce((s, r) => s + (r.distance || 0), 0) / totalRecords
        : 0;
    const maxDist = totalRecords > 0
        ? Math.max(...history.map(r => r.distance || 0))
        : 0;

    const handleDeleteRecord = (timestamp: number) => {
        Alert.alert('Delete Record', 'Remove this record?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: () => deleteResult(timestamp)
            },
        ]);
    };

    const handleDeleteSession = (s: Session) => {
        Alert.alert(
            'Delete Mission',
            `Delete "${s.name}" and all its records?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: () => deleteSession(s.id)
                },
            ]
        );
    };

    const handleClearAll = () => {
        Alert.alert('Clear All Data', 'This will permanently delete all records and missions.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Clear All', style: 'destructive',
                onPress: clearHistory
            },
        ]);
    };

    const handleExportCSV = () => {
        if (history.length === 0) {
            Alert.alert('No Data', 'There are no records to export.');
            return;
        }
        const header = 'Target,Distance,Duration(s),Heading(°),Tilt(°),Latitude,Longitude,Session,Timestamp';
        const rows = history.map(r => {
            const session = sessions.find(s => s.id === r.sessionId);
            return [
                r.index + 1,
                r.distance?.toFixed(1) ?? '',
                r.duration?.toFixed(3) ?? '',
                r.heading?.toFixed(1) ?? '',
                r.tilt?.toFixed(1) ?? '',
                r.latitude?.toFixed(7) ?? '',
                r.longitude?.toFixed(7) ?? '',
                `"${session?.name ?? ''}"`,
                new Date(r.timestamp || 0).toISOString(),
            ].join(',');
        });
        const csv = [header, ...rows].join('\n');
        Share.share({ message: csv, title: 'Impact Distance Records' });
    };

    const handleExportJSON = () => {
        if (history.length === 0) {
            Alert.alert('No Data', 'There are no records to export.');
            return;
        }
        const exportData = history.map(r => {
            const session = sessions.find(s => s.id === r.sessionId);
            return {
                ...r,
                sessionName: session?.name ?? null,
                date: new Date(r.timestamp || 0).toISOString()
            };
        });
        const jsonData = JSON.stringify(exportData, null, 2);
        Share.share({ message: jsonData, title: 'Impact Distance Records (JSON)' });
    };

    const toggleSession = (id: string) => {
        setExpandedSessions(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const renderRecord = (r: TargetResult, i: number, totalInGroup: number) => (
        <View
            key={r.timestamp || i}
            style={[
                styles.recordRow,
                {
                    borderBottomColor: colors.cardBorder,
                    borderBottomWidth: i < totalInGroup - 1 ? 1 : 0,
                    backgroundColor: colors.card,
                }
            ]}
        >
            <View style={[styles.indexBadge, { backgroundColor: colors.accentDim }]}>
                <Text style={[styles.indexText, { color: colors.accent }]}>T{r.index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.recordDist, { color: colors.textBright }]}>
                    {formatDistance(r.distance, settings.unit)}
                </Text>
                <Text style={[styles.recordMeta, { color: colors.textMuted }]}>
                    {r.duration?.toFixed(3)}s
                    {r.heading != null ? ` • ${Math.round(r.heading)}°` : ''}
                    {r.tilt != null ? ` • Tilt ${Math.round(r.tilt)}°` : ''}
                </Text>
            </View>
            <Text style={[styles.recordTime, { color: colors.textMuted }]}>
                {new Date(r.timestamp || 0).toLocaleTimeString('en-GB', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                })}
            </Text>
            <TouchableOpacity
                onPress={() => handleDeleteRecord(r.timestamp!)}
                hitSlop={12}
                style={{ marginLeft: spacing.sm }}
            >
                <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
            <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />

            {/* Header */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.textBright} />
                </TouchableOpacity>
                <Text style={[styles.pageTitle, { color: colors.textBright }]}>History</Text>
                <TouchableOpacity onPress={() => setExportModalVisible(true)} hitSlop={12}>
                    <Ionicons name="share-outline" size={22} color={colors.accent} />
                </TouchableOpacity>
            </View>

            {/* Summary Stats */}
            {totalRecords > 0 && (
                <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.accent }]}>{totalRecords}</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Records</Text>
                    </View>
                    <View style={[styles.statDiv, { backgroundColor: colors.cardBorder }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.accent }]}>
                            {formatDistance(avgDist, settings.unit)}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Avg Distance</Text>
                    </View>
                    <View style={[styles.statDiv, { backgroundColor: colors.cardBorder }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.danger }]}>
                            {formatDistance(maxDist, settings.unit)}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Max Distance</Text>
                    </View>
                    <View style={[styles.statDiv, { backgroundColor: colors.cardBorder }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.text }]}>{sessions.length}</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Missions</Text>
                    </View>
                </View>
            )}

            {/* Tabs */}
            <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                {(['records', 'missions'] as TabId[]).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[
                            styles.tab,
                            activeTab === tab && { backgroundColor: colors.accent }
                        ]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === tab ? '#FFF' : colors.textMuted }
                        ]}>
                            {tab === 'records' ? 'Records' : 'Missions'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            {activeTab === 'records' ? (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
                    {sections.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="document-outline" size={48} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No records yet</Text>
                        </View>
                    ) : (
                        sections.map((section, si) => (
                            <View key={section.sessionId ?? 'unsessioned'} style={{ marginBottom: spacing.md }}>
                                {/* Section Header */}
                                <View style={styles.sectionHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.sectionTitle, { color: colors.textBright }]}>
                                            {section.title}
                                        </Text>
                                        {section.session && (
                                            <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
                                                {new Date(section.session.createdAt).toLocaleDateString('en-GB', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })}
                                                {section.session.endedAt
                                                    ? ` – ${new Date(section.session.endedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                                                    : activeSession?.id === section.session.id ? ' • Active' : ''}
                                            </Text>
                                        )}
                                    </View>
                                    <ShareSummaryCard
                                        results={section.data}
                                        activeSession={section.session ?? null}
                                        iconOnly
                                    />
                                </View>

                                {/* Records under this section */}
                                <View style={[styles.recordGroup, { borderColor: colors.cardBorder }]}>
                                    {section.data.map((r, i) => renderRecord(r, i, section.data.length))}
                                </View>
                            </View>
                        ))
                    )}

                    {history.length > 0 && (
                        <TouchableOpacity
                            style={[styles.dangerButton, { borderColor: colors.danger }]}
                            onPress={handleClearAll}
                        >
                            <Ionicons name="trash-outline" size={16} color={colors.danger} style={{ marginRight: 6 }} />
                            <Text style={[styles.dangerText, { color: colors.danger }]}>Clear All Data</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            ) : (
                // MISSIONS TAB
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
                    {sessions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="flag-outline" size={48} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No missions yet</Text>
                            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                                Start a mission from the home screen to group your recordings
                            </Text>
                        </View>
                    ) : (
                        sessions.map(s => {
                            const records = history.filter(r => r.sessionId === s.id);
                            const isActive = activeSession?.id === s.id;
                            const isExpanded = expandedSessions.has(s.id);
                            const mDist = records.length > 0 ? Math.max(...records.map(r => r.distance || 0)) : 0;

                            return (
                                <View
                                    key={s.id}
                                    style={[styles.missionCard, {
                                        backgroundColor: colors.card,
                                        borderColor: isActive ? colors.danger : colors.cardBorder,
                                    }]}
                                >
                                    <TouchableOpacity
                                        style={styles.missionHeader}
                                        onPress={() => toggleSession(s.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.missionDot, {
                                            backgroundColor: isActive ? colors.danger : colors.textMuted
                                        }]} />
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Text style={[styles.missionName, { color: colors.textBright }]}>
                                                    {s.name}
                                                </Text>
                                                {isActive && (
                                                    <View style={[styles.activeBadge, { backgroundColor: colors.danger + '22' }]}>
                                                        <Text style={[styles.activeBadgeText, { color: colors.danger }]}>ACTIVE</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={[styles.missionMeta, { color: colors.textMuted }]}>
                                                {new Date(s.createdAt).toLocaleString('en-GB', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                                {' · '}{records.length} records
                                                {mDist > 0 ? ' · Max: ' + formatDistance(mDist, settings.unit) : ''}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                                            {records.length > 0 && (
                                                <ShareSummaryCard results={records} activeSession={s} iconOnly />
                                            )}
                                            <TouchableOpacity
                                                onPress={() => handleDeleteSession(s)}
                                                hitSlop={10}
                                            >
                                                <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                                            </TouchableOpacity>
                                            <Ionicons
                                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                                size={16}
                                                color={colors.textMuted}
                                            />
                                        </View>
                                    </TouchableOpacity>

                                    {isExpanded && records.length > 0 && (
                                        <View style={[styles.missionRecords, { borderTopColor: colors.cardBorder }]}>
                                            {records.map((r, i) => renderRecord(r, i, records.length))}
                                        </View>
                                    )}
                                    {isExpanded && records.length === 0 && (
                                        <View style={[styles.missionRecords, { borderTopColor: colors.cardBorder }]}>
                                            <Text style={[styles.recordMeta, { color: colors.textMuted, padding: spacing.md }]}>
                                                No records in this mission
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}

                    {sessions.length > 0 && (
                        <TouchableOpacity
                            style={[styles.dangerButton, { borderColor: colors.danger, marginTop: spacing.sm }]}
                            onPress={handleClearAll}
                        >
                            <Ionicons name="trash-outline" size={16} color={colors.danger} style={{ marginRight: 6 }} />
                            <Text style={[styles.dangerText, { color: colors.danger }]}>Clear All Data</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            )}

            <ExportModal
                visible={exportModalVisible}
                onClose={() => setExportModalVisible(false)}
                onExportCSV={handleExportCSV}
                onExportJSON={handleExportJSON}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    backBtn: { marginRight: spacing.md },
    pageTitle: {
        fontSize: 22,
        ...fonts.bold,
        flex: 1,
    },
    statsCard: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        overflow: 'hidden',
    },
    statItem: {
        flex: 1,
        padding: spacing.md,
        alignItems: 'center',
    },
    statDiv: { width: 1 },
    statValue: {
        fontSize: 15,
        ...fonts.bold,
        textAlign: 'center',
    },
    statLabel: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 2,
    },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        padding: 4,
        gap: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 14,
        ...fonts.semiBold,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 80,
        gap: spacing.md,
    },
    emptyText: {
        fontSize: 18,
        ...fonts.semiBold,
    },
    emptySubtext: {
        fontSize: 13,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
        lineHeight: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        fontSize: 15,
        ...fonts.semiBold,
    },
    sectionMeta: {
        fontSize: 11,
        marginTop: 2,
    },
    recordGroup: {
        borderRadius: radius.md,
        borderWidth: 1,
        overflow: 'hidden',
    },
    recordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    indexBadge: {
        width: 32,
        height: 32,
        borderRadius: radius.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    indexText: {
        fontSize: 12,
        ...fonts.bold,
    },
    recordDist: {
        fontSize: 15,
        ...fonts.semiBold,
    },
    recordMeta: {
        fontSize: 11,
        marginTop: 1,
    },
    recordTime: {
        fontSize: 11,
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: radius.md,
        paddingVertical: spacing.md,
        marginTop: spacing.md,
    },
    dangerText: {
        fontSize: 14,
        ...fonts.medium,
    },
    missionCard: {
        borderRadius: radius.lg,
        borderWidth: 1,
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    missionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.sm,
    },
    missionDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    missionName: {
        fontSize: 15,
        ...fonts.semiBold,
    },
    activeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    activeBadgeText: {
        fontSize: 9,
        ...fonts.bold,
        letterSpacing: 0.5,
    },
    missionMeta: {
        fontSize: 11,
        marginTop: 2,
    },
    missionRecords: {
        borderTopWidth: 1,
    },
});
