import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';
import type {
  Document,
  DocumentDownloadResponse,
  DocumentKind,
  DocumentsResponse,
  MeResponse,
} from '../types';

import { T } from '../theme/tokens';
import { FluentIcon, IconSquircle, type FluentIconName } from '../components/FluentIcon';

const C = {
  primary: T.color.primaryStrong,
  onPrimary: T.color.onPrimary,
  bg: T.color.bg,
  surface: T.color.surface,
  text: T.color.text,
  muted: T.color.textSecondary,
  border: T.color.separator,
  doctorColor: T.color.primaryDark,
  doctorBg: T.color.primarySoft,
  patientColor: '#7F8C8D',
  patientBg: T.color.surfaceMuted,
};

const DOCUMENT_META: Record<DocumentKind, { label: string; icon: FluentIconName; color: string; soft: string }> = {
  recipe: { label: 'Receita', icon: 'file-document-outline', color: T.color.green, soft: T.color.greenSoft },
  exam_result: { label: 'Resultado de exame', icon: 'flask-outline', color: T.color.blue, soft: T.color.blueSoft },
  prescription: { label: 'Prescrição', icon: 'pill', color: T.color.purple, soft: T.color.purpleSoft },
  report: { label: 'Laudo', icon: 'clipboard-text-outline', color: T.color.orange, soft: T.color.orangeSoft },
  other: { label: 'Outro', icon: 'folder-outline', color: T.color.primaryStrong, soft: T.color.primarySoft },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function DocumentCard({
  item,
  downloading,
  onDownload,
}: {
  item: Document;
  downloading: boolean;
  onDownload: (id: string) => void;
}) {
  const meta = DOCUMENT_META[item.documentType] ?? {
    label: item.documentType,
    icon: 'folder-outline' as FluentIconName,
    color: T.color.primaryStrong,
    soft: T.color.primarySoft,
  };
  const isDoctor = item.uploadedByDoctor;
  const tagColor = isDoctor ? C.doctorColor : C.patientColor;
  const tagBg = isDoctor ? C.doctorBg : C.patientBg;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.typeRow}>
          <IconSquircle name={meta.icon} color={meta.color} backgroundColor={meta.soft} size={42} />
          <Text style={styles.typeLabel}>{meta.label}</Text>
        </View>
        <TouchableOpacity
          style={[styles.downloadBtn, downloading && { opacity: 0.6 }]}
          onPress={() => onDownload(item.id)}
          disabled={downloading}
          activeOpacity={0.7}
        >
          {downloading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.downloadContent}>
              <FluentIcon name="download-outline" size={15} color={T.color.white} />
              <Text style={styles.downloadBtnText}>Baixar</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.fileName} numberOfLines={2}>
        {item.fileName}
      </Text>

      <Text style={styles.metaText}>
        {formatBytes(item.fileSize)} · {formatDate(item.createdAt)}
      </Text>

      <View style={[styles.tag, { backgroundColor: tagBg }]}>
        <Text style={[styles.tagText, { color: tagColor }]}>
          {isDoctor ? 'Enviado pelo médico' : 'Enviado por você'}
        </Text>
      </View>
    </View>
  );
}

export function DocumentsScreen() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => apiGet<MeResponse>('/me'),
  });
  const patientId = meQuery.data?.user.patient?.id;

  const documentsQuery = useQuery({
    queryKey: ['documents', patientId],
    queryFn: () =>
      apiGet<DocumentsResponse>(`/patients/${patientId}/documents`),
    enabled: !!patientId,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  async function handleDownload(documentId: string) {
    if (!patientId) return;
    setDownloadingId(documentId);
    try {
      const res = await apiGet<DocumentDownloadResponse>(
        `/patients/${patientId}/documents/${documentId}/download-url`,
      );
      const supported = await Linking.canOpenURL(res.signedUrl);
      if (!supported) {
        Alert.alert(
          'Não foi possível abrir o link',
          'Seu dispositivo não suporta a abertura deste tipo de arquivo.',
        );
        return;
      }
      await Linking.openURL(res.signedUrl);
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof Error
          ? err.message
          : 'Não foi possível gerar o link de download.',
      );
    } finally {
      setDownloadingId(null);
    }
  }

  const documents = documentsQuery.data?.documents ?? [];

  return (
    <FlatList
      style={styles.root}
      data={documents}
      keyExtractor={(d) => d.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={documentsQuery.isRefetching}
          onRefresh={() => documentsQuery.refetch()}
          colors={[C.primary]}
          tintColor={C.primary}
        />
      }
      ListHeaderComponent={
        <View>
          <View style={styles.pageEyebrow}><View style={styles.pageAccent} /><Text style={styles.pageEyebrowText}>ARQUIVOS DE SAÚDE</Text></View>
          <Text style={styles.sectionTitle}>Seus documentos {documents.length > 0 ? `(${documents.length})` : ''}</Text>
          <Text style={styles.sectionHint}>
            Receitas, prescrições, laudos e resultados de exame enviados pelo seu
            médico. Toque em "Baixar" para abrir o arquivo.
          </Text>
        </View>
      }
      ListEmptyComponent={
        documentsQuery.isLoading ? (
          <ActivityIndicator color={C.primary} style={{ margin: 16 }} />
        ) : documentsQuery.isError ? (
          <Text style={styles.muted}>
            Não foi possível carregar seus documentos. Puxe para baixo para
            tentar de novo.
          </Text>
        ) : (
          <Text style={styles.muted}>Nenhum documento ainda.</Text>
        )
      }
      renderItem={({ item }) => (
        <DocumentCard
          item={item}
          downloading={downloadingId === item.id}
          onDownload={handleDownload}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  list: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 16, gap: 12, paddingBottom: 32 },
  pageEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  pageAccent: { width: 22, height: 3, borderRadius: 2, backgroundColor: T.color.primary },
  pageEyebrowText: { color: T.color.primaryStrong, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  sectionTitle: { fontSize: 23, fontWeight: '800', color: C.text, marginBottom: 4, letterSpacing: -0.4 },
  sectionHint: { fontSize: 12.5, color: C.muted, lineHeight: 18, marginBottom: 12 },
  card: {
    backgroundColor: T.color.acrylicStrong,
    borderRadius: T.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: T.color.border,
    ...T.shadow.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  typeRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  typeLabel: { fontSize: 15, color: C.text, fontWeight: '700', marginLeft: 10 },
  downloadBtn: {
    backgroundColor: C.primary,
    borderRadius: T.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadContent: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  downloadBtnText: { color: C.onPrimary, fontWeight: '700', fontSize: 13 },
  fileName: { fontSize: 14, color: C.text, marginBottom: 4 },
  metaText: { fontSize: 12, color: C.muted, marginBottom: 8 },
  tag: { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontSize: 12, fontWeight: '600' },
  muted: { color: C.muted, textAlign: 'center', marginTop: 16, fontSize: 14 },
});
