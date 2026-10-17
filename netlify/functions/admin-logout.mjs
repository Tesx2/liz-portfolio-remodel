import { jsonResponse } from './_shared.mjs';

export const handler = async (event) => {
  const cookie = 'admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
  return jsonResponse({ success: true, message: 'Logged out' }, 200, {
    'Set-Cookie': cookie,
  });
};
