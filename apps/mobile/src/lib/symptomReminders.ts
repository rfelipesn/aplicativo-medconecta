import * as Notifications from 'expo-notifications';

const SYMPTOM_REMINDER_ID = 'symptom-reminder-daily';
const TRIGGER_HOUR = 20; // 20:00 horário local

interface ScheduleOptions {
  /** Quando `true`, força reagendamento. */
  force?: boolean;
}

/**
 * Agenda lembrete local diário para registrar sintomas/cefaleia se o usuário
 * ainda não tiver registrado nada no dia.
 *
 * - Usa trigger diário em horário local (20:00 por padrão).
 * - Se já existe um agendamento com o mesmo identificador, não duplica.
 * - Retorna `true` se o agendamento foi criado/atualizado.
 *
 * Estratégia MVP: lembrete sempre dispara; a checagem "se não registrou
 * sintoma hoje" pode ser feita no futuro (Fase 2) via lógica do listener
 * que abre o diário e marca o sintoma como "lembrado".
 */
export async function scheduleSymptomReminder(
  options: ScheduleOptions = {},
): Promise<boolean> {
  try {
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    const alreadyScheduled = existing.some((n) => n.identifier === SYMPTOM_REMINDER_ID);

    if (alreadyScheduled && !options.force) {
      return false;
    }

    if (alreadyScheduled) {
      await Notifications.cancelScheduledNotificationAsync(SYMPTOM_REMINDER_ID);
    }

    await Notifications.scheduleNotificationAsync({
      identifier: SYMPTOM_REMINDER_ID,
      content: {
        title: 'Como você está hoje?',
        body: 'Reserve 1 minuto para registrar seus sintomas e crises no diário.',
        sound: 'default',
        data: { type: 'symptom_reminder' },
      },
      trigger: {
        hour: TRIGGER_HOUR,
        minute: 0,
        repeats: true,
      },
    });

    return true;
  } catch {
    return false;
  }
}

/** Cancela o lembrete de sintomas (ex.: após o usuário registrar). */
export async function cancelSymptomReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(SYMPTOM_REMINDER_ID);
  } catch {
    /* ignore */
  }
}
