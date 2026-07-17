import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FluentIcon, type FluentIconName } from './FluentIcon';
import { T } from '../theme/tokens';

/** Cabeçalho com gradiente Fluent (strip do mockup). */
export function FluentHeader({
  title,
  subtitle,
  right,
  compact,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  compact?: boolean;
}) {
  return (
    <LinearGradient colors={[...T.gradient.header]} style={[styles.header, compact && styles.headerCompact]}>
      <View style={styles.headerOrbLarge} />
      <View style={styles.headerOrbSmall} />
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </LinearGradient>
  );
}

export function FluentCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function FluentEmpty({
  icon = 'inbox-outline',
  title,
  message,
}: {
  icon?: FluentIconName;
  title: string;
  message?: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <FluentIcon name={icon} size={28} color={T.color.primaryStrong} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
    </View>
  );
}

export function FluentLoading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={T.color.primaryStrong} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function FluentScreen({
  children,
  edges = ['top'] as const,
  scroll,
  contentStyle,
}: {
  children: ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  if (scroll) {
    return (
      <SafeAreaView style={styles.root} edges={edges}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.root} edges={edges}>
      <View style={[styles.body, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

export function FluentPrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: FluentIconName;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, (disabled || loading) && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={T.color.onPrimary} />
      ) : (
        <View style={styles.btnRow}>
          {icon ? <FluentIcon name={icon} size={18} color={T.color.onPrimary} /> : null}
          <Text style={styles.primaryBtnText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.color.bg },
  body: { flex: 1 },
  scrollContent: { paddingBottom: 28 },
  header: {
    paddingHorizontal: T.space.md,
    paddingTop: T.space.sm,
    paddingBottom: T.space.lg,
    overflow: 'hidden',
  },
  headerCompact: { paddingBottom: T.space.md },
  headerOrbLarge: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.10)',
    right: -40,
    top: -50,
  },
  headerOrbSmall: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    left: -24,
    bottom: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerText: { flex: 1, minWidth: 0 },
  headerTitle: {
    color: T.color.white,
    fontSize: T.font.title,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: T.color.glassText,
    fontSize: T.font.subhead,
    marginTop: 3,
    fontWeight: '500',
  },
  card: {
    backgroundColor: T.color.acrylicStrong,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.md,
    ...T.shadow.soft,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: T.color.primarySoft,
    borderWidth: 1,
    borderColor: T.color.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: { color: T.color.text, fontSize: T.font.headline, fontWeight: '800' },
  emptyMessage: {
    color: T.color.textSecondary,
    fontSize: T.font.subhead,
    textAlign: 'center',
    lineHeight: 18,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  loadingText: { color: T.color.textSecondary, fontSize: T.font.subhead },
  primaryBtn: {
    backgroundColor: T.color.primaryStrong,
    borderRadius: T.radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: T.color.onPrimary, fontSize: T.font.body, fontWeight: '800' },
  btnDisabled: { opacity: 0.55 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
