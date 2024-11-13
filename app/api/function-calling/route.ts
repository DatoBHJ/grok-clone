// app/api/function-calling/route.ts
import { OpenAI } from 'openai'
import { config } from '@/app/config'
import { type ChatCompletionTool } from 'openai/resources/chat/completions'
import { fal } from "@fal-ai/client";

const client = new OpenAI({
  apiKey: config.API_KEY,
  baseURL: config.BaseURL,
})

type FunctionName = "getTickers" | "searchPlaces" | "goShopping" | "searchNews" | "generateImage" | "searchTweets";

const functions: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getTickers",
      description: "Get a single market name and stock ticker if the user mentions a public company",
      parameters: {
        type: "object",
        properties: {
          ticker: {
            type: "string",
            description: "The stock ticker symbol and market name, example NYSE:K or NASDAQ:AAPL",
          },
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
      name: "searchNews",
      description: "Search for recent news articles using the given query",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query for news articles",
          },
        },
        required: ["query"],
      },
    },
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
  {
    type: "function",
    function: {
      name: "searchTweets",
      description: "Search for recent tweets (within last 7 days) when user wants to find Twitter/X posts",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query for tweets",
          },
        },
        required: ["query"],
      },
    },
  },
];


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

async function searchNews(query: string) {
  try {
    const response = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query })
    });

    if (!response.ok) {
      throw new Error(`News search failed with status: ${response.status}`);
    }

    const data = await response.json();
    return {
      type: 'news_search' as const,
      news: data.news.map((article: any) => ({
        title: article.title,
        link: article.link,
        snippet: article.snippet,
        date: article.date,
        source: article.source
      }))
    };
  } catch (error) {
    console.error('Error searching news:', error);
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
      body: JSON.stringify({ q: query, location: location }),
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
      body: JSON.stringify({ q: query })
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

async function getTickers(ticker: string) {
  try {
    // Then fetch related news about the company
    const company = ticker.split(':')[1]; // Extract company symbol (e.g., 'NVDA' from 'NASDAQ:NVDA')
    const newsResponse = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        num: 10,
        q: `${company} stock market news`,
        tbs: 'qdr:w',
      })
    });

    if (!newsResponse.ok) {
      throw new Error(`News search failed with status: ${newsResponse.status}`);
    }

    const newsData = await newsResponse.json();
    
    // Combine ticker and news information
    return {
      type: 'stock_info' as const,
      data: ticker,
      news: newsData.news.map((article: any) => ({
        title: article.title,
        link: article.link,
        snippet: article.snippet,
        date: article.date,
        source: article.source
      }))
    };
  } catch (error) {
    console.error('Error fetching stock info and news:', error);
    throw error;
  }
}

async function searchTweets(query: string) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateString = sevenDaysAgo.toISOString().split('T')[0];
    
    // 직접 트윗 URL 패턴으로 검색
    const enhancedQuery = `${query} inurl:status twitter.com OR x.com after:${dateString}`;
    
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        q: enhancedQuery,
        num: 10,
        type: 'search',
        tbs: 'qdr:w',
        // gl: 'us'
      })
    });

    if (!response.ok) {
      throw new Error(`Tweet search failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Tweet search data:', data);
    
    const tweets = data.organic.map((result: any) => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
    }));

    return {
      type: 'tweets' as const,
      tweets
    };
  } catch (error) {
    console.error('Error searching tweets:', error);
    throw error;
  }
}

const availableFunctions: Record<FunctionName, Function> = {
  getTickers,
  searchPlaces,
  goShopping,
  searchNews,
  generateImage,
  searchTweets
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

    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        { 
          role: "system", 
          content: `
          You are a function calling agent. 
          You will be given a query and a list of functions. 
          Your task is to call the appropriate function based on the query and return the result in JSON format. 
          ONLY CALL A FUNCTION IF YOU ARE HIGHLY CONFIDENT IT WILL BE USED
    
          - For stock-related queries, use getTickers to get both stock symbol and recent news
          - Only call searchNews when user asks for general news or current events
          - Only call generateImage when user wants to create or generate images
          - Only call searchPlaces when user needs location information
          - Only call goShopping when user wants to buy or find products
          - Only call searchTweets when user wants to find recent posts/updates from Twitter/X
    
          Remember, call the function when you are ABSOLUTELY SURE it will be used.` 
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

    // If no tool calls, return a valid response with null type
    if (!toolCalls || toolCalls.length === 0) {
      return Response.json({ type: null, data: null }, { status: 200 })
    }

    const functionCall = toolCalls[0]
    const functionName = functionCall.function.name as FunctionName
    const functionToCall = availableFunctions[functionName]
    
    try {
      const args = JSON.parse(functionCall.function.arguments)
      let result

      switch (functionName) {
        case 'getTickers':
          result = await functionToCall(args.ticker)
          break
        case 'searchPlaces':
          result = await functionToCall(args.query, args.location)
          break
        case 'goShopping':
          result = await functionToCall(args.query)
          break
        case 'searchNews':
          result = await functionToCall(args.query)
          break
        case 'generateImage':
          result = await functionToCall(args.prompt)
          break
        case 'searchTweets':
          result = await functionToCall(args.query)
          break
        default:
          return Response.json({ type: null, data: null }, { status: 200 })
      }

      return Response.json(result)
    } catch (error) {
      console.error(`Function execution error:`, error)
      return Response.json(
        { type: null, data: null, error: 'Function execution failed' },
        { status: 200 } // Changed to 200 to avoid triggering error handling
      )
    }

  } catch (error) {
    console.error('Function calling error:', error)
    return Response.json(
      { type: null, data: null, error: 'Function calling failed' },
      { status: 200 } // Changed to 200 to avoid triggering error handling
    )
  }
}