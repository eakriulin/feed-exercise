import { Restorer } from './Restorer';

async function run() {
    const restorer = new Restorer();
    return restorer.restoreStuckFiles();
}

run();
