import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { PrismaAurora } from '@raymondjkelly/prisma-adapter-aurora';
import { PrismaClient } from '../database/client';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

// Setup
const awsRegion = `${process.env['AWS_REGION']}` //The region that the aurora cluster is deployed to
const resourceArn = `${process.env['RESOURCE_ARN']}` //The ARN of the aurora cluster to connect to
const secretArn = `${process.env['SECRET_ARN']}` // The database secret that is used for authentication to the cluster. Your Service/Lambda will need access to this see https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_database_secret.html
const databaseName = `${process.env['DATABASE_NAME']}` // The name of the database to connect to in the cluster

//To reset the database we need to connect but can not connect to the database we are attempting to delete
const client = new RDSDataClient({ region: awsRegion });
const postgresDbAdapter = new PrismaAurora(client, { resourceArn, secretArn, databaseName: 'postgres' });
const postgresDbPrisma = new PrismaClient({ adapter: postgresDbAdapter });

// Init prisma client
const adapter = new PrismaAurora(client, { resourceArn, secretArn, databaseName });
const prisma = new PrismaClient({ adapter: adapter });

/**
 * Reset database
 */
export const resetDatabase = async () => {
    try {
        await postgresDbPrisma.$executeRawUnsafe(`SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${databaseName}' AND pid <> pg_backend_pid();`); //Close any current connections to the database
        await postgresDbPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${databaseName};`); //Drop the database if it exists
        await postgresDbPrisma.$executeRawUnsafe(`CREATE DATABASE ${databaseName}`); //Recreate the database
        /**
         * Using a transaction, iterate through the migrations and create the schema for the new database
         */
        const response = await prisma.$transaction(async (tx) => {
            let migrations: string[] = [];
            readdirSync(join('.', 'migrations')).forEach(file => {
                if (file !== "migration_lock.toml") {
                    const sql = readFileSync(join(__dirname, 'migrations', file, 'migration.sql'));
                    migrations = [...migrations, ...(sql.toString().split(';'))]; //MultiQueries are not supported by RDS Data API. This is not the ideal way of doing it but will work for now.
                }
            });

            for (let i = 0; i < migrations.length; i++) {
                console.log(`Running migration`, migrations[i]);
                await tx.$executeRawUnsafe(migrations[i]!);
            }
            return { statusCode: 200 };
        });
        const schema = await prisma.$executeRawUnsafe(`select column_name, data_type, character_maximum_length from INFORMATION_SCHEMA.COLUMNS where table_name ='public.User';`)
        return { ...response, body: JSON.stringify(schema) };
    } catch (error: unknown) {
        return { statusCode: 400, body: JSON.stringify(error) };
    }
}