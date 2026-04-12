import Constants from 'expo-constants';

const appExtra = Constants.manifest?.extra || Constants.expoConfig?.extra || {};
const GEMINI_API_KEY = appExtra.geminiApiKey || process.env.GEMINI_API_KEY || '';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const extractJson = (text) => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const jsonText = text.slice(start, end + 1);
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
};

const buildJourneyPrompt = (journey) => {
  const routeDescription = journey.segments
    .map(
      (segment, index) =>
        `${index + 1}. ${segment.street} (${segment.locality}) - ${segment.characteristics}`
    )
    .join('\n');

  return `You are a local travel guide and safety analyst for Ahmedabad. A user is about to start a journey. Analyze the route and provide a concise popup-ready overview focusing on the following aspects:

- The overall road character and plot holes or uneven sections.
- Street light coverage and nighttime visibility.
- Localities and neighborhood mood.
- Busyness, crowd density, traffic risk, and any likely crowded spots.
- Helpful advice for someone traveling this route.

Return a JSON object with these keys: overall, plotHoles, streetLights, localities, busyness, advice.

Journey title: ${journey.title}
Start: ${journey.start}
End: ${journey.end}
Route segments:
${routeDescription}

Keep each field short enough for a small mobile popup. Use plain language and avoid code formatting.`;
};

const generateMockJourneyOverview = (journey) => {
  return {
    routeTitle: journey.title,
    overall: `A mixed city route through busy commercial arteries and quieter residential pockets. Expect traffic around main junctions and decent pedestrian infrastructure on the safer sections.`,
    plotHoles: `Some older service roads near the market segment may have uneven patches and mild potholes, especially after rain.`,
    streetLights: `Main roads are fairly well lit, while inner lanes in older localities are dimmer and need extra caution after dusk.`,
    localities: `Starts in ${journey.segments[0].locality}, then crosses into ${journey.segments[1].locality} before reaching ${journey.segments[journey.segments.length - 1].locality}.`, 
    busyness: `Moderately busy overall; the central sections are likely to see steady traffic and pedestrians, while the end stretch feels calmer.`,
    advice: `Move carefully through the commercial stretch, keep to the main road after dark, and watch for two-wheeler clusters near the junctions.`,
  };
};

export const summarizeJourney = async (journey) => {
  const prompt = buildJourneyPrompt(journey);
  if (!GEMINI_API_KEY) {
    return { ...generateMockJourneyOverview(journey), source: 'mock' };
  }

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 280,
    },
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('[JourneyAI] Gemini request failed:', response.status, errorText);
      return { ...generateMockJourneyOverview(journey), source: 'mock' };
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = extractJson(content);

    if (parsed) {
      return {
        routeTitle: journey.title,
        overall: parsed.overall || 'Route feels mixed with safer and busier sections.',
        plotHoles: parsed.plotHoles || 'Some sections may have uneven pavement and occasional potholes.',
        streetLights: parsed.streetLights || 'Lighting is mixed; main roads are brighter than inner lanes.',
        localities: parsed.localities || 'Passes through a blend of commercial and residential areas.',
        busyness: parsed.busyness || 'Moderate to heavy foot and vehicle traffic in central areas.',
        advice: parsed.advice || 'Pay attention at busy crossings and prefer main roads after dark.',
        source: 'gemini',
      };
    }

    // Fallback if JSON parsing fails
    return {
      routeTitle: journey.title,
      overall: content.trim().slice(0, 200) || 'Unable to parse AI response.',
      plotHoles: '',
      streetLights: '',
      localities: '',
      busyness: '',
      advice: 'Use caution on the selected route.',
      source: 'gemini-raw',
    };
  } catch (error) {
    console.error('[JourneyAI] fetch error:', error);
    return { ...generateMockJourneyOverview(journey), source: 'mock' };
  }
};
