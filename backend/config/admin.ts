import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'defaultAdminJwtSecret123456789012'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'defaultApiTokenSalt123456789012'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'defaultTransferTokenSalt123456'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY', 'defaultEncryptionKey123456789012'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
    docLinks: env.bool('FLAG_DOC_LINKS', true),
  },
});

export default config;
