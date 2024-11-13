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

    // First try to parse the response as JSON
    const result = await response.json();

    // If response is not ok, handle the error
    if (!response.ok) {
      console.error('Function calling failed:', result.error || response.statusText);
      return null;
    }

    // For cases where no function was called but the request was successful
    if (!result || !result.type) {
      return null;
    }

    return result;
  } catch (error) {
    console.error('Function calling error:', error);
    return null;
  }
}