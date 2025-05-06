import { Client as WorkFlowClient } from "@upstash/workflow";
import emailjs from '@emailjs/browser';

import config from "./config";
import { toast } from "@/hooks/use-toast";

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
    title,
    name,
    message,
    email,
}: {
    title: string,
    name: string,
    message: string,
    email: string,
}) => {
    const emailParams = {
        title,
        name,
        message,
        email
    };
    
    try {
        await emailjs.send(
            emailJsServiceId, 
            emailJsTemplateId,
            emailParams,
            emailJsPublicKey
        ).then(
            function (response) {
                console.log({
                    title: "Succes",
                    description: `Thanks, message sent successfully ${response}`,
                });
            },

            function (error) {
                console.log({
                    title: "Error",
                    description: `${error} OOPs something went wrong... Try again later`,
                });
            });
    } catch (error) {
        console.log(error);
    }
};