import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '../lib/api';
import type { MessagesResponse } from '../types';

interface ChatPanelProps {
  patientId: string;
  patientName: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ChatPanel({ patientId, patientName }: ChatPanelProps) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useQuery({
    queryKey: ['messages', patientId],
    queryFn: () => apiGet<MessagesResponse>(`/patients/${patientId}/messages`),
    refetchInterval: 4000,
  });

  // Marca as mensagens do paciente como lidas ao abrir/atualizar.
  useEffect(() => {
    apiPost(`/patients/${patientId}/messages/read`, {}).catch(() => undefined);
  }, [patientId, messagesQuery.data?.messages.length]);

  // Auto-scroll para a última mensagem.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messagesQuery.data?.messages.length]);

  const send = useMutation({
    mutationFn: () => apiPost(`/patients/${patientId}/messages`, { contentText: text.trim() }),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['messages', patientId] });
    },
  });

  const messages = messagesQuery.data?.messages ?? [];

  return (
    <section className="card chat-card">
      <h2>Conversa com {patientName}</h2>

      <div className="chat-messages" ref={listRef}>
        {messagesQuery.isLoading && <p className="muted">Carregando…</p>}
        {!messagesQuery.isLoading && messages.length === 0 && (
          <p className="muted">Nenhuma mensagem ainda. Inicie a conversa.</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`bubble ${m.senderType === 'doctor' ? 'bubble--mine' : 'bubble--theirs'}`}
          >
            <div className="bubble-text">{m.contentText}</div>
            <div className="bubble-meta">{formatTime(m.createdAt)}</div>
          </div>
        ))}
      </div>

      <form
        className="chat-composer"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) send.mutate();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva uma mensagem…"
        />
        <button className="btn-primary" type="submit" disabled={send.isPending || !text.trim()}>
          Enviar
        </button>
      </form>
    </section>
  );
}
