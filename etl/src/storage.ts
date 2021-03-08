// Imaginary database for the sake of simplicity
// In a real project we can use whatever we want — MongoDB, MySQL, PostgreSQL, etc.

interface IDocument {
    fileName: string;
    handlingStartedAt: Date;
    handlingFinishedAt: Date | null;
}

const storage = {};

export function getAll(): IDocument[] {
    return Object.values(storage);
}

export function findFile(fileName: string): IDocument {
    return storage[fileName] || null;
}

export function addFile(data: IDocument): void {
    storage[data.fileName] = data;
}

export function removeFile(fileName: string): void {
    delete storage[fileName];
}
