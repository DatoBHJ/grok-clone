export const config = {
    // useOllamaEmbeddings: false,
    BaseURL: 'https://api.groq.com/openai/v1', 
    API_KEY: process.env.GROQ_API_KEY,
    model: 'llama3-8b-8192',

    xAI_BaseURL: "https://api.x.ai/v1",
    xAI_API_KEY: process.env.XAI_API_KEY,
    xAI_model: 'grok-beta',
    
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

