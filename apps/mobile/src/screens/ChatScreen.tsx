import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Audio } from 'expo-av';
import { apiGet, apiPost } from '../lib/api';
import { ELECTIVE_SCOPE_NOTICE } from '@medconecta/shared';
import type { MeResponse } from '../types';
import { localDatabase } from '../watermelon';
import { Q } from '@nozbe/watermelondb';
import type { ChatMessage as LocalChatMessage } from '../watermelon/models/ChatMessage';
import { createLocalChatMessage } from '../watermelon/chatRepository';
import { syncChatMessages } from '../watermelon/sync';
import { T } from '../theme/tokens';

const C = {
  primary: T.color.primary,
  onPrimary: T.color.onPrimary,
  bg: T.color.bg,
  surface: T.color.surface,
  text: T.color.text,
  muted: T.color.textSecondary,
  bubbleMine: T.color.primary,
  bubbleTheirs: '#ECEEEA',
  warn: T.color.primaryDark,
  warnBg: T.color.primarySoft,
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function Bubble({ msg, isMe }: { msg: LocalChatMessage; isMe: boolean }) {
  const hasAudio = msg.messageType === 'audio' && msg.localAudioPath;
  return (
    <View style={[styles.bubble, isMe ? styles.bubbleMine : styles.bubbleTheirs]}>
      {msg.contentText && (
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMine]}>{msg.contentText}</Text>
      )}
      {hasAudio && (
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMine]}>[Mensagem de áudio]</Text>
      )}
      <Text style={[styles.bubbleMeta, isMe && styles.bubbleMetaMine]}>{formatTime(msg.createdAt)}</Text>
    </View>
  );
}

export function ChatScreen() {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const listRef = useRef<FlatList>(null);

  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiGet<MeResponse>('/me') });
  const patientId = meQuery.data?.user.patient?.id;
  const doctorId = meQuery.data?.user.patient?.doctorId;

  // Observa mensagens locais
  useEffect(() => {
    if (!patientId) return;
    const subscription = localDatabase
      .get<LocalChatMessage>('chat_messages')
      .query(Q.where('patient_id', patientId))
      .observe()
      .subscribe((msgs) => {
        setMessages(msgs.sort((a, b) => a.createdAt - b.createdAt));
      });
    return () => subscription.unsubscribe();
  }, [patientId]);

  // Mensagem de boas-vindas se chat está vazio
  useEffect(() => {
    if (!patientId || !doctorId || messages.length > 0) return;

    async function seedWelcomeMessage() {
      const existing = await localDatabase
        .get<LocalChatMessage>('chat_messages')
        .query(Q.where('patient_id', patientId as string))
        .fetchCount();
      if (existing > 0) return;

      await localDatabase.write(async () => {
        await localDatabase.get<LocalChatMessage>('chat_messages').create((msg) => {
          (msg._raw as Record<string, unknown>).patient_id = patientId;
          (msg._raw as Record<string, unknown>).doctor_id = doctorId;
          (msg._raw as Record<string, unknown>).sender_type = 'doctor';
          (msg._raw as Record<string, unknown>).message_type = 'text';
          (msg._raw as Record<string, unknown>).content_text = buildWelcomeText(
            meQuery.data?.user.fullName ?? '',
          );
          (msg._raw as Record<string, unknown>).is_read = true;
          (msg._raw as Record<string, unknown>).local_status = 'synced';
          (msg._raw as Record<string, unknown>).created_at = Date.now();
          (msg._raw as Record<string, unknown>).updated_at = Date.now();
        });
      });
    }
    seedWelcomeMessage().catch(() => undefined);
  }, [patientId, doctorId, messages.length, meQuery.data?.user.fullName]);

  async function handleSendText() {
    if (!text.trim() || !patientId || !doctorId) return;
    await createLocalChatMessage({
      patientId,
      doctorId,
      senderType: 'patient',
      messageType: 'text',
      contentText: text.trim(),
    });
    setText('');
    syncChatMessages(patientId).catch(() => undefined);
    await apiPost(`/patients/${patientId}/messages/read`, {}).catch(() => undefined);
  }

  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permissão', 'Precisamos de acesso ao microfone.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRecording(true);
    } catch {
      Alert.alert('Erro', 'Não foi possível iniciar a gravação.');
    }
  }

  async function stopRecording() {
    if (!recording || !patientId || !doctorId) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    if (uri) {
      await createLocalChatMessage({
        patientId,
        doctorId,
        senderType: 'patient',
        messageType: 'audio',
        audioUri: uri,
      });
      syncChatMessages(patientId).catch(() => undefined);
    }
  }

  if (!patientId && !meQuery.isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Perfil de paciente não encontrado.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.noticeBanner}>
        <Text style={styles.noticeText}>{ELECTIVE_SCOPE_NOTICE.short}</Text>
        <Text style={styles.noticeText}>{ELECTIVE_SCOPE_NOTICE.emergency}</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <Text style={styles.muted}>Nenhuma mensagem ainda. Inicie a conversa.</Text>
        }
        renderItem={({ item }) => <Bubble msg={item} isMe={item.senderType === 'patient'} />}
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Escreva uma mensagem…"
          placeholderTextColor={C.muted}
          multiline
        />
        <TouchableOpacity
          style={[styles.iconBtn, isRecording && styles.recordingBtn]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
        >
          <Text style={styles.iconText}>{isRecording ? '●' : '🎙'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim()) && styles.sendBtnDisabled]}
          onPress={handleSendText}
          disabled={!text.trim()}
        >
          <Text style={styles.sendText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function buildWelcomeText(patientName: string) {
  return `Olá, ${patientName.split(' ')[0]}! Tudo bem?\nAqui quem fala é o Dr. Helton.\n\nPosso demorar um pouquinho para responder. Mas fique tranquilo(a), já já te respondo pessoalmente.\n\nTudo o que você escrever fica salvo para eu ver com calma.`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  muted: { color: C.muted, textAlign: 'center', marginTop: 8 },
  noticeBanner: {
    backgroundColor: C.warnBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.color.separator,
  },
  noticeText: {
    color: C.warn,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  bubble: { maxWidth: '80%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: C.bubbleMine },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: C.bubbleTheirs },
  bubbleText: { fontSize: 15, color: C.text, lineHeight: 20 },
  bubbleTextMine: { color: C.onPrimary },
  bubbleMeta: { fontSize: 10, color: C.muted, marginTop: 4, textAlign: 'right' },
  bubbleMetaMine: { color: 'rgba(15,59,65,0.6)' },
  composer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: T.color.separator,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: T.color.surfaceMuted,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 15,
    color: C.text,
    maxHeight: 100,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF4F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingBtn: { backgroundColor: '#C0392B' },
  iconText: { fontSize: 18 },
  sendBtn: {
    backgroundColor: C.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: C.onPrimary, fontWeight: '700' },
});
