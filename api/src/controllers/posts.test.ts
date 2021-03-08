import { Request, Response } from 'express';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { IInsightService } from '../services/insights';
import { HttpStatusCode } from '../utils/httpCodes';
import { PostController } from './posts';

describe('PostController', () => {
    const insightService = mockDeep<IInsightService>();
    const req = mockDeep<Request>();
    const res = mockDeep<Response>();

    const postId = '1';
    const aggregatedPostInsight = {
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
    };

    let controller: PostController;

    beforeEach(() => {
        mockReset(insightService);

        mockReset(req);
        mockReset(res);
        res.status.mockReturnValueOnce(res);
        res.send.mockReturnValueOnce(res);

        controller = new PostController(insightService);
    });

    test('getAggregatedPostInsights | post or insights not found => 404', async () => {
        req.params.postId = postId;

        insightService.getAggregatedPostInsights.mockResolvedValue(null);

        await controller.getAggregatedPostInsights(req, res);

        expect(insightService.getAggregatedPostInsights).toHaveBeenCalledWith(postId);
        expect(res.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    });

    test('getAggregatedPostInsights | post or insights not found => 404', async () => {
        req.params.postId = postId;

        insightService.getAggregatedPostInsights.mockResolvedValue(aggregatedPostInsight);

        await controller.getAggregatedPostInsights(req, res);

        expect(insightService.getAggregatedPostInsights).toHaveBeenCalledWith(postId);
        expect(res.status).toHaveBeenCalledWith(HttpStatusCode.Ok);
        expect(res.send).toHaveBeenCalledWith(aggregatedPostInsight);
    });
});