import { Model } from '@nozbe/watermelondb';
import { field, text, date } from '@nozbe/watermelondb/decorators';

export class HeadacheEntry extends Model {
  static override table = 'headache_entries';

  @text('patient_id') patientId!: string;
  @date('diary_date') diaryDate!: number;
  @text('start_period') startPeriod?: string;
  @text('start_time') startTime?: string;
  @date('end_datetime') endDateTime?: number;
  @field('duration_minutes') durationMinutes?: number;
  @field('intensity') intensity?: number;
  @text('types') types!: string;
  @text('location') location!: string;
  @text('symptoms') symptoms!: string;
  @text('triggers') triggers!: string;
  @text('medications') medications!: string;
  @text('relief_methods') reliefMethods!: string;
  @text('impact_on_activities') impactOnActivities!: string;
  @text('notes') notes?: string;
  @text('local_status') localStatus!: string;
  @text('remote_id') remoteId?: string;
  @date('created_at') createdAt!: number;
  @date('updated_at') updatedAt!: number;
  @date('pushed_at') pushedAt?: number;
}
