import config from 'config';
import cors from 'cors';
import express from 'express';
import Router from 'express-promise-router';
import { initContainer } from './inversify.config';
import { IRoutes, Routes } from './routes';

async function start() {
    const container = initContainer(config);
    const routes = container.resolve<IRoutes>(Routes);

    const app: express.Express = express();
    const router: express.Router = Router();

    const port: string = process.env.PORT || config.get('server.port');
    const prefix: string = config.get('server.prefix');

    app.use(cors());
    app.use(prefix, routes.register(router));
    app.listen(port, () => console.log(`Listening on port ${port}...`));
}

start();
