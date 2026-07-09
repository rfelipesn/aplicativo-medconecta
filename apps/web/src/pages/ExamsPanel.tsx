import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '../lib/api';
import type { ExamsResponse } from '../types';

const EXAM_LABELS: Record<string, string> = {
  mri: 'Ressonância (MRI)',
  ct: 'Tomografia (TC)',
  eeg: 'Eletroencefalograma (EEG)',
  xray: 'Raio-X',
  blood: 'Exame de sangue',
  other: 'Outro',
};

const ACCEPTED_TYPES = 'application/pdf,image/jpeg,image/png';

interface ExamsPanelProps {
  patientId: string;
  patientName: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function ExamsPanel({ patientId, patientName }: ExamsPanelProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [examType, setExamType] = useState('other');
  const [examDate, setExamDate] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const examsQuery = useQuery({
    queryKey: ['exams', patientId],
    queryFn: () => apiGet<ExamsResponse>(`/patients/${patientId}/exams`),
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Selecione um arquivo.');

      // 1. Pede signed upload URL
      const signed = await apiPost<{ signedUrl: string; storagePath: string }>(`/patients/${patientId}/exams/sign-upload`, {
        examType,
        filename: file.name,
        mimeType: file.type,
      });

      // 2. PUT direto no Storage com a signed URL
      const putRes = await fetch(signed.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error(`Upload falhou no Storage (${putRes.status}).`);

      // 3. Registra no banco
      await apiPost(`/patients/${patientId}/exams`, {
        storagePath: signed.storagePath,
        examType,
        examDate: examDate || undefined,
        fileMimeType: file.type,
        fileSize: file.size,
        userNotes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      setFile(null);
      setNotes('');
      setExamDate('');
      setFormErr(null);
      if (fileRef.current) fileRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['exams', patientId] });
    },
    onError: (err) => setFormErr(err instanceof Error ? err.message : 'Erro no upload.'),
  });

  async function downloadExam(examId: string) {
    setDownloading(examId);
    try {
      const res = await apiGet<{ signedUrl: string }>(`/patients/${patientId}/exams/${examId}/download-url`);
      window.open(res.signedUrl, '_blank');
    } catch {
      alert('Não foi possível gerar o link de download.');
    } finally {
      setDownloading(null);
    }
  }

  return (
    <section className="card">
      <h2>
        Exames — {patientName}
        {examsQuery.data && <span className="badge">{examsQuery.data.exams.length}</span>}
      </h2>

      <form
        className="patient-form"
        style={{ marginBottom: 16 }}
        onSubmit={(e) => { e.preventDefault(); upload.mutate(); }}
      >
        <div className="row">
          <label>
            Tipo de exame
            <select value={examType} onChange={(e) => setExamType(e.target.value)}>
              {Object.entries(EXAM_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Data do exame (opcional)
            <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </label>
        </div>
        <label>
          Arquivo (PDF, JPG, PNG)
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </label>
        <label>
          Observações (opcional)
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Feito em jejum" />
        </label>
        {formErr && <div className="auth-error">{formErr}</div>}
        <button className="btn-primary" type="submit" disabled={upload.isPending || !file}>
          {upload.isPending ? 'Enviando…' : 'Enviar exame'}
        </button>
      </form>

      {examsQuery.isLoading && <p className="muted">Carregando…</p>}
      {examsQuery.data?.exams.length === 0 && <p className="muted">Nenhum exame enviado ainda.</p>}

      <ul className="patient-list">
        {examsQuery.data?.exams.map((e) => (
          <li key={e.id} className="patient-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{EXAM_LABELS[e.examType] ?? e.examType}</strong>
              <button
                className="btn-primary"
                style={{ fontSize: 12, padding: '4px 10px' }}
                disabled={downloading === e.id}
                onClick={() => downloadExam(e.id)}
              >
                {downloading === e.id ? '…' : 'Baixar'}
              </button>
            </div>
            <div className="muted small">
              {formatBytes(e.fileSize)} · {e.fileMimeType}
              {e.examDate && ` · ${new Date(e.examDate).toLocaleDateString('pt-BR')}`}
            </div>
            {e.userNotes && <div className="muted small">{e.userNotes}</div>}
          </li>
        ))}
      </ul>
    </section>
  );
}
