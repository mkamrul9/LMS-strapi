// @ts-nocheck  
export default ({ env }) => ({
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
      jwt: {
        expiresIn: '7d', // 7 days expiration for LMS sessions
      },
    },
  },
});
