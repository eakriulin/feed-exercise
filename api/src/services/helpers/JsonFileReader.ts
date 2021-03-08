import { inject, injectable } from 'inversify';
import { FsType, TYPES } from '../../inversify/types';

export interface IJsonFileReader {
    read(fileName: string): Promise<any>;
}

@injectable()
export class JsonFileReader {
    constructor(
        @inject(TYPES.fs) private readonly fs: FsType,
        @inject(TYPES.filesDir) private readonly fileDir: string,
    ) {}

    public read(fileName: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.fs.readFile(`${this.fileDir}${fileName}`, (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    const json = JSON.parse(data.toString());
                    resolve(json);
                }
            });
        });
    }
}