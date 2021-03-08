import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../inversify/types';
import { IInsightService } from '../services/insights';
import { HttpStatusCode } from '../utils/httpCodes';

export interface IPostController {
    getAggregatedPostInsights: (req: Request, res: Response) => Promise<any>;
}

@injectable()
export class PostController implements IPostController {
    constructor(
        @inject(TYPES.InsightService) private readonly insightService: IInsightService,
    ) {}

    public getAggregatedPostInsights = async (req: Request, res: Response) => {
        const result = await this.insightService.getAggregatedPostInsights(req.params.postId);
        if (!result) {
            return res.status(HttpStatusCode.NotFound).send({ message: 'Not found' });
        }
        return res.status(HttpStatusCode.Ok).send(result);
    };
}
