// @ts-nocheck
export default ({ env }) => [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          // Allow local images, data blobs, placeholder images, and Cloudinary (for production)
          'img-src': ["'self'", 'data:', 'blob:', 'https://placehold.co', 'res.cloudinary.com'],
          'media-src': ["'self'", 'data:', 'blob:', 'res.cloudinary.com'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      // Split the environment variable by comma in case of multiple frontend URLs
      origin: env('FRONTEND_URL', 'http://localhost:3000').split(','),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      formLimit: '2mb', // Limit form body size
      jsonLimit: '2mb', // Limit JSON body size
      textLimit: '2mb', // Limit Text body size
      formidable: {
        maxFileSize: 5 * 1024 * 1024, // Limit multipart uploads to 5MB
      },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
