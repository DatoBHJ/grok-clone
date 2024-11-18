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
      name: "getTickers",
      description: "Get a single market name and stock ticker if the user mentions a public company. Include time range for news search.",
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
    const tweetQuery = `${query} inurl:status twitter.com OR x.com`;
    
    const tweetsResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        q: tweetQuery,
        num: 10,
        type: 'search',
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
        source: article.source
      })),
      tweets: tweetsData.organic.map((result: any) => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet,
        date: result.date
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

async function getTickers(ticker: string, time: string) {
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
    const tweetQuery = `${company} stock market OR earnings OR investor inurl:status twitter.com OR x.com`;
    
    const tweetsResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        q: tweetQuery,
        num: 10,
        type: 'search',
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
        source: article.source
      })),
      tweets: tweetsData.organic.map((result: any) => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet,
        date: result.date
      }))
    };
  } catch (error) {
    console.error('Error fetching stock info, news and tweets:', error);
    throw error;
  }
}

type FunctionName = "getTickers" | "searchPlaces" | "goShopping" | "webSearch" | "generateImage" | "getYouTubeTranscript";

const availableFunctions: Record<FunctionName, Function> = {
  getTickers,
  searchPlaces,
  goShopping,
  webSearch,
  generateImage,
  getYouTubeTranscript,
};

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message = body.message

    if (!message) {
      return Response.json(
        { error: 'Missing message in request body' },
        { status: 400 }
      )
    }

    console.log('Sending function call message:', message,'\n')

    const client = new OpenAI({
      apiKey: config.fcAPI_KEY,
      baseURL: config.fcBaseURL,
    })
    
   const response = await client.chat.completions.create({
    model: config.fcModel,
    messages: [
      { 
        role: "system", 
        content: `
You are a function calling agent that analyzes conversations and makes appropriate function calls.

First analyze the conversation context (if provided) and the latest user message to understand:
1. The full context of what the user is asking about
2. Any references to previous messages
3. Any ongoing topics or themes

Then, based on your analysis:
- Call the most appropriate function that matches the user's intent in context
- For ambiguous queries, use the webSearch function as default
- If no function call is needed, you can respond directly

Remember that the latest user message should be interpreted in light of the previous context when deciding which function to call.
        `
      },
      {
        role: "user",
        content: message
      }
    ],
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
        case 'getTickers':
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