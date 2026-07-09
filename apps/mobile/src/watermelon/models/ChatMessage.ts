import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export class ChatMessage extends Model {
  static override table = 'chat_messages';

  @text('patient_id') patientId!: string;
  @text('doctor_id') doctorId!: string;
  @text('sender_type') senderType!: string;
  @text('message_type') messageType!: string;
  @text('content_text') contentText?: string;
  @text('audio_url') audioUrl?: string;
  @text('local_audio_path') localAudioPath?: string;
  @field('is_read') isRead!: boolean;
  @text('local_status') localStatus!: string;
  @text('remote_id') remoteId?: string;
  @readonly @date('created_at') createdAt!: number;
  @readonly @date('updated_at') updatedAt!: number;
  @date('pushed_at') pushedAt?: number;
}
