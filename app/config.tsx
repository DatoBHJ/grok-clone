//app/config.tsx
export const config = {
    // useOllamaEmbeddings: false,
    BaseURL: "https://api.x.ai/v1",
    API_KEY: process.env.XAI_API_KEY,
    Model: 'grok-beta',

    fcBaseURL: 'https://api.groq.com/openai/v1',
    fcAPI_KEY: process.env.GROQ_API_KEY,
    fcModel: 'llama3-8b-8192',
    
    // embeddingsModel: 'text-embedding-3-small',
    // textChunkSize: 800, 
    // textChunkOverlap: 200, 
    // useSemanticCache: true, 
    useRateLimiting: true, 
    // startIndexOfPagesToScan: 0,
    numberOfPagesToScan: 8,
    numberOfTweetToScan: 8,
    // timeout: 700, 
    // embedTimeout: 15000, 
    // similarityThreshold: 0.6,
    // ArticleSimilarityThreshold:0.0,
    // numberOfSimilarityResults: 4, 
    // numberOfVideosToScan: 6,
    // numberOfImagesToScan: 9,
    // MINIMUM_CHUNK_SIZE: 300,
}

