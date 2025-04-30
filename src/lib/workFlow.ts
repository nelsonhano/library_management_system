import { Client as WorkFlowClient } from "@upstash/workflow";
import emailjs from '@emailjs/browser';

import config from "./config";

const {
    env: {
        emailJs: {
            emailJsServiceId,
            emailJsTemplateId,
            emailJsPublicKey
        }
    }
} = config;

const { env: { upstash: { qstashUrl, qstashToken } }} = config;

const workFlowClient = new WorkFlowClient({
    baseUrl: qstashUrl,
    token: qstashToken
});

export default workFlowClient;


export const sendEmail = async ({
    email,
    subject,
    message,
}: {
    email: string;
    subject: string;
    message: string;
}) => {
    try {
        await emailjs.send(emailJsServiceId, emailJsTemplateId, {
            email,
            subject,
            message
        }, emailJsPublicKey);
    } catch (error) {
        console.log(error);
    }
};