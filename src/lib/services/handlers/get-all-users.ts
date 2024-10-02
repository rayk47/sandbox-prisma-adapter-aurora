import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { PrismaAurora } from '@raymondjkelly/prisma-adapter-aurora';
import { PrismaClient } from '../database/client';

// Setup
const awsRegion = `${process.env['AWS_REGION']}` //The region that the aurora cluster is deployed to
const resourceArn = `${process.env['RESOURCE_ARN']}` //The ARN of the aurora cluster to connect to
const secretArn = `${process.env['SECRET_ARN']}` // The database secret that is used for authentication to the cluster. Your Service/Lambda will need access to this see https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_database_secret.html
const databaseName = `${process.env['DATABASE_NAME']}` // The name of the database to connect to in the cluster

// Init prisma client
const client = new RDSDataClient({ region: awsRegion })
const adapter = new PrismaAurora(client, { resourceArn, secretArn, databaseName })
const prisma = new PrismaClient({ adapter });

/**
 * Get All Users
 */
export const getAllUsers = async () => {
    try {
        const allUsers = await prisma.user.findMany();

        return {
            statusCode: 200, body: JSON.stringify(
                allUsers,
                (key, value) => (typeof value === 'bigint' ? value.toString() : value) // return everything else unchanged
            )
        };
    } catch (error: unknown) {
        return { statusCode: 400, body: JSON.stringify(error) };

    }
}