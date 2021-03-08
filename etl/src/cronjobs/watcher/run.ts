import config from 'config';
import { Producer } from '../../producer';
import { Watcher } from './Watcher';

const DELAY_MS = 5000;

async function run() {
    const { exchange, listen, user, password } = config.get('amqp');
    const inputFilesDir = config.get<string>('dirs.input');

    const producer = new Producer(exchange, listen, user, password);
    await producer.connect();

    const watcher = new Watcher(inputFilesDir, producer);
    await watcher.findNewFiles();
    
    setTimeout(() => process.exit(), DELAY_MS);
}

run();
