require('dotenv').config();

resourceUsername = process.env.RESOURCES_USERNAME || 'resources';
resourcePassword = process.env.RESOURCES_PASSWORD || null;
const config = {
  username: process.env.CREATOR_USERNAME || 'hrm',
  password: process.env.CREATOR_PASSWORD || null,
  database: process.env.RDS_DBNAME || 'hrmdb',
  host: process.env.RDS_HOSTNAME || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  dialect: 'postgres',
};

const pgPromise = require('pg-promise');
const pgp = pgPromise({});

async function create() {
  const createUserConnection = pgp(
    `postgres://${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@${
      config.host
    }:${config.port}/${encodeURIComponent(
      config.database,
    )}?&application_name=resources-db-create-script`,
  );
  const {
    userCount,
  } = await createUserConnection.one(
    `SELECT COUNT(*) AS "userCount" FROM pg_user where usename = $<resourceUsername>`,
    { resourceUsername },
  );
  if (Number.parseInt(userCount) === 0) {
    console.log(`Creating user '${resourceUsername}' to manage resources schema`);
    await createUserConnection.none(`
      CREATE USER ${resourceUsername} WITH PASSWORD '${resourcePassword}' VALID UNTIL 'infinity';
      GRANT CONNECT, CREATE ON DATABASE hrmdb TO resources;
    `);
  } else {
    console.log(`User '${resourceUsername}' already exists`);
  }
  const createSchemaConnection = pgp(
    `postgres://${encodeURIComponent(resourceUsername)}:${encodeURIComponent(resourcePassword)}@${
      config.host
    }:${config.port}/${encodeURIComponent(
      config.database,
    )}?&application_name=resources-db-create-script`,
  );
  console.log(`Creating  resources schema`);
  await createSchemaConnection.none(`
      CREATE SCHEMA IF NOT EXISTS resources AUTHORIZATION resources;
  `);
}

create().catch(err => {
  throw err;
});
