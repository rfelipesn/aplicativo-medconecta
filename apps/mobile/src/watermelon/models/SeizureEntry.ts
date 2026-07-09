import { Model } from '@nozbe/watermelondb';
import { field, text, date } from '@nozbe/watermelondb/decorators';

export class SeizureEntry extends Model {
  static override table = 'seizure_entries';

  @text('patient_id') patientId!: string;
  @text('seizure_date') seizureDate!: string;
  @text('seizure_time') seizureTime?: string;
  @field('loss_of_consciousness') lossOfConsciousness!: boolean;
  @field('hospital_visit') hospitalVisit!: boolean;
  @text('hospital_name') hospitalName?: string;
  @field('duration_minutes') durationMinutes!: number;
  @field('medication_taken_correctly') medicationTakenCorrectly!: boolean;
  @field('medication_brand_changed') medicationBrandChanged!: boolean;
  @text('new_medication_brand') newMedicationBrand?: string;
  @text('additional_notes') additionalNotes?: string;
  @text('local_status') localStatus!: string;
  @text('remote_id') remoteId?: string;
  @date('created_at') createdAt!: number;
  @date('updated_at') updatedAt!: number;
  @date('pushed_at') pushedAt?: number;
}
