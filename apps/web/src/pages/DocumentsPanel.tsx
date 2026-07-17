import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '../lib/api';
import { uploadFileViaSignedUrl } from '../lib/upload';
import type { DocumentsResponse } from '../types';

const DOCUMENT_LABELS: Record<string, string> = {
  recipe: 'Receita assinada',
  exam_result: 'Resultado de exame',
  prescription: 'Prescrição',
  report: 'Laudo',
  other: 'Outro',
};

const ACCEPTED_TYPES = 'application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

interface DocumentsPanelProps {
  patientId: string;
  patientName: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function DocumentsPanel({ patientId, patientName }: DocumentsPanelProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState('recipe');
  const [file, setFile] = useState<File | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const documentsQuery = useQuery({
    queryKey: ['documents', patientId],
    queryFn: () => apiGet<DocumentsResponse>(`/patients/${patientId}/documents`),
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Selecione um arquivo.');

      // Upload para o Supabase Storage via signed URL (URL absoluta).
      const { storagePath } = await uploadFileViaSignedUrl(
        `/patients/${patientId}/documents/sign-upload`,
        { documentType },
        file,
      );

      // Registra no banco
      await apiPost(`/patients/${patientId}/documents`, {
        storagePath,
        documentType,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });
    },
    onSuccess: () => {
      setFile(null);
      setFormErr(null);
      if (fileRef.current) fileRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['documents', patientId] });
    },
    onError: (err) => setFormErr(err instanceof Error ? err.message : 'Erro no upload.'),
  });

  async function downloadDocument(documentId: string) {
    setDownloading(documentId);
    try {
      const res = await apiGet<{ signedUrl: string }>(
        `/patients/${patientId}/documents/${documentId}/download-url`,
      );
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
        Documentos — {patientName}
        {documentsQuery.data && (
          <span className="badge">{documentsQuery.data.documents.length}</span>
        )}
      </h2>

      <form
        className="patient-form"
        style={{ marginBottom: 16 }}
        onSubmit={(e) => {
          e.preventDefault();
          upload.mutate();
        }}
      >
        <label>
          Tipo de documento
          <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
            {Object.entries(DOCUMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Arquivo (PDF, JPG, PNG, DOC)
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </label>
        {formErr && <div className="auth-error">{formErr}</div>}
        <button className="btn-primary" type="submit" disabled={upload.isPending || !file}>
          {upload.isPending ? 'Enviando…' : 'Enviar documento'}
        </button>
      </form>

      {documentsQuery.isLoading && <p className="muted">Carregando…</p>}
      {documentsQuery.data?.documents.length === 0 && (
        <p className="muted">Nenhum documento enviado ainda.</p>
      )}

      <ul className="patient-list">
        {documentsQuery.data?.documents.map((d) => (
          <li
            key={d.id}
            className="patient-item"
            style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}
          >
            <div
              style={{
                display: 'flex',
                width: '100%',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <strong>{DOCUMENT_LABELS[d.documentType] ?? d.documentType}</strong>
              <button
                className="btn-primary"
                style={{ fontSize: 12, padding: '4px 10px' }}
                disabled={downloading === d.id}
                onClick={() => downloadDocument(d.id)}
              >
                {downloading === d.id ? '…' : 'Baixar'}
              </button>
            </div>
            <div className="muted small">{d.fileName}</div>
            <div className="muted small">
              {formatBytes(d.fileSize)} · {d.mimeType} ·{' '}
              {new Date(d.createdAt).toLocaleDateString('pt-BR')}
            </div>
            <span
              className={`tag ${d.uploadedByDoctor ? 'tag--active' : 'tag--inactive'}`}
              style={{ marginTop: 2 }}
            >
              {d.uploadedByDoctor ? 'Enviado pelo médico' : 'Enviado pelo paciente'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
