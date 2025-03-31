const config = {
    env: {
        apiEndPoint: process.env.NEXT_PUBLIC_API_ENDPOINT!,
        imaageKit: {
            publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
            urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
            privateKey: process.env.IMAGE_PRIVATE_KEY!
        },
    },
}

export default config