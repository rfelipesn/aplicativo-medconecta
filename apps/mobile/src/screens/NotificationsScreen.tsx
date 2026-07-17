import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { apiGet, apiPatch, apiPost } from '../lib/api';
import type { AppNotification, NotificationsResponse } from '../types';
import { T } from '../theme/tokens';
import { FluentIcon, IconSquircle } from '../components/FluentIcon';

const C = {
  primary: T.color.primaryStrong,
  onPrimary: T.color.onPrimary,
  bg: T.color.bg,
  surface: T.color.surface,
  text: T.color.text,
  muted: T.color.textSecondary,
  unreadBg: T.color.primarySoft,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Mapeia a notificação (in-app) para a rota destino no app.
 * Espelha `mapNotifToRoute` do hook de push, mas usa `relatedDemandId` do
 * objeto `AppNotification` retornado pela API.
 */
function mapNotifToScreen(item: AppNotification): {
  screen: 'Tabs';
  params: { screen: string; params?: object };
} | { screen: 'Demands'; params: { demandId?: string } } | { screen: 'Documents' } {
  switch (item.type) {
    case 'new_chat_message':
      return { screen: 'Tabs', params: { screen: 'Chat' } };
    case 'new_recipe_request':
    case 'recipe_response':
      return { screen: 'Tabs', params: { screen: 'Receitas' } };
    case 'new_demand':
    case 'demand_response':
      return item.relatedDemandId
        ? { screen: 'Demands', params: { demandId: item.relatedDemandId } }
        : { screen: 'Tabs', params: { screen: 'Notificações' } };
    case 'new_document':
      return { screen: 'Documents' };
    default:
      return { screen: 'Tabs', params: { screen: 'Notificações' } };
  }
}

function NotifItem({ item, onRead, onNavigate }: { item: AppNotification; onRead: (id: string) => void; onNavigate: (item: AppNotification) => void }) {
  return (
    <TouchableOpacity
      style={[styles.item, !item.readAt && styles.itemUnread]}
      onPress={() => {
        if (!item.readAt) onRead(item.id);
        onNavigate(item);
      }}
      activeOpacity={0.7}
    >
      <IconSquircle
        name={item.readAt ? 'bell-outline' : 'bell-ring-outline'}
        color={item.readAt ? T.color.textSecondary : T.color.primaryStrong}
        backgroundColor={item.readAt ? T.color.surfaceMuted : T.color.primarySoft}
        size={40}
      />
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemBody}>{item.body}</Text>
        <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
      </View>
      {!item.readAt && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

export function NotificationsScreen() {
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiGet<NotificationsResponse>('/notifications'),
    refetchInterval: 30_000,
  });

  const markOne = useMutation({
    mutationFn: (id: string) => apiPatch(`/notifications/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: () => apiPost('/notifications/read-all', {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = query.data?.notifications ?? [];
  const unread = query.data?.unreadCount ?? 0;

  function handleNavigate(item: AppNotification) {
    const route = mapNotifToScreen(item);
    // @ts-expect-error — navegação aninhada App > (Tabs | Demands | Documents)
    navigation.navigate('App', route);
  }

  return (
    <View style={styles.root}>
      {unread > 0 && (
        <TouchableOpacity
          style={styles.readAllBtn}
          onPress={() => markAll.mutate()}
          disabled={markAll.isPending}
        >
          <View style={styles.readAllContent}>
            <FluentIcon name="check-all" size={18} color={T.color.white} />
            <Text style={styles.readAllText}>{markAll.isPending ? 'Marcando…' : `Marcar todas lidas (${unread})`}</Text>
          </View>
        </TouchableOpacity>
      )}

      {query.isLoading && <ActivityIndicator color={C.primary} style={{ margin: 16 }} />}

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !query.isLoading ? (
            <Text style={styles.muted}>Sem notificações.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <NotifItem
            item={item}
            onRead={(id) => markOne.mutate(id)}
            onNavigate={handleNavigate}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  readAllBtn: {
    backgroundColor: C.primary,
    margin: 16,
    width: 'auto',
    maxWidth: 728,
    alignSelf: 'center',
    borderRadius: T.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    ...T.shadow.soft,
  },
  readAllContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  readAllText: { color: C.onPrimary, fontWeight: '700' },
  list: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 },
  item: {
    backgroundColor: T.color.acrylicStrong,
    borderRadius: T.radius.lg,
    padding: T.space.md,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: T.color.border,
    ...T.shadow.soft,
  },
  itemUnread: { backgroundColor: '#F1F8F9', borderColor: T.color.primary },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  itemBody: { fontSize: 13, color: C.text, marginBottom: 4 },
  itemDate: { fontSize: 11, color: C.muted },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.primary,
    marginLeft: 8,
  },
  muted: { color: C.muted, textAlign: 'center', marginTop: 16 },
});
