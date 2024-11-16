import { getSubtitles } from 'youtube-captions-scraper';
import { YoutubeTranscript } from 'youtube-transcript';
export const runtime = 'edge';
import axios from 'axios';

class YoutubeTranscriptError extends Error {
  constructor(message: string) {
    super(`[YoutubeTranscript] ${message}`);
  }
}

function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
    '&nbsp;': ' ',
  };
  
  text = text.replace(/&amp;#39;/g, "'")
             .replace(/&amp;quot;/g, '"')
             .replace(/&amp;gt;/g, '>')
             .replace(/&amp;lt;/g, '<')
             .replace(/&amp;amp;/g, '&');
  
  text = text.replace(/&[\w#]+;/g, entity => entities[entity] || entity);
  
  text = text.replace(/\\'/g, "'");
  
  return text;
}

function cleanTranscriptText(text: string): string {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `[${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}]`;
  } else {
    return `[${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}]`;
  }
}

function groupTranscriptByApprox10Seconds(transcript: Array<{ text: string; start: number }>): string {
  let result = '';
  let currentGroup = '';
  let groupStartTime = transcript[0]?.start || 0;

  transcript.forEach((item, index) => {
    if (index === 0 || item.start - groupStartTime >= 10) {
      if (currentGroup) {
        result += `${formatTimestamp(groupStartTime)} ${currentGroup.trim()}\n`;
      }
      groupStartTime = item.start;
      currentGroup = item.text;
    } else {
      currentGroup += ' ' + item.text;
    }
  });

  if (currentGroup) {
    result += `${formatTimestamp(groupStartTime)} ${currentGroup.trim()}\n`;
  }

  return result.trim();
}

async function fetchTranscriptPrimary(videoId: string, lang: string = 'en'): Promise<string> {
  try {
    const captions = await getSubtitles({
      videoID: videoId,
      lang: lang
    });
    
    interface Caption {
        text: string;
        start: string;
    }

    interface FormattedCaption {
        text: string;
        start: number;
    }

    const formattedCaptions: FormattedCaption[] = captions.map((item: Caption) => ({
        text: cleanTranscriptText(item.text),
        start: parseFloat(item.start)
    }));

    return groupTranscriptByApprox10Seconds(formattedCaptions);
  } catch (error) {
    console.error('Error fetching transcript with youtube-captions-scraper:', error);
    throw error;
  }
}

async function fetchTranscriptSecondary(videoId: string, lang: string = 'en'): Promise<string> {
    // 영어가 아닌 경우 바로 에러를 던져서 다음 단계로 넘어가게 함
    if (lang !== 'en') {
      throw new Error(`Secondary method does not support language: ${lang}`);
    }
  
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      const formattedTranscript = transcript.map(item => ({
        text: decodeHtmlEntities(item.text),
        start: item.offset 
      }));
      return groupTranscriptByApprox10Seconds(formattedTranscript);
    } catch (error) {
      console.error('Error fetching transcript with youtube-transcript:', error);
      throw error;
    }
  }

async function fetchTranscriptSearchAPI(videoId: string, lang: string = 'en'): Promise<string> {
  const API_KEY = process.env.SEARCH_API_KEY; 
  if (!API_KEY) {
    throw new Error('SearchAPI key is not set');
  }

  try {
    const response = await axios.get('https://www.searchapi.io/api/v1/search', {
      params: {
        engine: 'youtube_transcripts',
        video_id: videoId,
        lang: lang,
        api_key: API_KEY
      }
    });

    const data = response.data;

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.transcripts || data.transcripts.length === 0) {
      // 특정 언어의 자막이 없는 경우 영어로 재시도
      if (lang !== 'en') {
        console.warn(`No transcripts found for language ${lang}, trying English`);
        return fetchTranscriptSearchAPI(videoId, 'en');
      }
      throw new Error('No transcripts found');
    }

    const formattedTranscript = data.transcripts.map((item: any) => ({
      text: cleanTranscriptText(item.text),
      start: item.start
    }));

    return groupTranscriptByApprox10Seconds(formattedTranscript);
  } catch (error) {
    console.error('Error fetching transcript with SearchAPI:', error);
    throw error;
  }
}

async function fetchTranscriptWithBackup(videoId: string, lang: string = 'en'): Promise<string> {
    try {
      const primaryTranscript = await fetchTranscriptPrimary(videoId, lang);
      console.log(`Extracted transcript using primary method (${lang})`, primaryTranscript, '\n');
      return primaryTranscript;
    } catch (primaryError) {
      console.warn(`Primary method failed for language ${lang}, trying next method:`, primaryError);
      
      // 영어인 경우에만 secondary 메서드 시도
      if (lang === 'en') {
        try {
          const secondaryTranscript = await fetchTranscriptSecondary(videoId, lang);
          console.log(`Extracted transcript using secondary method (${lang})`, secondaryTranscript, '\n');
          return secondaryTranscript;
        } catch (secondaryError) {
          console.warn(`Secondary method failed for language ${lang}, trying SearchAPI method:`, secondaryError);
        }
      }
  
      // SearchAPI로 시도
      try {
        const searchAPITranscript = await fetchTranscriptSearchAPI(videoId, lang);
        console.log(`Extracted transcript using SearchAPI (${lang})`, searchAPITranscript, '\n');
        return searchAPITranscript;
      } catch (searchAPIError) {
        console.error('All methods failed:', searchAPIError);
        throw new YoutubeTranscriptError(`Failed to fetch transcript using all available methods for language ${lang}`);
      }
    }
  }

const getYouTubeVideoId = (url: string): string => {
  if (!url || url.trim() === '') {
    return '';
  }

  try {
    let videoId = '';
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?(?:m\.)?youtu(?:be\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/)|\.be\/)([\w\-]{11})(?:\S+)?/,
      /(?:https?:\/\/)?(?:www\.)?(?:m\.)?youtube\.com\/shorts\/([\w\-]{11})(?:\S+)?/
    ];
  
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        videoId = match[1];
        break;
      }
    }
  
    if (!videoId) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v') || '';
    }
  
    if (!videoId) {
      videoId = simpleHash(url).toString(16).substring(0, 11);
    }
  
    return videoId;
  } catch (error) {
    console.error('Invalid URL:', url);
    return '';
  }
};

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export { fetchTranscriptWithBackup, getYouTubeVideoId };