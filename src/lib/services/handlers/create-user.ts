import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { PrismaAurora } from '@raymondjkelly/prisma-adapter-aurora';
import { Prisma, PrismaClient } from '../database/client';
import { randomUUID } from 'crypto';

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
 * Create User
 */
export const createUser = async () => {
    try {
        const id = `${randomUUID()}`;
        const newUser = await prisma.user.create({
            data: {
                name: `${id}-name`,
                email: `${id}@test.com`,
                intValue: 200,
                isDeleted: true,
                floatNumber: 10.46,
                decimalNumber: new Prisma.Decimal(24.454545),
                jsonBlob: {
                    test: "Does this work?"
                },
                role: 'USER',
                bigIntValue: BigInt(534543543534),
                bytes: Buffer.from('Hello, World!', 'utf-8')
            }
        });

        return {
            statusCode: 200, body: JSON.stringify(
                newUser,
                (key, value) => (typeof value === 'bigint' ? value.toString() : value) // return everything else unchanged
            )
        };
    } catch (error: unknown) {
        return { statusCode: 400, body: JSON.stringify(error) };

    }
}