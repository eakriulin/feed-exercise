export enum JobType {
    ParseJsonFile = 'parse_json_file',
}

export interface IJob {
    type: JobType;
    data: any;
}
