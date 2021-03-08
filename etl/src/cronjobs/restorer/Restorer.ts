;import * as storage from "../../storage";

const MS_IN_HOUR = 3600000;
const MAX_DIFFERENCE = 1;

// Restorer is responsible for monitoring stuck files.
// If more than an hour has passed since we started to process a file, we can say that a file is stuck.
// In that situation, we need to remove a file from the database (or put a special mark on it) to be able to process it once again on the next Watcher run.
// Restorer runs every hour as a cronjob.
export class Restorer {
    public async restoreStuckFiles() {
        const documents = storage.getAll();

        for (const document of documents) {
            if (document.handlingFinishedAt) {
                continue;
            }

            const difference = this.getHoursDifference(new Date(), document.handlingStartedAt);
            if (difference > MAX_DIFFERENCE) {
                storage.removeFile(document.fileName);
            }
        }
    }

    private getHoursDifference(a: Date, b: Date) {
        return Math.floor(Math.abs((+a - +b) / MS_IN_HOUR));
    }
}