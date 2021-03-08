import { Container } from "inversify";
import { JsonFileReader } from "../services/helpers/JsonFileReader";
import { InsightService } from "../services/insights";
import { TYPES } from "./types";

export const registerServices = (container: Container) => {
    container.bind(TYPES.InsightService).to(InsightService);
    container.bind(TYPES.JsonFileReader).to(JsonFileReader);
};