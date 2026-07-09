import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!mounted) return;
      // #region agent log
      fetch('http://127.0.0.1:7273/ingest/359a14c5-d90b-477e-becc-c780dfc72bc1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'603b9b'},body:JSON.stringify({sessionId:'603b9b',location:'useSession.ts:18',message:'onAuthStateChange',data:{event:_event,hasNext:!!next},timestamp:Date.now(),runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      setSession(next);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
