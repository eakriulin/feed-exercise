import { IConfig } from 'config';
import { Container } from 'inversify';
import 'reflect-metadata';
import { registerControllers } from './inversify/controllers';
import { registerExternal } from './inversify/external';
import { registerServices } from './inversify/services';

export function initContainer(config: IConfig): Container {
    const container = new Container();
    registerControllers(container);
    registerServices(container);
    registerExternal(container, config);
    return container;
}
