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
    // emailJsPublicKey
    
    try {
        await emailjs.send(
            emailJsServiceId, 
            emailJsTemplateId,
            emailParams,
        ).then(
            function (response) {
                console.log("SUCCESS!", response.status, response.text);
                toast({
                    title: "Succes",
                    description: "Thanks, message sent successfully",
                });
            },

            function (error) {
                toast({
                    title: "Error",
                    description: "OOPs something went wrong... Try again later",
                    variant: "destructive"
                });
                console.log("FAILED...", error);
            });
    } catch (error) {
        console.log(error);
    }
};