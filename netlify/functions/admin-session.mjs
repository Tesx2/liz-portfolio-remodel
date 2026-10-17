import { verifyAdminSession, jsonResponse, errorResponse } from './_shared.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  const auth = await verifyAdminSession(event);
  if (!auth.authorized) {
    return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
  }

  return jsonResponse({ authenticated: true });
};
