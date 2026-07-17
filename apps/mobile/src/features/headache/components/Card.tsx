import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HT } from '../theme';
import { T } from '../../../theme/tokens';
import { FluentIcon, type FluentIconName } from '../../../components/FluentIcon';

interface Props {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  icon?: FluentIconName;
}

export function Card({ title, right, children, icon }: Props) {
  return (
    <View style={styles.card}>
      {(title || right) && (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {icon ? (
              <View style={styles.iconWrap}>
                <FluentIcon name={icon} size={16} color={HT.primary} />
              </View>
            ) : (
              <View style={styles.accent} />
            )}
            <Text style={styles.title}>{title}</Text>
          </View>
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: HT.surface,
    borderRadius: T.radius.xl,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: HT.border,
    ...T.shadow.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  accent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: HT.primaryMid,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: HT.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(133,183,191,0.25)',
  },
  title: { flex: 1, fontSize: 16, fontWeight: '800', color: HT.text, letterSpacing: -0.2 },
});
