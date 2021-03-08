import { Container } from "inversify";
import { PostController } from "../controllers/posts";
import { TYPES } from "./types";

export const registerControllers = (container: Container) => {
    container.bind(TYPES.PostController).to(PostController);
};