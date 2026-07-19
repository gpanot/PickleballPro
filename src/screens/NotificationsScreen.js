/**
 * NotificationsScreen
 * In-app notification inbox. Marks notifications as read on mount.
 * Accessible from the bell icon on any coach/student screen, and from ProfileScreen.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Bell, CheckCircle, DollarSign, Clock, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { ScreenHeaderShell } from '../components/logbook/ScreenHeader';
import { getMyNotifications, markNotificationsRead } from '../lib/offeringsApi';

const NOTIF_ICON = {
  enrollment_confirmed:  { Icon: CheckCircle, color: '#10B981' },
  enrollment_waitlisted: { Icon: Clock,        color: '#F59E0B' },
  waitlist_promoted:     { Icon: CheckCircle, color: '#10B981' },
  payment_reminder:      { Icon: DollarSign,  color: '#7C3AED' },
  run_cancelled:         { Icon: AlertCircle, color: '#EF4444' },
  new_run_added:         { Icon: Bell,        color: '#3B82F6' },
  session_reminder:      { Icon: Bell,        color: '#6B7280' },
};

export default function NotificationsScreen({ navigation }) {
  const { logbookTheme: t, isDark } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await getMyNotifications();
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      const notifs = data ?? [];
      setNotifications(notifs);

      // Auto-mark all unread as read
      const unread = notifs.filter(n => !n.read_at).map(n => n.id);
      if (unread.length > 0) {
        markNotificationsRead(unread); // fire-and-forget
      }
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const renderItem = ({ item }) => {
    const config = NOTIF_ICON[item.type] ?? { Icon: Bell, color: '#9CA3AF' };
    const { Icon, color } = config;
    const isUnread = !item.read_at;
    const time = new Date(item.created_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    return (
      <View
        style={[
          styles.item,
          {
            backgroundColor: isUnread ? (isDark ? t.surfaceRaised : '#F5F3FF') : t.bg,
            borderColor: isDark ? t.border : '#E5E7EB',
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: color + '15' }]}>
          <Icon size={18} color={color} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]} numberOfLines={1}>
              {item.title}
            </Text>
            {isUnread && <View style={[styles.dot, { backgroundColor: t.accentPurple }]} />}
          </View>
          <Text style={[styles.body, { color: t.textMuted, fontFamily: t.fontBody }]} numberOfLines={3}>
            {item.body}
          </Text>
          <Text style={[styles.time, { color: t.textMuted, fontFamily: t.fontBody }]}>{time}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return <View style={[styles.center, { backgroundColor: t.bg }]}><ActivityIndicator color={t.accentPurple} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeaderShell
        tokens={t}
        isDark={isDark}
        background="bg"
        bordered
        title="Notifications"
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={notifications}
        keyExtractor={n => n.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onRefresh={() => { setRefreshing(true); load(); }}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Bell size={40} color={t.textMuted} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: t.textMuted, fontFamily: t.fontBody }]}>
              No notifications yet.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:      { paddingBottom: 80 },
  item:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderBottomWidth: 1 },
  iconWrap:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  titleRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  dot:       { width: 8, height: 8, borderRadius: 4 },
  title:     { fontSize: 14, flex: 1 },
  body:      { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  time:      { fontSize: 11 },
  empty:     { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
