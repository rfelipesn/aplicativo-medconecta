import { localDatabase } from './index';
import { Q } from '@nozbe/watermelondb';
import type { ChatMessage } from './models/ChatMessage';
import * as FileSystem from 'expo-file-system';

export interface ChatDraft {
  patientId: string;
  doctorId: string;
  senderType: 'patient' | 'doctor';
  messageType: 'text' | 'audio';
  contentText?: string;
  audioUri?: string;
}

async function moveAudioToLocalPath(uri: string): Promise<string | undefined> {
  if (!uri) return undefined;
  const filename = `${Date.now()}.m4a`;
  const dir = `${FileSystem.documentDirectory}audio/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => undefined);
  const dest = `${dir}${filename}`;
  await FileSystem.moveAsync({ from: uri, to: dest });
  return dest;
}

export async function createLocalChatMessage(draft: ChatDraft): Promise<ChatMessage> {
  const localAudioPath = draft.audioUri ? await moveAudioToLocalPath(draft.audioUri) : undefined;

  return localDatabase.write<ChatMessage>(async () => {
    const collection = localDatabase.get<ChatMessage>('chat_messages');
    return collection.create((msg) => {
      (msg._raw as Record<string, unknown>).patient_id = draft.patientId;
      (msg._raw as Record<string, unknown>).doctor_id = draft.doctorId;
      (msg._raw as Record<string, unknown>).sender_type = draft.senderType;
      (msg._raw as Record<string, unknown>).message_type = draft.messageType;
      (msg._raw as Record<string, unknown>).content_text = draft.contentText ?? null;
      (msg._raw as Record<string, unknown>).local_audio_path = localAudioPath ?? null;
      (msg._raw as Record<string, unknown>).is_read = draft.senderType === 'patient';
      (msg._raw as Record<string, unknown>).local_status = 'pending';
      (msg._raw as Record<string, unknown>).created_at = Date.now();
      (msg._raw as Record<string, unknown>).updated_at = Date.now();
    });
  });
}

export function observeChatMessages(patientId: string) {
  return localDatabase
    .get<ChatMessage>('chat_messages')
    .query(Q.where('patient_id', patientId))
    .observe();
}
