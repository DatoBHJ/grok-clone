//app/config.tsx
export const config = {
    BaseURL: 'https://api.groq.com/openai/v1',
    API_KEY: process.env.GROQ_API_KEY,
    Model: 'llama-3.1-70b-versatile',
    // BaseURL: "https://api.x.ai/v1",
    // API_KEY: process.env.XAI_API_KEY,
    // Model: 'grok-beta',
    fcBaseURL: 'https://api.groq.com/openai/v1',
    fcAPI_KEY: process.env.GROQ_API_KEY,
    fcModel: 'llama-3.1-70b-versatile',
    // fcModel: 'llama-3.1-8b-instant',
    useRateLimiting: true, 
    numberOfPagesToScan: 1,
    numberOfTweetToScan: 1,
}

