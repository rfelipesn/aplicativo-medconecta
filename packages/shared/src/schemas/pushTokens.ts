import { z } from 'zod';

export const pushPlatformSchema = z.enum(['ios', 'android']);
export type PushPlatform = z.infer<typeof pushPlatformSchema>;

/**
 * Body enviado pelo app para registrar (ou atualizar) o token Expo Push
 * do usuário autenticado para um device específico.
 * - token: ExpoPushToken (formato `ExponentPushToken[xxx]` ou `ExpoPushToken[xxx]`).
 * - deviceId: identificador estável do device (ex.: `Application.getAndroidId()` / `Constants.deviceId` / `expo-application.androidId`).
 * - platform: 'ios' | 'android'.
 */
export const registerPushTokenInputSchema = z.object({
  token: z.string().min(1),
  deviceId: z.string().min(1),
  platform: pushPlatformSchema,
});
export type RegisterPushTokenInput = z.infer<typeof registerPushTokenInputSchema>;

export const pushTokenSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string(),
  deviceId: z.string(),
  platform: pushPlatformSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PushToken = z.infer<typeof pushTokenSchema>;
