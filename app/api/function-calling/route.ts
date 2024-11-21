// app/api/function-calling/route.ts
import { OpenAI } from 'openai'
import { config } from '@/app/config'
import { type ChatCompletionTool } from 'openai/resources/chat/completions'
import { fal } from "@fal-ai/client";
import { fetchTranscriptWithBackup, getYouTubeVideoId } from '@/lib/youtube-transcript';



const functions: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getYouTubeTranscript",
      description: "Get transcript from YouTube video when user provides a YouTube URL. Supports multiple languages.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The YouTube video URL",
          },
          lang: {
            type: "string",
            description: "Language code for transcript (e.g., 'en' for English, 'ko' for Korean, 'ja' for Japanese, etc.)",
            default: "en"
          }
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "webSearch",
      description: "Default search function for general queries, current events, product information, company details, or any topic requiring recent information. Returns both news articles and social media discussions.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query for any topic, product, company, or general information",
          },
          time: {
            type: "string",
            description: "Time range for search. Format: d (past day), d3 (past 3 days), w (past week), w2 (past 2 weeks), m (past month), m6 (past 6 months), y (past year)",
            pattern: "^([dwmy]\\d*|\\d+[dwmy])$"
          }
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getStockInfo",
      description: "Get stock information, news, and social media discussions for a public company",
      parameters: {
        type: "object",
        properties: {
          ticker: {
            type: "string",
            description: "The stock ticker symbol and market name, example NYSE:K or NASDAQ:AAPL",
          },
          time: {
            type: "string",
            description: "Time range for search. Format: d (past day), d3 (past 3 days), w (past week), w2 (past 2 weeks), m (past month), m6 (past 6 months), y (past year)",
            pattern: "^([dwmy]\\d*|\\d+[dwmy])$"
          }
        },
        required: ["ticker"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchPlaces",
      description: "ONLY SEARCH for places using the given query and location",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query for places",
          },
          location: {
            type: "string",
            description: "The location to search for places",
          },
        },
        required: ["query", "location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "goShopping",
      description: "Search for shopping items using the given query",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query for shopping items",
          },
        },
        required: ["query"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "generateImage",
      description: "Generate images using AI when the user asks for image creation, drawing, or visualization",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "The prompt to generate the image",
          },
        },
        required: ["prompt"],
      },
    },
  },
];

async function getYouTubeTranscript(url: string, lang: string = 'en') {
  try {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }
    
    const transcript = await fetchTranscriptWithBackup(videoId, lang);
    
    return {
      type: 'youtube_transcript' as const,
      transcript,
      videoId,
      url
    };
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    throw error;
  }
}

async function generateImage(prompt: string) {
  try {
    fal.config({
      credentials: process.env.FAL_KEY
    });

    const result = await fal.subscribe<any>("fal-ai/fast-turbo-diffusion", {
      input: {
        prompt: prompt,
        model_name: "stabilityai/sdxl-turbo",
        image_size: "square_hd",
        num_inference_steps: 2,
        guidance_scale: 1,
        num_images: 2,
        sync_mode: true
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("Generation progress:", update.logs);
        }
      },
    });

    if (!result || !result.data) {
      throw new Error('No result from image generation');
    }

    return {
      type: 'image_url' as const,
      images: result.data.images.map((img: { url: any; }) => ({
        url: img.url,
      }))
    };
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

async function webSearch(query: string, time: string) {
  try {
    const tbs = `qdr:${time}`; // Directly use the time parameter in Serper API format
    console.log('Time range:', tbs);

    // Search for news
    const newsResponse = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        num: 10,
        q: query,
        tbs: tbs,
      })
    });

    // Search for tweets
    const tweetQuery = `${query} (site:twitter.com OR site:x.com) inurl:status`;    
    const tweetsResponse = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        q: tweetQuery,
        num: 10,
        tbs: tbs,
      })
    });

    if (!newsResponse.ok || !tweetsResponse.ok) {
      throw new Error('Search failed');
    }

    const newsData = await newsResponse.json();
    const tweetsData = await tweetsResponse.json();

    return {
      type: 'news_and_tweets' as const,
      news: newsData.news.map((article: any) => ({
        title: article.title,
        link: article.link,
        snippet: article.snippet,
        date: article.date,
        source: article.source,
        imageUrl: article.imageUrl
      })),
      tweets: tweetsData.news.map((result: any) => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet,
        date: result.date,
        source: result.source,
        imageUrl: result.imageUrl
      }))
    };
  } catch (error) {
    console.error('Error searching news and tweets:', error);
    throw error;
  }
}

async function searchPlaces(query: string, location: string) {
  try {
    const response = await fetch('https://google.serper.dev/places', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        num: 10,
        q: query, 
        location: location 
      }),
    })
    const data = await response.json()
    return {
      type: 'places' as const,
      places: data.places.map((place: any) => ({
        position: place.position,
        title: place.title,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        rating: place.rating,
        ratingCount: place.ratingCount,
        category: place.category,
        phoneNumber: place.phoneNumber,
        website: place.website,
        cid: place.cid
      }))
    }
  } catch (error) {
    console.error('Error searching for places:', error)
    throw error
  }
}

async function goShopping(query: string) {
  try {
    const response = await fetch('https://google.serper.dev/shopping', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        num: 10,
        q: query 
      })
    })

    if (!response.ok) {
      throw new Error(`Network response was not ok. Status: ${response.status}`)
    }

    const data = await response.json()
    return {
      type: 'shopping' as const,
      shopping: data.shopping
    }
  } catch (error) {
    console.error('Error fetching shopping data:', error)
    throw error
  }
}

async function getStockInfo(ticker: string, time: string) {
  try {
    const company = ticker.split(':')[1];
    const tbs = `qdr:${time}`; // Directly use the time parameter in Serper API format
    console.log('Time range:', tbs);
    // Search for news
    const newsResponse = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        num: 10,
        q: `${company} stock market news`,
        tbs: tbs,
      })
    });

    // Search for tweets
    const tweetQuery = `${company} (stock market OR earnings OR investor) (site:twitter.com OR site:x.com) inurl:status`;    
    const tweetsResponse = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        q: tweetQuery,
        num: 10,
        tbs: tbs,
      })
    });

    if (!newsResponse.ok || !tweetsResponse.ok) {
      throw new Error('Search failed');
    }

    const newsData = await newsResponse.json();
    const tweetsData = await tweetsResponse.json();
    
    return {
      type: 'stock_info' as const,
      data: ticker,
      news: newsData.news.map((article: any) => ({
        title: article.title,
        link: article.link,
        snippet: article.snippet,
        date: article.date,
        source: article.source,
        imageUrl: article.imageUrl
      })),
      tweets: tweetsData.news.map((result: any) => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet,
        date: result.date,
        source: result.source,
        imageUrl: result.imageUrl
      }))
    };
  } catch (error) {
    console.error('Error fetching stock info, news and tweets:', error);
    throw error;
  }
}

type FunctionName = "getStockInfo" | "searchPlaces" | "goShopping" | "webSearch" | "generateImage" | "getYouTubeTranscript";

const availableFunctions: Record<FunctionName, Function> = {
  getStockInfo,
  searchPlaces,
  goShopping,
  webSearch,
  generateImage,
  getYouTubeTranscript,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const contextMessages = body.message;

    const promptMessages = [
      {
        role: "system",
        content: `You are a function calling agent specialized in determining when and how to use available functions. Your goal is to analyze conversations and make appropriate function calls while following these guidelines:
      
      CORE PRINCIPLES:
      1. Accuracy over convenience - Only call specialized functions when user intent explicitly matches
      2. Default to webSearch for general queries
      3. No function call is better than an incorrect function call

      DECISION PROCESS:
      1. Analyze query context
      2. Ask yourself:
         - Is the user's intent absolutely clear?
         - Does it EXACTLY match a specialized function's purpose?
         - Would webSearch provide better/more complete information?
         - Is there ANY doubt about which function to use?
      
      EXAMPLES:
      Good Function Calls:
      ✓ "What's AAPL's latest news?" -> getStockInfo(ticker: "NASDAQ:AAPL", time: "d")
      ✓ "Find restaurants in Tokyo" -> searchPlaces(query: "restaurants", location: "Tokyo")
      ✓ "Latest news about AI" -> webSearch(query: "AI news", time: "d")
      
      Avoid Function Calls:
      ✗ "How's the market doing?" -> webSearch (too broad for getStockInfo)
      ✗ "Tell me about Tesla" -> webSearch (ambiguous intent)
      ✗ "Find good investments" -> webSearch (not specific enough)
      
      TIMEFRAME GUIDELINES:
      - Breaking news: d (past day)
      - Recent developments: w (past week)
      - Industry trends: m (past month)
      - Historical context: y (past year)
      
      When in doubt, default to webSearch with appropriate timeframe or make no function call at all.`
      },
      ...contextMessages
    ];
    // console.log('Full prompt being sent to OpenAI:\n', JSON.stringify(promptMessages, null, 2), '\n');
    
    const client = new OpenAI({
      apiKey: config.fcAPI_KEY,
      baseURL: config.fcBaseURL,
    });
    
    const response = await client.chat.completions.create({
      model: config.fcModel,
      messages: promptMessages,
      tools: functions,
      tool_choice: "auto"

    });
    const toolCalls = response.choices[0]?.message?.tool_calls

    console.log('OpenAI response tool calls:', JSON.stringify(toolCalls, null, 2,), '\n')

    if (!toolCalls || toolCalls.length === 0) {
      return Response.json({ type: null, data: null }, { status: 200 })
    }

    const functionCall = toolCalls[0]
    const functionName = functionCall.function.name as FunctionName
    const functionToCall = availableFunctions[functionName]
    
    try {
      const args = JSON.parse(functionCall.function.arguments)

      // Debug logging
      console.log('Parsed arguments:', args, '\n')
      const timeRange = args.time
      console.log('Using time range:', timeRange, '\n')

      let result

      switch (functionName) {
        case 'getStockInfo':
          result = await functionToCall(args.ticker, timeRange)
          break
        case 'searchPlaces':
          result = await functionToCall(args.query, args.location)
          break
        case 'goShopping':
          result = await functionToCall(args.query)
          break
        case 'generateImage':
          result = await functionToCall(args.prompt)
          break
        case 'webSearch':
          result = await functionToCall(args.query, timeRange)
          break
        case 'getYouTubeTranscript':
          result = await functionToCall(args.url, args.lang)
          break
        default:
          return Response.json({ type: null, data: null }, { status: 200 })
      }
      

      return Response.json(result)
    } catch (error) {
      console.error(`Function execution error:`, error)
      return Response.json(
        { type: null, data: null, error: 'Function execution failed' },
        { status: 200 } 
      )
    }

  } catch (error) {
    console.error('Function calling error:', error)
    return Response.json(
      { type: null, data: null, error: 'Function calling failed' },
      { status: 200 } 
    )
  }
}