import config from 'config';
import { FileParserConsumer } from './FileParserConsumer';

function run() {
    const { exchange, listen, user, password } = config.get('amqp');
    const inputFilesDir = config.get<string>('dirs.input');
    const outputFilesDir = config.get<string>('dirs.output');
    const consumer = new FileParserConsumer(exchange, listen, user, password, inputFilesDir, outputFilesDir);
    consumer.start();
}

// We can easily scale consumers via pm2 or using running them as a cluster https://nodejs.org/api/cluster.html
run();
