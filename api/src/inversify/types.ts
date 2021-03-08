export const TYPES = {
    PostController: Symbol.for('PostController'),

    InsightService: Symbol.for('InsightService'),
    JsonFileReader: Symbol.for('JsonFileReader'),

    fs: Symbol.for('fs'),
    filesDir: Symbol.for('filesDir'),
};

export type FsType = typeof import('fs');
