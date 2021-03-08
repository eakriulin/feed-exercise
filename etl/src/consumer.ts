import * as amqp from 'amqplib';
import { IJob } from './types';

export abstract class Consumer {
    private connection: amqp.Connection;
    private channel: amqp.Channel;
    private queueName: string;
    private topicName: string;

    protected readonly jobType: string;

    constructor(
        private readonly exchange: string,
        private readonly listen: string,
        private readonly user: string,
        private readonly password: string,
    ) {}

    protected abstract performJob(job: IJob): Promise<any>;

    public async start() {
        await this.connect();

        this.channel.consume(
            this.queueName,
            async (message) => {
                const job = JSON.parse(message.content.toString());
                try {
                    await this.performJob(job);
                    this.channel.ack(message);
                } catch (error) {
                    // Send error to Sentry / Rollbar / Our own logging system
                    console.error(error, job);
                    this.channel.reject(message);
                }
            },
            { noAck: false },
        );
    }

    private async connect() {
        this.connection = await amqp.connect(this.listen, {
            credentials: amqp.credentials.plain(this.user, this.password),
        });
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

        this.queueName = `jobs/${this.jobType}`;
        this.topicName = `jobs.${this.jobType}`;

        await this.channel.assertQueue(this.queueName);
        await this.channel.bindQueue(this.queueName, this.exchange, this.topicName);

        console.log('Ready to consume from', this.queueName, 'queue');
    }
}