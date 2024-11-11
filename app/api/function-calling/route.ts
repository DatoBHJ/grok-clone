// app/api/function-calling/route.ts
import { OpenAI } from 'openai'
import { config } from '@/app/config'
import { type ChatCompletionTool } from 'openai/resources/chat/completions'

// app/api/function-calling/route.ts

import { fal } from "@fal-ai/client";

// Flux API 응답 타입 정의
interface FluxImageResponse {
  images: Array<{
    url: string;
  }>;
  seed: number;
  timings: {
    total: number;
  };
}


interface Place {
  position: number;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  ratingCount: number;
  category: string;
  phoneNumber: string;
  website: string;
  cid: string;
}


const client = new OpenAI({
  apiKey: config.API_KEY,
  baseURL: config.BaseURL,
})

type FunctionName = "getTickers" | "searchPlaces" | "goShopping" | "searchNews" | "generateImage";

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
];


async function generateImage(prompt: string) {
  try {
    fal.config({
      credentials: process.env.FAL_KEY
    });

    const result = await fal.subscribe<FluxImageResponse>("fal-ai/fast-turbo-diffusion", {
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
      images: result.data.images.map(img => ({
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
      places: data.places.map((place: Place) => ({
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
  return {
    type: 'ticker' as const,
    data: ticker
  }
}


const availableFunctions: Record<FunctionName, Function> = {
  getTickers,
  searchPlaces,
  goShopping,
  searchNews,
  generateImage,
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
          content: `You are a function calling agent. You will be given a query and a list of functions.
          Your task is to call the appropriate function based on the query and return the result in JSON format.
          ONLY CALL A FUNCTION IF YOU ARE HIGHLY CONFIDENT IT WILL BE USED.
          
          Choose the most relevant function based on the user's query:
          - For stock/company queries, use getTickers
          - For location-based searches, use searchPlaces
          - For product searches, use goShopping
          - For news-related queries, use searchNews` 
        },
        {
          role: "user",
          content: message
        }
      ],
      tools: functions,
      tool_choice: "auto"
    })

    const toolCalls = response.choices[0]?.message?.tool_calls

    if (!toolCalls || toolCalls.length === 0) {
      return Response.json({ type: null, data: null })
    }

    // Execute function if called
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
      }

      return Response.json(result)
    } catch (error) {
      console.error(`Function execution error:`, error)
      return Response.json(
        { error: 'Function execution failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Function calling error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}