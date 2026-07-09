import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { WizardTitle } from '../components/WizardTitle';
import { HeadMap } from '../components/HeadMap';
import { toggle } from '../utils';
import type { StepProps } from './common';

export function StepLocation({ draft, update }: StepProps) {
  const [side, setSide] = useState<'front' | 'back'>('front');

  return (
    <View style={{ flex: 1 }}>
      <WizardTitle before="Onde dói?" />
      <ScrollView contentContainerStyle={styles.content}>
        <HeadMap
          side={side}
          onToggleSide={setSide}
          selectedFront={draft.location.front}
          selectedBack={draft.location.back}
          onToggleRegion={(s, id) =>
            update({
              location: {
                front: s === 'front' ? toggle(draft.location.front, id) : draft.location.front,
                back: s === 'back' ? toggle(draft.location.back, id) : draft.location.back,
              },
            })
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 16 },
});
