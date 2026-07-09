import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations';

export const watermelonMigrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        createTable({
          name: 'chat_messages',
          columns: [
            { name: 'patient_id', type: 'string' },
            { name: 'doctor_id', type: 'string' },
            { name: 'sender_type', type: 'string' },
            { name: 'message_type', type: 'string' },
            { name: 'content_text', type: 'string', isOptional: true },
            { name: 'audio_url', type: 'string', isOptional: true },
            { name: 'local_audio_path', type: 'string', isOptional: true },
            { name: 'is_read', type: 'boolean' },
            { name: 'local_status', type: 'string' },
            { name: 'remote_id', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
            { name: 'pushed_at', type: 'number', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        createTable({
          name: 'seizure_entries',
          columns: [
            { name: 'patient_id', type: 'string' },
            { name: 'seizure_date', type: 'string' },
            { name: 'seizure_time', type: 'string', isOptional: true },
            { name: 'loss_of_consciousness', type: 'boolean' },
            { name: 'hospital_visit', type: 'boolean' },
            { name: 'hospital_name', type: 'string', isOptional: true },
            { name: 'duration_minutes', type: 'number' },
            { name: 'medication_taken_correctly', type: 'boolean' },
            { name: 'medication_brand_changed', type: 'boolean' },
            { name: 'new_medication_brand', type: 'string', isOptional: true },
            { name: 'additional_notes', type: 'string', isOptional: true },
            { name: 'local_status', type: 'string' },
            { name: 'remote_id', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
            { name: 'pushed_at', type: 'number', isOptional: true },
          ],
        }),
      ],
    },
  ],
});
