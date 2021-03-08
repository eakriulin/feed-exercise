// tslint:disable: no-magic-numbers
import { mockDeep, mockReset } from 'jest-mock-extended';
import { IJsonFileReader } from './helpers/JsonFileReader';
import { InsightService } from './insights';

describe('InsightService', () => {
    const jsonFileReader = mockDeep<IJsonFileReader>();

    const postIdWithInsights = '23845019639810675';
    const postIdWithoutInsights = '23845019639810676';

    const postAdsJsonItems = [
        {
            id: '23845019639810675',
            profile_id: '172739',
            account_id: '262926030499631',
            currency: 'GBP',
            ad_id: '23845211039190675'
        },
        {
            id: '23845019639810676',
            profile_id: '172739',
            account_id: '262926030499631',
            currency: 'GBP',
            ad_id: '1'
        },
    ];

    const adInsightsJsonItems = [
        {
            id: '23845211039190675',
            account_id: '144136466541306',
            campaign: {
                id: '23845419708740675',
                objective: 'POST_ENGAGEMENT'
            },
            adset: {
                id: '23846714054650675',
                'optimization_goal': 'POST_ENGAGEMENT'
            },
            insights: {
                data: {
                    actions: [
                        {
                            action_type: 'link_click',
                            value: '1'
                        },
                        {
                            action_type: 'page_engagement',
                            value: '38'
                        },
                        {
                            action_type: 'post_reaction',
                            value: '37'
                        },
                        {
                            action_type: 'post_engagement',
                            value: '38'
                        }
                    ],
                    date_start: '2021-02-01',
                    date_stop: '2021-02-01',
                    impressions: '192',
                    outbound_clicks: [
                        {
                            action_type: 'outbound_click',
                            value: '1'
                        }
                    ],
                    spend: '0.38'
                }
            }
        },
        {
            id: '23845211039190675',
            account_id: '144136466541306',
            campaign: {
                id: '23845419708740675',
                objective: 'POST_ENGAGEMENT'
            },
            adset: {
                id: '23846714054650675',
                'optimization_goal': 'POST_ENGAGEMENT'
            },
            insights: {
                data: {
                    actions: [
                        {
                            action_type: 'post_reaction',
                            value: '90'
                        },
                        {
                            action_type: 'post_engagement',
                            value: '91'
                        },
                        {
                            action_type: 'onsite_conversion.post_save',
                            value: '1'
                        },
                        {
                            action_type: 'page_engagement',
                            value: '91'
                        }
                    ],
                    date_start: '2021-02-02',
                    date_stop: '2021-02-02',
                    impressions: '364',
                    spend: '0.89'
                }
            }
        },
    ];

    let service: InsightService;

    beforeEach(() => {
        mockReset(jsonFileReader);
        service = new InsightService(jsonFileReader as any);
    });

    test('getAggregatedPostInsights | post not found => null', async () => {
        const postId = '1';
        jsonFileReader.read.mockResolvedValueOnce(postAdsJsonItems);

        const result = await service.getAggregatedPostInsights(postId);

        expect(jsonFileReader.read).toBeCalledWith('post_ads.json');
        expect(jsonFileReader.read).toHaveBeenCalledTimes(1);
        expect(result).toBe(null);
    });

    test('getAggregatedPostInsights | insights not found => null', async () => {
        const postId = postIdWithoutInsights;
        jsonFileReader.read.mockResolvedValueOnce(postAdsJsonItems);
        jsonFileReader.read.mockResolvedValueOnce(adInsightsJsonItems);

        const result = await service.getAggregatedPostInsights(postId);

        expect(jsonFileReader.read).toHaveBeenNthCalledWith(1, 'post_ads.json');
        expect(jsonFileReader.read).toHaveBeenNthCalledWith(2, 'ad_insights.json');
        expect(result).toBe(null);
    });

    test('getAggregatedPostInsights | post found, insights found => result', async () => {
        const postId = postIdWithInsights;
        jsonFileReader.read.mockResolvedValueOnce(postAdsJsonItems);
        jsonFileReader.read.mockResolvedValueOnce(adInsightsJsonItems);

        const result = await service.getAggregatedPostInsights(postId);

        expect(jsonFileReader.read).toHaveBeenNthCalledWith(1, 'post_ads.json');
        expect(jsonFileReader.read).toHaveBeenNthCalledWith(2, 'ad_insights.json');
        expect(result).toStrictEqual({
            post_id: postId,
            insights: {
                data: {
                    date_start: '2021-02-01',
                    date_stop: '2021-02-02',
                    impressions: '556',
                    outbound_clicks: [{ action_type: 'outbound_click', value: '1' }],
                    spend: '1.27',
                },
                summary: {
                    cost_per_outbound_click: '1.27',
                }
            }
        });
    });
});