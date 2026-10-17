import { verifyAdminSession, jsonResponse, errorResponse } from './_shared.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
  }

  const auth = await verifyAdminSession(event);
  if (!auth.authorized) {
    return errorResponse(auth.error || 'Unauthorized', 401);
  }

  try {
    const hookUrl = process.env.NETLIFY_BUILD_HOOK_URL;
    if (!hookUrl) {
      return errorResponse('NETLIFY_BUILD_HOOK_URL environment variable is not configured', 400);
    }

    const res = await fetch(hookUrl, { method: 'POST' });
    if (!res.ok) {
      return errorResponse(`Failed to trigger build hook: ${res.statusText}`, res.status);
    }

    return jsonResponse({ success: true, message: 'Production build triggered successfully' });
  } catch (err) {
    console.error('trigger-publish error:', err);
    return errorResponse(err.message || 'Failed triggering publish', 500);
  }
};
