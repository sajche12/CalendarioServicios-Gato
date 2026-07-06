import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import webpush from 'web-push';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';

if (publicKey && privateKey) {
  webpush.setVapidDetails(
    'mailto:soporte@tourflow.app',
    publicKey,
    privateKey
  );
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Obtener la fecha de mañana en formato YYYY-MM-DD
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Consultar servicios para mañana
    const { data: servicios, error: srvError } = await supabase
      .from('servicios_diarios')
      .select('*, colaborador(nombre)')
      .eq('fecha', tomorrowStr);

    if (srvError) throw srvError;

    if (!servicios || servicios.length === 0) {
      return NextResponse.json({ message: 'No hay servicios programados para mañana.' });
    }

    // Consultar suscripciones
    const { data: subs, error: subError } = await supabase
      .from('suscripciones_push')
      .select('*');

    if (subError) throw subError;

    if (!subs || subs.length === 0) {
      return NextResponse.json({ 
        message: `Hay ${servicios.length} traslados para mañana, pero no hay dispositivos suscritos.` 
      });
    }

    const count = servicios.length;
    const sorted = [...servicios].sort((a: any, b: any) => (a.hora || '').localeCompare(b.hora || ''));
    const firstService = sorted[0];
    const firstTime = firstService.hora ? firstService.hora.slice(0, 5) : '08:00';
    
    const title = 'Recordatorio de Traslados Mañana 🚐';
    const body = `Tienes ${count} traslado${count > 1 ? 's' : ''} para mañana (${tomorrowStr}). El primero inicia a las ${firstTime}: ${firstService.ruta_origen} ➔ ${firstService.ruta_destino}.`;

    const payload = JSON.stringify({
      title,
      body,
      url: `/?date=${tomorrowStr}`
    });

    const sendPromises = subs.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Eliminando suscripción expirada: ${sub.endpoint}`);
          await supabase.from('suscripciones_push').delete().eq('id', sub.id);
        } else {
          console.error(`Error enviando notificación a ${sub.endpoint}:`, err);
        }
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({
      success: true,
      message: `Recordatorio enviado a ${subs.length} dispositivos para los ${count} traslados de mañana.`
    });

  } catch (err: any) {
    console.error('Error en API de recordatorios:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
