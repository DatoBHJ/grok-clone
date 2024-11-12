// function-calling.ts
export async function functionCalling(message: string): Promise<any> {
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

    return result as any;
  } catch (error) {
    console.error('Function calling error:', error);
    return null;
  }
}