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
import { FluentIcon } from '../components/FluentIcon';

const C = {
  primary: T.color.primaryStrong,
  onPrimary: T.color.onPrimary,
  bg: T.color.bg,
  surface: T.color.surface,
  text: T.color.text,
  muted: T.color.textSecondary,
  bubbleMine: T.color.primaryStrong,
  bubbleTheirs: T.color.surfaceMuted,
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

  // Pull periódico do servidor: médico responde no painel; paciente precisa
  // ver a mensagem sem reabrir o app. (Não há Supabase Realtime no cliente.)
  useEffect(() => {
    if (!patientId) return;
    syncChatMessages(patientId).catch(() => undefined);
    const intervalId = setInterval(() => {
      syncChatMessages(patientId).catch(() => undefined);
    }, 8_000);
    return () => clearInterval(intervalId);
  }, [patientId]);

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
        <FluentIcon name="shield-check-outline" size={19} color={C.warn} />
        <View style={styles.noticeCopy}>
          <Text style={styles.noticeText}>{ELECTIVE_SCOPE_NOTICE.short}</Text>
          <Text style={styles.noticeDetail}>{ELECTIVE_SCOPE_NOTICE.emergency}</Text>
        </View>
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
          <FluentIcon
            name={isRecording ? 'stop-circle-outline' : 'microphone-outline'}
            size={21}
            color={isRecording ? T.color.white : C.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim()) && styles.sendBtnDisabled]}
          onPress={handleSendText}
          disabled={!text.trim()}
        >
          <FluentIcon name="send" size={19} color={C.onPrimary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 16, gap: 8, flexGrow: 1 },
  muted: { color: C.muted, textAlign: 'center', marginTop: 8 },
  noticeBanner: {
    backgroundColor: C.warnBg,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.color.border,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  noticeCopy: { flex: 1 },
  noticeText: {
    color: C.warn,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  noticeDetail: { color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  bubble: { maxWidth: '82%', borderRadius: T.radius.xl, paddingHorizontal: 15, paddingVertical: 11, marginBottom: 4, borderWidth: 1 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: C.bubbleMine, borderColor: T.color.primary },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: C.surface, borderColor: T.color.border, ...T.shadow.soft },
  bubbleText: { fontSize: 15, color: C.text, lineHeight: 20 },
  bubbleTextMine: { color: C.onPrimary },
  bubbleMeta: { fontSize: 10, color: C.muted, marginTop: 4, textAlign: 'right' },
  bubbleMetaMine: { color: 'rgba(255,255,255,0.72)' },
  composer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: 12,
    gap: 8,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: T.color.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: T.color.surfaceSubtle,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 15,
    color: C.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: T.color.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingBtn: { backgroundColor: T.color.red },
  sendBtn: {
    backgroundColor: C.primary,
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
