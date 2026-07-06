'use server';

import { createClient } from '@/lib/supabase-server';
import webpush from 'web-push';

// Configurar Web Push
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';

if (publicKey && privateKey) {
  webpush.setVapidDetails(
    'mailto:soporte@tourflow.app',
    publicKey,
    privateKey
  );
}

export async function saveSubscription(subscription: any): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    const { endpoint, keys } = subscription;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return { success: false, error: 'Suscripción inválida' };
    }

    // Insertar o actualizar la suscripción
    const { error } = await supabase.from('suscripciones_push').upsert(
      {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth
      },
      { onConflict: 'endpoint' }
    );

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error saving subscription:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteSubscription(endpoint: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('suscripciones_push').delete().eq('endpoint', endpoint);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function sendTestNotification(endpoint: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Obtener la suscripción por endpoint
    const { data: sub, error } = await supabase
      .from('suscripciones_push')
      .select('*')
      .eq('endpoint', endpoint)
      .single();

    if (error || !sub) {
      return { success: false, error: 'No se encontró la suscripción registrada' };
    }

    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    };

    const payload = JSON.stringify({
      title: '¡Notificaciones Activas! 🔔',
      body: 'TourFlow está listo para enviarte recordatorios nativos a este teléfono.',
      url: '/'
    });

    await webpush.sendNotification(pushSubscription, payload);
    return { success: true };
  } catch (err: any) {
    console.error('Error sending test notification:', err);
    return { success: false, error: err.message };
  }
}
