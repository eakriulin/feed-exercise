import { IConfig } from "config";
import fs from 'fs';
import { Container } from "inversify";
import { FsType, TYPES } from "./types";

export const registerExternal = (container: Container, config: IConfig) => {
    container.bind<string>(TYPES.filesDir).toConstantValue(config.get('dirs.initial'));
    container.bind<FsType>(TYPES.fs).toConstantValue(fs);
};
