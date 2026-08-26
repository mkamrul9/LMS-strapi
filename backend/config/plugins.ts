// @ts-nocheck
export default ({ env }) => ({
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
      jwt: {
        expiresIn: '7d', 
      },
      ratelimit: {
        interval: 60000, // 1 minute
        max: 10,         // Maximum 10 login/register attempts per IP per minute
      },
    },
  },
});
