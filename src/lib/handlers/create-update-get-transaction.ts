import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { PrismaAurora } from '@raymondjkelly/prisma-adapter-aurora';
import { PrismaClient } from './prisma/client';
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
 * Create User, Update User and Get User all as part of a transaction
 */
export const createUpdateGet = async () => {
    try {
        const finalStateOfUser = await prisma.$transaction(async (tx) => {

            const id = `${randomUUID()}`;
            const newUser = await tx.user.create({
                data: {
                    name: `${id}`,
                    email: `${id}@test.com`
                }
            });

            await tx.user.update({
                where: {
                    email: newUser.email
                },
                data: {
                    name: newUser.name + '- Updated'
                }
            });

            const finalUser = await tx.user.findUniqueOrThrow({
                where: {
                    email: newUser.email
                }
            });
            return finalUser;
        })

        return { statusCode: 200, body: JSON.stringify(finalStateOfUser) };
    } catch (error: unknown) {
        return { statusCode: 400, body: JSON.stringify(error) };

    }
}