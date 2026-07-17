import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { T } from '../theme/tokens';

export type FluentIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function FluentIcon({
  name,
  size = 22,
  color = T.color.textSecondary,
}: {
  name: FluentIconName;
  size?: number;
  color?: string;
}) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

export function IconSquircle({
  name,
  color = T.color.primaryStrong,
  backgroundColor = T.color.primarySoft,
  size = 44,
}: {
  name: FluentIconName;
  color?: string;
  backgroundColor?: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.squircle,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.3),
          backgroundColor,
          borderColor: `${color}30`,
        },
      ]}
    >
      <FluentIcon name={name} size={Math.round(size * 0.5)} color={color} />
    </View>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  squircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 2,
    marginBottom: 10,
  },
  sectionAccent: {
    width: 3,
    height: 17,
    borderRadius: 2,
    backgroundColor: T.color.primary,
  },
  sectionTitle: {
    flex: 1,
    color: T.color.text,
    fontFamily: T.family.display,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionAction: {
    color: T.color.primaryStrong,
    fontSize: T.font.caption,
    fontWeight: '700',
  },
});
