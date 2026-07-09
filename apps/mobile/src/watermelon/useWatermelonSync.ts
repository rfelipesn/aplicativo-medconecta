import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AppState, Platform } from 'react-native';
import { syncDatabase } from './sync';

export function useWatermelonSync(patientId: string | undefined) {
  const patientIdRef = useRef(patientId);
  patientIdRef.current = patientId;
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (isWeb) return;
    if (!patientId) return;

    const syncIfConnected = async () => {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        syncDatabase(patientId).catch(() => undefined);
      }
    };

    syncIfConnected();

    const unsubscribeNet = NetInfo.addEventListener((state) => {
      if (state.isConnected && patientIdRef.current) {
        syncDatabase(patientIdRef.current).catch(() => undefined);
      }
    });

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && patientIdRef.current) {
        syncIfConnected();
      }
    });

    return () => {
      unsubscribeNet();
      subscription.remove();
    };
  }, [isWeb, patientId]);
}
