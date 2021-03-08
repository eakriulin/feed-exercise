import fs from 'fs';
import { Producer } from "../../producer";
import * as storage from "../../storage";
import { JobType } from '../../types';

// Watcher is responsible for monitoring the dir where new files occur.
// Every time it sees a new file it pushes a job to 'jobs/parse_json_file' queue.
// On the other side there is a consumer that receives the job and performs all the business logic.
// Watcher runs every minute as a cronjob.
export class Watcher {
    constructor(
        private readonly inputFilesDir: string,
        private readonly producer: Producer,
    ) {}

    public async findNewFiles() {
        const fileNames = fs.readdirSync(this.inputFilesDir);
        for (const fileName of fileNames) {
            if (storage.findFile(fileName)) {
                continue;
            }

            // Pushing the job to the queue
            await this.producer.publish({ type: JobType.ParseJsonFile, data: { fileName } });

            // Storing the file in the database to prevent reprocessing on the next run
            storage.addFile({ fileName, handlingStartedAt: new Date(), handlingFinishedAt: null });

            console.log('Created job for:', fileName);
        }

        console.log('Finished');
    }
}