import {
    Stack,
    type StackProps,
    RemovalPolicy,
    Duration,
} from 'aws-cdk-lib';
import { Architecture, Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { DatabaseCluster } from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';
import { randomUUID } from 'crypto';
import { copyFileSync, mkdirSync } from 'fs';
import * as path from 'path';

export interface LambdasProps extends StackProps {
    readonly dbName: string;
    readonly description: string;
    readonly envName: string;
    readonly cluster: DatabaseCluster;
}

const ROOT_OF_PROJECT = path.join(__dirname, '../', '../');
const PRISMA_QUERY_ENGINE_BINARY_NAME = 'libquery_engine-rhel-openssl-3.0.x.so.node';
const PRISMA_QUERY_ENGINE_BINARY_PATH = '/opt/' + PRISMA_QUERY_ENGINE_BINARY_NAME;
const PRISMA_CLIENT_PATH = path.join(__dirname, 'services', 'database', 'client');

export class Lambdas extends Stack {
    public envName: string;

    constructor(scope: Construct, id: string, props: LambdasProps) {
        const { dbName, cluster } = props;

        super(scope, id, props);
        this.envName = props.envName;


        const prismaBinaryLayer = this.createPrismaBinaryLayer();
        this.testRDSDataAPILambda(cluster, dbName);
        this.resetDatabaseLambda(cluster, dbName, prismaBinaryLayer);
        this.createUserLambda(cluster, dbName, prismaBinaryLayer);
        this.getAllUsersLambda(cluster, dbName, prismaBinaryLayer);
        this.createUpdateGetTransactionLambda(cluster, dbName, prismaBinaryLayer);
    }

    testRDSDataAPILambda = (cluster: DatabaseCluster, dbName: string) => {
        const testRdsLambda = new NodejsFunction(this, this.envName + 'TestRDSDataAPI', {
            description: 'Test using the RDS Data API Directly',
            entry: path.join(__dirname, 'services', 'handlers', 'test-rds-data-api.ts'),
            handler: 'testRDSDataAPI',
            bundling: {
                minify: false
            },
            runtime: Runtime.NODEJS_20_X,
            timeout: Duration.seconds(10),
            projectRoot: ROOT_OF_PROJECT,
            architecture: Architecture.X86_64,
            depsLockFilePath: path.join(ROOT_OF_PROJECT, 'package-lock.json'),
            environment: {
                CLUSTER_ARN: cluster.clusterArn,
                SECRET_ARN: cluster.secret!.secretArn,
                DATABASE_NAME: dbName
            }
        });

        testRdsLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);

        cluster.grantDataApiAccess(testRdsLambda);
        cluster.secret?.grantRead(testRdsLambda);

        return testRdsLambda;
    }

    resetDatabaseLambda = (cluster: DatabaseCluster, dbName: string, prismaBinaryLayer: LayerVersion) => {
        const resetDatabase = new NodejsFunction(this, this.envName + 'ResetDatabase', {
            description: 'Reset Database',
            entry: path.join(__dirname, 'services', 'handlers', 'reset-database.ts'),
            handler: 'resetDatabase',
            timeout: Duration.seconds(30),
            bundling: {
                minify: false,
                commandHooks: {
                    beforeInstall: () => [],
                    beforeBundling: (i, o) => [
                        `cp -R ${i}/src/lib/services/database/migrations ${o}/migrations`
                    ],
                    afterBundling: () => []
                }
            },
            runtime: Runtime.NODEJS_20_X,
            projectRoot: ROOT_OF_PROJECT,
            architecture: Architecture.X86_64,
            depsLockFilePath: path.join(ROOT_OF_PROJECT, 'package-lock.json'),
            layers: [prismaBinaryLayer],
            environment: {
                DEBUG: "prisma*",
                RESOURCE_ARN: cluster.clusterArn,
                SECRET_ARN: cluster.secret!.secretArn,
                DATABASE_NAME: dbName,
                DATABASE_URL: 'na',
                PRISMA_QUERY_ENGINE_LIBRARY: PRISMA_QUERY_ENGINE_BINARY_PATH
            }
        });

        resetDatabase.applyRemovalPolicy(RemovalPolicy.DESTROY);

        cluster.grantDataApiAccess(resetDatabase);
        cluster.secret?.grantRead(resetDatabase);
    }

    createUserLambda = (cluster: DatabaseCluster, dbName: string, prismaBinaryLayer: LayerVersion) => {
        const createUser = new NodejsFunction(this, this.envName + 'CreateUser', {
            description: 'Create a user using the Prisma Aurora Adapter',
            entry: path.join(__dirname, 'services', 'handlers', 'create-user.ts'),
            handler: 'createUser',
            timeout: Duration.seconds(10),
            bundling: {
                minify: false
            },
            runtime: Runtime.NODEJS_20_X,
            projectRoot: ROOT_OF_PROJECT,
            architecture: Architecture.X86_64,
            depsLockFilePath: path.join(ROOT_OF_PROJECT, 'package-lock.json'),
            layers: [prismaBinaryLayer],
            environment: {
                DEBUG: "prisma*",
                RESOURCE_ARN: cluster.clusterArn,
                SECRET_ARN: cluster.secret!.secretArn,
                DATABASE_NAME: dbName,
                DATABASE_URL: 'na',
                PRISMA_QUERY_ENGINE_LIBRARY: PRISMA_QUERY_ENGINE_BINARY_PATH
            }
        });

        createUser.applyRemovalPolicy(RemovalPolicy.DESTROY);

        cluster.grantDataApiAccess(createUser);
        cluster.secret?.grantRead(createUser);
    }

    getAllUsersLambda = (cluster: DatabaseCluster, dbName: string, prismaBinaryLayer: LayerVersion) => {
        const getAllUsers = new NodejsFunction(this, this.envName + 'GetAllUsers', {
            description: 'Get all users using the Prisma Aurora Adapter',
            entry: path.join(__dirname, 'services', 'handlers', 'get-all-users.ts'),
            handler: 'getAllUsers',
            timeout: Duration.seconds(10),
            bundling: {
                minify: false
            },
            runtime: Runtime.NODEJS_20_X,
            projectRoot: ROOT_OF_PROJECT,
            architecture: Architecture.X86_64,
            depsLockFilePath: path.join(ROOT_OF_PROJECT, 'package-lock.json'),
            layers: [prismaBinaryLayer],
            environment: {
                DEBUG: "prisma*",
                RESOURCE_ARN: cluster.clusterArn,
                SECRET_ARN: cluster.secret!.secretArn,
                DATABASE_NAME: dbName,
                DATABASE_URL: 'na',
                PRISMA_QUERY_ENGINE_LIBRARY: PRISMA_QUERY_ENGINE_BINARY_PATH
            }
        });

        getAllUsers.applyRemovalPolicy(RemovalPolicy.DESTROY);

        cluster.grantDataApiAccess(getAllUsers);
        cluster.secret?.grantRead(getAllUsers);
    }

    createUpdateGetTransactionLambda = (cluster: DatabaseCluster, dbName: string, prismaBinaryLayer: LayerVersion) => {
        const createUpdateGet = new NodejsFunction(this, this.envName + 'CreateUpdateGetTransactionLambda', {
            description: 'Create a user, Update a user and get a user, inside a transaction, using the Prisma Aurora Adapter',
            entry: path.join(__dirname, 'services', 'handlers', 'create-update-get-transaction.ts'),
            handler: 'createUpdateGet',
            timeout: Duration.seconds(10),
            bundling: {
                minify: false
            },
            runtime: Runtime.NODEJS_20_X,
            projectRoot: ROOT_OF_PROJECT,
            architecture: Architecture.X86_64,
            depsLockFilePath: path.join(ROOT_OF_PROJECT, 'package-lock.json'),
            layers: [prismaBinaryLayer],
            environment: {
                DEBUG: "prisma*",
                RESOURCE_ARN: cluster.clusterArn,
                SECRET_ARN: cluster.secret!.secretArn,
                DATABASE_NAME: dbName,
                DATABASE_URL: 'na',
                PRISMA_QUERY_ENGINE_LIBRARY: PRISMA_QUERY_ENGINE_BINARY_PATH
            }
        });

        createUpdateGet.applyRemovalPolicy(RemovalPolicy.DESTROY);

        cluster.grantDataApiAccess(createUpdateGet);
        cluster.secret?.grantRead(createUpdateGet);
    }

    createPrismaBinaryLayer = () => {
        // move the binary into its own folder to reduce the layer size to only include that binary file
        const newFolder = path.join(ROOT_OF_PROJECT, 'tmp', randomUUID());
        mkdirSync(newFolder, { recursive: true });
        copyFileSync(
            path.join(PRISMA_CLIENT_PATH, PRISMA_QUERY_ENGINE_BINARY_NAME),
            path.join(newFolder, PRISMA_QUERY_ENGINE_BINARY_NAME)
        );

        return new LayerVersion(
            this,
            this.envName + 'PrismaEngineBinaryLambdaLayer',
            {
                compatibleRuntimes: [Runtime.NODEJS_20_X,],
                compatibleArchitectures: [Architecture.X86_64],
                code: Code.fromAsset(path.join(newFolder))
            }
        );
    }
}
