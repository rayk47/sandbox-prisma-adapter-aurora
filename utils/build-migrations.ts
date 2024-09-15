/* eslint-disable @typescript-eslint/no-explicit-any */
import { execSync } from "child_process";

const buildMigrations = async () => {

    try {
        try {
            console.log(`Creating local database via docker`);
            execSync(`docker run --name my-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres`);
            await delay(10000);
            console.log(`Finished creating local database`);

        } catch (error: any) {
            if (!error?.message?.includes(`is already in use by container`)) {
                throw error;
            }
            console.log(`Local database already exists, using existing database`);
        }
        console.log(`Build Migrations`);
        execSync(`export DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/mydb" && prisma migrate dev --name init --schema=${__dirname}/../src/lib/services/database/schema.prisma --create-only`);
        console.log(`Finished building migrations`);

        console.log(`Shutting down local database`);
        execSync(`docker stop my-postgres && docker rm my-postgres`);
    } catch (error: any) {
        console.log(`Something went wrong`);
        throw error;
    }

}

const delay = (ms: number | undefined) => new Promise(resolve => setTimeout(resolve, ms))
buildMigrations();