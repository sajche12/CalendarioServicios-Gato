'use server';

import { cookies } from 'next/headers';

/**
 * Verifica si el código de acceso ingresado por el usuario es correcto.
 * Si es así, crea una cookie de sesión httpOnly válida por 30 días.
 */
export async function verifyPasscode(passcode: string): Promise<{ success: boolean; error?: string }> {
  const correctPasscode = process.env.APP_PASSCODE;

  if (!correctPasscode) {
    return { success: false, error: 'El sistema de autenticación no está configurado en el servidor.' };
  }

  if (passcode === correctPasscode) {
    const cookieStore = await cookies();
    cookieStore.set('tourflow_session', 'authenticated_user_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: '/',
    });
    return { success: true };
  }

  return { success: false, error: 'Código de acceso incorrecto. Intenta de nuevo.' };
}

/**
 * Cierra la sesión eliminando la cookie.
 */
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('tourflow_session');
}
