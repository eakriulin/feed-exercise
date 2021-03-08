import { inject, injectable } from "inversify";
import { TYPES } from "../inversify/types";
import { dateToDateOnlyString } from "../utils/date";
import { JsonFileReader } from "./helpers/JsonFileReader";

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

interface IPostAdsJsonItem {
    id: string;
    profile_id: string;
    account_id: string;
    currency: string;
    ad_id: string;
}


interface IAdInsightsJsonItem {
    id: string;
    insights: { data: IInsightsData };
}

interface IGetAggregatedPostInsightsResult {
    post_id: string;
    insights: { data: IInsightsData, summary: { cost_per_outbound_click: string } };
}

export interface IInsightService {
    getAggregatedPostInsights(postId: string): Promise<IGetAggregatedPostInsightsResult>;
}

const FLOAT_NUMBER_SCALER = 10000;

@injectable()
export class InsightService implements IInsightService {
    constructor(@inject(TYPES.JsonFileReader) private readonly jsonFileReader: JsonFileReader) {}

    public async getAggregatedPostInsights(postId: string): Promise<IGetAggregatedPostInsightsResult> {
        const postAdsJsonItems = await this.jsonFileReader.read('post_ads.json') as IPostAdsJsonItem[];
        // TODO: Map items to postId -> store in cache -> get from cache next time
        
        const postAdIdsSet = new Set<string>();
        for (const item of postAdsJsonItems) {
            if (item.id === postId) {
                postAdIdsSet.add(item.ad_id);
            }
        }

        if (postAdIdsSet.size === 0) {
            return null;
        }

        const adInsightsJsonItems = await this.jsonFileReader.read('ad_insights.json') as IAdInsightsJsonItem[];
        // TODO: Map items to adId -> store in cache -> -> get from cache next time

        let dateStart: Date = null;
        let dateStop: Date = null;
        let impressions = 0;
        let outboundClicks = 0;
        let spend = 0;

        for (const item of adInsightsJsonItems) {
            if (!postAdIdsSet.has(item.id)) {
                continue;
            }
            
            const { data } = item.insights;

            const startedAt = new Date(data.date_start);
            const stoppedAt = new Date(data.date_stop);

            if (startedAt < dateStart || !dateStart) {
                dateStart = startedAt;
            }
            if (stoppedAt > dateStop || !dateStop) {
                dateStop = stoppedAt;
            }
            if (data.impressions) {
                impressions += Number(data.impressions);
            }
            if (data.outbound_clicks && data.outbound_clicks.length > 0 && data.outbound_clicks[0].value) {
                outboundClicks += Number(data.outbound_clicks[0].value);
            }
            if (data.spend) {
                // To avoid js floating-point numbers sum problem:
                // https://stackoverflow.com/a/2876619/14789504
                spend += Number(data.spend) * FLOAT_NUMBER_SCALER;
            }
        }

        if (!dateStart) {
            return null;
        }

        // Setting spend back to normal
        spend = spend / FLOAT_NUMBER_SCALER;
        return {
            post_id: postId,
            insights: {
                data: {
                    date_start: dateToDateOnlyString(dateStart),
                    date_stop: dateToDateOnlyString(dateStop),
                    impressions: String(impressions),
                    outbound_clicks: [{ action_type: 'outbound_click', value: String(outboundClicks) }],
                    spend: String(spend),
                },
                summary: {
                    cost_per_outbound_click: String(this.calculateCostPerOutboundClick(spend, outboundClicks)),
                }
            }
        };
    }

    private calculateCostPerOutboundClick(spend: number, outboundClicks: number): number {
        return outboundClicks > 0
            ? Math.round(spend / outboundClicks * FLOAT_NUMBER_SCALER) / FLOAT_NUMBER_SCALER
            : spend;
    }
}