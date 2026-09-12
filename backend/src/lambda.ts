import serverlessExpress from "@vendia/serverless-express";
import app from "./app";
import { scheduledAnalysis } from "./scheduler";

export const handler = serverlessExpress({ app });

export async function scheduledHandler() {
    return scheduledAnalysis();
}