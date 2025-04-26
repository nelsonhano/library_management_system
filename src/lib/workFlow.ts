import { Client as WorkFlowClient } from "@upstash/workflow";
import config from "./config";

const { env: { upstash: { qstashUrl, qstashToken } }} = config;

const workFlowClient = new WorkFlowClient({
    baseUrl: qstashUrl,
    token: qstashToken
});