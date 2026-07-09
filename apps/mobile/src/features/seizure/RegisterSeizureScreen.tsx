import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';
import type { MeResponse } from '../../types';
import { HT } from './theme';
import { WizardHeader } from './components/WizardHeader';
import { StepperNav } from './components/StepperNav';
import { WizardFooter } from './components/WizardFooter';
import { STEP_COUNT } from './steps/config';
import { emptySeizureDraft, type SeizureDraft } from './types';
import { createSeizureEntry } from './api';
import { StepDate } from './steps/StepDate';
import { StepDuration } from './steps/StepDuration';
import { StepConsciousness } from './steps/StepConsciousness';
import { StepHospital } from './steps/StepHospital';
import { StepMedication } from './steps/StepMedication';
import { StepNotes } from './steps/StepNotes';
import type { StepProps } from './steps/common';

export function RegisterSeizureScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiGet<MeResponse>('/me') });
  const patientId = meQuery.data?.user.patient?.id;

  const [draft, setDraft] = useState<SeizureDraft>(emptySeizureDraft());
  const [stepIndex, setStepIndex] = useState(0);

  const update = (patch: Partial<SeizureDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const save = useMutation({
    mutationFn: async () => {
      if (!patientId) throw new Error('Paciente não identificado.');
      await createSeizureEntry(patientId, draft);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seizure'] });
      navigation.goBack();
      Alert.alert('Pronto', 'Crise registrada com sucesso.');
    },
    onError: (err) =>
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível salvar.'),
  });

  const isLast = stepIndex === STEP_COUNT - 1;
  const stepProps: StepProps = { draft, update };

  function renderStep() {
    switch (stepIndex) {
      case 0: return <StepDate {...stepProps} />;
      case 1: return <StepDuration {...stepProps} />;
      case 2: return <StepConsciousness {...stepProps} />;
      case 3: return <StepHospital {...stepProps} />;
      case 4: return <StepMedication {...stepProps} />;
      case 5: return <StepNotes {...stepProps} />;
      default: return null;
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <WizardHeader onClose={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.flex}>{renderStep()}</View>
        <StepperNav activeIndex={stepIndex} onSelect={setStepIndex} />
        <WizardFooter
          isLast={isLast}
          saving={save.isPending}
          onSave={() => save.mutate()}
          onNext={() => setStepIndex((i) => Math.min(STEP_COUNT - 1, i + 1))}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: HT.wizardBg },
  flex: { flex: 1 },
});
