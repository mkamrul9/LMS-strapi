import { parse } from 'pg-connection-string';

export default ({ env }: { env: any }) => {
  // Railway provides the DATABASE_URL environment variable automatically when linked
  const databaseUrl = env('DATABASE_URL');
  let config = {};

  if (databaseUrl) {
    const parsedConfig = parse(databaseUrl);
    config = {
      connection: {
        client: 'postgres',
        connection: {
          host: parsedConfig.host,
          port: parsedConfig.port,
          database: parsedConfig.database,
          user: parsedConfig.user,
          password: parsedConfig.password,
          ssl: env.bool('DATABASE_SSL', false) ? { rejectUnauthorized: false } : false,
        },
        pool: {
          min: env.int('DATABASE_POOL_MIN', 2),
          max: env.int('DATABASE_POOL_MAX', 10),
        },
      },
    };
  }

  return config;
};
