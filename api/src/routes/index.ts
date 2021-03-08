import { Router } from 'express';
import { inject, injectable } from 'inversify';
import { IPostController } from '../controllers/posts';
import { TYPES } from '../inversify/types';

export interface IRoutes {
    register(router: Router): Router;
}

@injectable()
export class Routes implements IRoutes {
    constructor(
        @inject(TYPES.PostController)
        private readonly postController: IPostController,
    ) {}

    public register(router: Router): Router {
        router.get('/posts/:postId', this.postController.getAggregatedPostInsights);
        return router;
    }
}
