// TEMPORARY, delete after setup is verified.
import { jsonResponse } from './_shared.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  let rawHash = process.env.ADMIN_PASSWORD_HASH;
  let cleanHash = '';
  if (rawHash) {
    cleanHash = rawHash.trim();
    if (
      (cleanHash.startsWith('"') && cleanHash.endsWith('"')) ||
      (cleanHash.startsWith("'") && cleanHash.endsWith("'"))
    ) {
      cleanHash = cleanHash.slice(1, -1).trim();
    }
  }

  const hashPresent = Boolean(cleanHash);
  const hashLooksValid =
    cleanHash.length === 60 &&
    (cleanHash.startsWith('$2a$') ||
      cleanHash.startsWith('$2b$') ||
      cleanHash.startsWith('$2y$'));

  const jwtSecret = process.env.JWT_SECRET;
  const jwtSecretLongEnough = Boolean(
    jwtSecret && typeof jwtSecret === 'string' && jwtSecret.trim().length >= 32
  );

  const r2AccountId = process.env.R2_ACCOUNT_ID;
  const r2AccountIdPresent = Boolean(r2AccountId && r2AccountId.trim());

  const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
  const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY;
  const r2KeysPresent = Boolean(
    r2AccessKey && r2AccessKey.trim() && r2SecretKey && r2SecretKey.trim()
  );

  const r2Bucket = process.env.R2_BUCKET;
  const r2BucketPresent = Boolean(r2Bucket && r2Bucket.trim());

  const publicMediaBaseUrl = process.env.PUBLIC_MEDIA_BASE_URL;
  const publicMediaBaseUrlPresent = Boolean(
    publicMediaBaseUrl && publicMediaBaseUrl.trim()
  );

  return jsonResponse({
    hashPresent,
    hashLooksValid,
    jwtSecretLongEnough,
    r2AccountIdPresent,
    r2KeysPresent,
    r2BucketPresent,
    publicMediaBaseUrlPresent,
  });
};
