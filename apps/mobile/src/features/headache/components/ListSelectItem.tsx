import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HT } from '../theme';
import { FluentIcon, type FluentIconName } from '../../../components/FluentIcon';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Ícone Fluent (MaterialCommunityIcons). Emojis não são aceitos. */
  icon?: FluentIconName;
}

/** Card de seleção (multi ou única) com ícone opcional à esquerda. */
export function ListSelectItem({ label, selected, onPress, icon }: Props) {
  return (
    <TouchableOpacity
      style={[styles.item, selected && styles.itemSelected]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {icon ? (
        <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
          <FluentIcon name={icon} size={18} color={selected ? HT.primary : HT.muted} />
        </View>
      ) : null}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      <View style={[styles.check, selected && styles.checkSelected]}>
        {selected ? <FluentIcon name="check" size={14} color={HT.onPrimary} /> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HT.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: HT.border,
  },
  itemSelected: {
    backgroundColor: HT.primarySoft,
    borderColor: HT.primaryMid,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: HT.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapSelected: {
    backgroundColor: HT.white,
    borderWidth: 1,
    borderColor: 'rgba(133,183,191,0.35)',
  },
  label: { flex: 1, fontSize: 15, color: HT.text },
  labelSelected: { fontWeight: '600' },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: HT.mutedLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: { backgroundColor: HT.primary, borderColor: HT.primary },
});
