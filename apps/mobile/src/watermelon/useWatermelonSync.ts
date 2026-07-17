import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AppState, Platform } from 'react-native';
import { syncDatabase } from './sync';

/**
 * Sincroniza WatermelonDB (cefaleia, convulsão, chat) com a API.
 *
 * Nativo: NetInfo + AppState (foreground).
 * Web: polling + visibilitychange + online — sem isso, se o primeiro
 * sync no save falhar (sem rede), o dado fica preso até o usuário
 * reabrir o app (bug confirmado: early-return isWeb na linha antiga).
 */
export function useWatermelonSync(patientId: string | undefined) {
  const patientIdRef = useRef(patientId);
  patientIdRef.current = patientId;
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (!patientId) return;

    const runSync = () => {
      const id = patientIdRef.current;
      if (!id) return;
      syncDatabase(id).catch(() => undefined);
    };

    if (isWeb) {
      runSync();

      // Evita dependência de lib "dom" no tsconfig mobile (sem window/document tipados).
      type WebDoc = { visibilityState?: string; addEventListener: (t: string, fn: () => void) => void; removeEventListener: (t: string, fn: () => void) => void };
      type WebWin = { addEventListener: (t: string, fn: () => void) => void; removeEventListener: (t: string, fn: () => void) => void; document?: WebDoc };
      const g = globalThis as unknown as WebWin;
      const doc = g.document;

      const onOnline = () => runSync();
      const onVisible = () => {
        if (doc?.visibilityState === 'visible') runSync();
      };

      g.addEventListener?.('online', onOnline);
      doc?.addEventListener?.('visibilitychange', onVisible);

      // Retry de fila pendente (save offline / sync falhou no save).
      const intervalId = setInterval(runSync, 30_000);

      return () => {
        g.removeEventListener?.('online', onOnline);
        doc?.removeEventListener?.('visibilitychange', onVisible);
        clearInterval(intervalId);
      };
    }

    const syncIfConnected = async () => {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        runSync();
      }
    };

    syncIfConnected();

    const unsubscribeNet = NetInfo.addEventListener((state) => {
      if (state.isConnected && patientIdRef.current) {
        runSync();
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
