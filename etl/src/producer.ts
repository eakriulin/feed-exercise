import * as amqp from 'amqplib';
import { IJob } from './types';

export class Producer {
    private connection: amqp.Connection;
    private channel: amqp.Channel;

    constructor(
        private readonly exchange: string,
        private readonly listen: string,
        private readonly user: string,
        private readonly password: string,
    ) {}

    public async connect() {
        this.connection = await amqp.connect(this.listen, {
            credentials: amqp.credentials.plain(this.user, this.password),
        });
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
    }

    public async publish(job: IJob) {
        return this.channel.publish(
            this.exchange, `jobs.${job.type}`, Buffer.from(JSON.stringify(job)), { persistent: true },
        );
    }
}
