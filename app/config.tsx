//app/config.tsx
export const config = {
    // BaseURL: 'https://api.groq.com/openai/v1',
    // API_KEY: process.env.GROQ_API_KEY,
    // Model: 'llama-3.2-90b-vision-preview',
    BaseURL: "https://api.x.ai/v1",
    API_KEY: process.env.XAI_API_KEY,
    Model: 'grok-beta',
    fcBaseURL: 'https://api.groq.com/openai/v1',
    fcAPI_KEY: process.env.GROQ_API_KEY,
    fcModel: 'llama-3.2-90b-vision-preview',
    // fcModel: 'llama-3.1-8b-instant',
    useRateLimiting: true, 
    numberOfPagesToScan: 10,
    numberOfTweetToScan: 10,
}

