-- Cria bucket 'documents' (privado) se não existir.
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para 'documents' (privado).
-- Upload: qualquer usuário autenticado (a API valida propriedade no handler).
CREATE POLICY "documents_allow_authenticated_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Leitura/atualização/remoção: somente service_role (a API gera signed URLs).
CREATE POLICY "documents_allow_service_role_select"
  ON storage.objects FOR SELECT
  TO service_role
  USING (bucket_id = 'documents');

CREATE POLICY "documents_allow_service_role_update"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'documents');

CREATE POLICY "documents_allow_service_role_delete"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'documents');

-- Políticas equivalentes para 'exams' (bucket já existente, sem RLS antes).
CREATE POLICY "exams_allow_authenticated_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'exams');

CREATE POLICY "exams_allow_service_role_select"
  ON storage.objects FOR SELECT
  TO service_role
  USING (bucket_id = 'exams');

CREATE POLICY "exams_allow_service_role_update"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'exams');

CREATE POLICY "exams_allow_service_role_delete"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'exams');
