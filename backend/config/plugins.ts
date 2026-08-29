// @ts-nocheck
export default ({ env }) => ({
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET', 'defaultJwtSecretForLMSPlatform123456'),
      jwt: {
        expiresIn: '7d', 
      },
      ratelimit: {
        interval: 60000, // 1 minute
        max: 100,        // Generous limit for development and testing
      },
    },
  },
});
