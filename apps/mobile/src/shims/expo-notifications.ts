// Web shim for expo-notifications — no push notifications on web.
export async function getPermissionsAsync(): Promise<{ status: string }> {
  return { status: 'undetermined' };
}

export async function requestPermissionsAsync(): Promise<{ status: string }> {
  return { status: 'undetermined' };
}

export async function getExpoPushTokenAsync(): Promise<{ data: string }> {
  return { data: 'web-no-token' };
}

export async function setNotificationHandler(_handler: unknown): Promise<void> {}

export async function scheduleNotificationAsync(_content: unknown): Promise<string> {
  return '';
}

export async function cancelScheduledNotificationAsync(_id: string): Promise<void> {}

export async function cancelAllScheduledNotificationsAsync(): Promise<void> {}

export async function setNotificationChannelAsync(): Promise<void> {}

export default {
  getPermissionsAsync,
  requestPermissionsAsync,
  getExpoPushTokenAsync,
  setNotificationHandler,
  scheduleNotificationAsync,
  cancelScheduledNotificationAsync,
  cancelAllScheduledNotificationsAsync,
  setNotificationChannelAsync,
};
