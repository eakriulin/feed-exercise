import fs from 'fs';
import { Consumer } from '../../consumer';
import * as storage from '../../storage';
import { IJob, JobType } from '../../types';

interface IAction {
    action_type: string;
    value: string;
}

interface IInsightsData {
    date_start: string;
    date_stop: string;
    impressions: string;
    spend: string;
    outbound_clicks?: IAction[];
}


interface IAdInsightsJsonItem {
    id: string;
    account_id: string;
    campaign: { id: string };
    insights: { data: IInsightsData };
}

interface IAccountData {
    accountId: string;
    totalSpend: number;
    minCpm: number;
    maxCpm: number;
    totalCpm: number;
    totalAdsCount: number;
}

interface ICampaignData {
    campaignId: string;
    totalSpend: number;
}

// We use FLOAT_NUMBER_SCALER to avoid floating-point numbers' sum problem:
// https://stackoverflow.com/a/2876619/14789504
const FLOAT_NUMBER_SCALER = 10000;

export class FileParserConsumer extends Consumer {
    private readonly inputFilesDir: string;
    private readonly outputFilesDir: string;

    protected readonly jobType: JobType = JobType.ParseJsonFile;

    constructor(exchange: string, listen: string, user: string, password: string, inputFilesDir: string, outputFilesDir: string) {
        super(exchange, listen, user, password);
        this.outputFilesDir = outputFilesDir;
        this.inputFilesDir = inputFilesDir;
    }

    protected async performJob(job: IJob) {
        if (!job.data || !job.data.fileName || !job.type) {
            throw Error('Unexpected payload');
        }

        const { fileName } = job.data;

        // «Syncing» storage across the processes (this document should be added via watcher)
        // We wouldn't need this with a real database
        storage.addFile({ fileName, handlingStartedAt: new Date(), handlingFinishedAt: null });

        let adInsightsJsonItems: IAdInsightsJsonItem[]
        try {
            adInsightsJsonItems = await this.readFile(fileName);    
        } catch (error) {
            // Save handlingFinishedAt to the database to avoid recurring processing of the invalid file
            // We might also want to specify that the file is not valid
            const document = storage.findFile(fileName);
            document.handlingFinishedAt = new Date();
            storage.addFile(document);

            // Throwing error to finish the job
            throw Error('Invalid file');
        }

        const accountsHashTable: Record<string, IAccountData> = {};
        const campaignsHashTable: Record<string, ICampaignData> = {};

        for (const item of adInsightsJsonItems) {

            // Preparing accountsHashTable
            if (accountsHashTable[item.account_id] === undefined) {
                const constPerImpression = this.calculateConstPerImpression(item);
                accountsHashTable[item.account_id] = {
                    accountId: item.account_id,
                    totalSpend: Number(item.insights.data.spend) * FLOAT_NUMBER_SCALER,
                    minCpm: constPerImpression,
                    maxCpm: constPerImpression,
                    totalCpm: constPerImpression * FLOAT_NUMBER_SCALER,
                    totalAdsCount: 1,
                };
            } else {
                accountsHashTable[item.account_id].totalSpend += Number(item.insights.data.spend) * FLOAT_NUMBER_SCALER;

                const constPerImpression = this.calculateConstPerImpression(item);
                if (constPerImpression < accountsHashTable[item.account_id].minCpm) {
                    accountsHashTable[item.account_id].minCpm = constPerImpression;
                }
                if (constPerImpression > accountsHashTable[item.account_id].maxCpm) {
                    accountsHashTable[item.account_id].maxCpm = constPerImpression;
                }

                accountsHashTable[item.account_id].totalCpm += constPerImpression * FLOAT_NUMBER_SCALER;
                accountsHashTable[item.account_id].totalAdsCount++;
            }

            // Preparing campaignsHashTable
            if (campaignsHashTable[item.campaign.id] === undefined) {
                campaignsHashTable[item.campaign.id] = {
                    campaignId: item.campaign.id,
                    totalSpend: Number(item.insights.data.spend) * FLOAT_NUMBER_SCALER,
                };
            } else {
                campaignsHashTable[item.campaign.id].totalSpend += Number(item.insights.data.spend) * FLOAT_NUMBER_SCALER;
            }
        }

        const spendingAccounts = Object.values(accountsHashTable)
            .map((v) => ({ account_id: v.accountId, total_spend: v.totalSpend / FLOAT_NUMBER_SCALER }));

        const spendingCampaigns = Object.values(campaignsHashTable)
            .map((v) => ({ campaign_id: v.campaignId, total_spend: v.totalSpend / FLOAT_NUMBER_SCALER }));

        const accountsConstPerImpressionData = Object.values(accountsHashTable)
            .map((v) => ({
                account_id: v.accountId,
                cost_per_impression: {
                    min: v.minCpm,
                    max: v.maxCpm,
                    avg: Math.round(v.totalCpm / v.totalAdsCount) / FLOAT_NUMBER_SCALER,
                },
            }));


        const result = {
            top_spending: {
                accounts: this.findThreeTopSpending(spendingAccounts),
                campaigns: this.findThreeTopSpending(spendingCampaigns),
            },
            accounts_cost_per_impression_data: accountsConstPerImpressionData,
        };

        // Write result to the output file
        this.writeFile(fileName, result);

        // Save handlingFinishedAt to the database
        const document = storage.findFile(fileName);
        document.handlingFinishedAt = new Date();
        storage.addFile(document);

        return;
    }

    // O(n) time | O(1) space
    private findThreeTopSpending(array: { total_spend: number }[]) {
        let oneIdx = 0;
        let twoIdx = 0;
        let threeIdx = 0;

        for (let i = 0; i < array.length; i++) {
            const { total_spend } = array[i];

            if (total_spend > array[threeIdx].total_spend) {
                if (total_spend >= array[twoIdx].total_spend) {
                    threeIdx = twoIdx;
                    if (total_spend >= array[oneIdx].total_spend) {
                        twoIdx = oneIdx;
                        oneIdx = i;
                    }
                    else {
                        twoIdx = i;
                    }
                }
                else {
                    threeIdx = i;
                }
            }
        }

        return [array[oneIdx], array[twoIdx], array[threeIdx]];
    }

    private calculateConstPerImpression(item: IAdInsightsJsonItem) {
        const impressions = Number(item.insights.data.impressions);
        const spend = Number(item.insights.data.spend);

        return impressions > 0
            ? Math.round(spend / impressions * FLOAT_NUMBER_SCALER) / FLOAT_NUMBER_SCALER
            : spend;
    }

    private readFile(fileName: string): Promise<any> {
        const data = fs.readFileSync(`${this.inputFilesDir}${fileName}`);
        return JSON.parse(data.toString());
    }

    private writeFile(fileName: string, result: any) {
        fs.writeFileSync(`${this.outputFilesDir}handled_${fileName}`, JSON.stringify(result));
    }
}