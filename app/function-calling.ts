// app/function-calling.ts
export async function functionCalling(message: string): Promise<{
    type: string;
    news?: Array<{ title: string; snippet: string; link: string }>;
    data?: any;
  } | null> {
    try {
      const response = await fetch('/api/function-calling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      })
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Function calling failed:', errorData.error || response.statusText)
        return null
      }
  
      const result = await response.json()
      
      // 결과가 없거나 에러가 있는 경우
      if (!result || result.error || !result.type) {
        return null
      }
  
      return result
    } catch (error) {
      console.error('Function calling error:', error)
      return null
    }
  }