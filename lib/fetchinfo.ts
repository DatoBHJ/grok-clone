export async function fetchVideoInfo(videoId: string) {
  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const oEmbedResponse = await fetch(oEmbedUrl);
    const oEmbedData = await oEmbedResponse.json();

    return {
      title: oEmbedData.title,
      author: oEmbedData.author_name,
      thumbnail: oEmbedData.thumbnail_url,
    };
  } catch (error) {
    console.error('Error fetching video info:', error);
    throw new Error('Failed to fetch video info');
  }
}

