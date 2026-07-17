import { StyleSheet, Text, View } from 'react-native';
import { HT } from '../theme';

interface Props {
  /** Texto antes da palavra destacada. */
  before?: string;
  /** Palavra destacada na cor primária. */
  highlight?: string;
  /** Texto após a palavra destacada. */
  after?: string;
  subtitle?: string;
}

/** Título grande do passo, com uma palavra-chave em destaque (cor primária). */
export function WizardTitle({ before, highlight, after, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {before}
        {highlight ? <Text style={styles.highlight}>{highlight}</Text> : null}
        {after}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18 },
  title: { fontSize: 27, fontWeight: '800', color: HT.text, textAlign: 'center', lineHeight: 33, letterSpacing: -0.6 },
  highlight: { color: HT.primary },
  subtitle: { fontSize: 14, color: HT.muted, textAlign: 'center', marginTop: 8 },
});
