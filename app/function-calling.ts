// function-calling.ts
interface NewsResult {
  type: 'news_search';
  news: Array<{ 
    title: string; 
    snippet: string; 
    link: string; 
  }>;
}

interface ImageGenerationResult {
  type: 'image_generation';
  images: Array<{
    url: string;
    content_type: string;
  }>;
}

interface TickerResult {
  type: 'ticker';
  data: any;
}

type FunctionResult = NewsResult | ImageGenerationResult | TickerResult | null;

export async function functionCalling(message: string): Promise<FunctionResult> {
  try {
    const response = await fetch('/api/function-calling', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Function calling failed:', errorData.error || response.statusText);
      return null;
    }

    const result = await response.json();
    
    if (!result || result.error || !result.type) {
      return null;
    }

    return result as FunctionResult;
  } catch (error) {
    console.error('Function calling error:', error);
    return null;
  }
}