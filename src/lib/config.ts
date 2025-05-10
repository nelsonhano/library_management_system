const config = {
    env: {
        apiEndPoint: process.env.NEXT_PUBLIC_API_ENDPOINT!,
        prodApiEndPoint: process.env.NEXT_PUBLIC_PROD_API_ENDPOINT!,
        imageKit: {
            publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
            urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
            privateKey: process.env.IMAGE_PRIVATE_KEY!
        },
        databaseUrl: process.env.DATABASE_URL!,
        upstash: {
            redisUrl: process.env.UPSTASH_REDIS_REST_URL!,
            redisToken: process.env.UPSTASH_REDIS_REST_TOKEN!,
            qstashUrl: process.env.QSTASH_URL,
            qstashToken: process.env.QSTASH_TOKEN
        },
        emailJs: {
            emailJsServiceId: process.env.NEXT_EMAILJS_SERVICE_ID!,
            emailJsTemplateId: process.env.NEXT_EMAILJS_TEMPLATE_ID!,
            emailJsPublicKey: process.env.NEXT_EMAILJS_PRUBLIC_KEY!,
        }
    },
}

export default config