import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HT } from '../theme';

interface Props {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  icon?: string;
}

export function Card({ title, right, children, icon }: Props) {
  return (
    <View style={styles.card}>
      {(title || right) && (
        <View style={styles.header}>
          <Text style={styles.title}>
            {icon ? `${icon} ` : ''}
            {title}
          </Text>
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 15, fontWeight: '700', color: HT.text },
});
