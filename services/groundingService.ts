import { ASIA_COUNTRIES } from '../constants';
import { responseLanguage, translate, type Locale } from '../i18n/locale';
import { GoogleGenAI } from "@google/genai";
import { GroundingResult, GroundingSource } from "../types";

// Fallback campus coordinates for premier Asian universities to ensure pinpoint Maps Grounding
export const UNIVERSITY_COORDINATES: Record<string, { lat: number; lng: number; city: string }> = {
  // Singapore
  'sg_nus': { lat: 1.2966, lng: 103.7764, city: 'Singapore' },
  'sg_ntu': { lat: 1.3483, lng: 103.6831, city: 'Singapore' },
  'sg_smu': { lat: 1.2963, lng: 103.8502, city: 'Singapore' },
  'sg_sutd': { lat: 1.3414, lng: 103.9638, city: 'Singapore' },
  'sg_sit': { lat: 1.3006, lng: 103.7801, city: 'Singapore' },

  // China
  'cn_tsinghua': { lat: 40.0001, lng: 116.3262, city: 'Beijing' },
  'cn_peking': { lat: 39.9869, lng: 116.3059, city: 'Beijing' },
  'cn_fudan': { lat: 31.2989, lng: 121.5034, city: 'Shanghai' },
  'cn_sjtu': { lat: 31.0264, lng: 121.4373, city: 'Shanghai' },
  'cn_zju': { lat: 30.2638, lng: 120.1221, city: 'Hangzhou' },

  // South Korea
  'kr_snu': { lat: 37.4563, lng: 126.9527, city: 'Seoul' },
  'kr_kaist': { lat: 36.3721, lng: 127.3604, city: 'Daejeon' },
  'kr_yonsei': { lat: 37.5658, lng: 126.9386, city: 'Seoul' },
  'kr_korea': { lat: 37.5894, lng: 127.0323, city: 'Seoul' },
  'kr_postech': { lat: 36.0142, lng: 129.3248, city: 'Pohang' },

  // Japan
  'jp_u_tokyo': { lat: 35.7128, lng: 139.7620, city: 'Tokyo' },
  'jp_kyoto': { lat: 35.0262, lng: 135.7808, city: 'Kyoto' },
  'jp_tokyo_tech': { lat: 35.6048, lng: 139.6841, city: 'Tokyo' },
  'jp_osaka': { lat: 34.8219, lng: 135.5262, city: 'Osaka' },
  'jp_tohoku': { lat: 38.2552, lng: 140.8722, city: 'Sendai' },

  // Kazakhstan
  'kz_nu': { lat: 51.0906, lng: 71.3984, city: 'Astana' },
  'kz_kaznu': { lat: 43.2220, lng: 76.9200, city: 'Almaty' },
  'kz_satbayev': { lat: 43.2372, lng: 76.9312, city: 'Almaty' },
  'kz_kbtu': { lat: 43.2551, lng: 76.9438, city: 'Almaty' },
  'kz_enu': { lat: 51.1605, lng: 71.4646, city: 'Astana' },

  // UAE
  'ae_nyuad': { lat: 24.5247, lng: 54.4346, city: 'Abu Dhabi' },
  'ae_ku': { lat: 24.4429, lng: 54.3942, city: 'Abu Dhabi' },
  'ae_aus': { lat: 25.3129, lng: 55.4913, city: 'Sharjah' },
  'ae_uaeu': { lat: 24.1974, lng: 55.6888, city: 'Al Ain' },
  'ae_uod': { lat: 25.1118, lng: 55.3908, city: 'Dubai' },

  // Malaysia
  'my_um': { lat: 3.1209, lng: 101.6538, city: 'Kuala Lumpur' },
  'my_ukm': { lat: 2.9289, lng: 101.7800, city: 'Bangi' },
  'my_upm': { lat: 2.9996, lng: 101.7082, city: 'Serdang' },
  'my_usm': { lat: 5.3562, lng: 100.3015, city: 'Penang' },
  'my_utm': { lat: 1.5583, lng: 103.6377, city: 'Johor Bahru' },

  // Thailand
  'th_chula': { lat: 13.7384, lng: 100.5323, city: 'Bangkok' },
  'th_mahidol': { lat: 13.7937, lng: 100.3242, city: 'Nakhon Pathom' },
  'th_cmu': { lat: 18.8044, lng: 98.9535, city: 'Chiang Mai' },
  'th_tu': { lat: 13.7570, lng: 100.4915, city: 'Bangkok' },
  'th_ku': { lat: 13.8477, lng: 100.5702, city: 'Bangkok' },

  // Vietnam
  'vn_vinuni': { lat: 20.9904, lng: 105.9554, city: 'Hanoi' },
  'vn_vnu_hn': { lat: 21.0375, lng: 105.7820, city: 'Hanoi' },
  'vn_vnu_hcm': { lat: 10.8700, lng: 106.8030, city: 'Ho Chi Minh City' },
  'vn_hust': { lat: 21.0044, lng: 105.8433, city: 'Hanoi' },
  'vn_fpt': { lat: 21.0131, lng: 105.5262, city: 'Hanoi' },

  // Philippines
  'ph_up': { lat: 14.6538, lng: 121.0685, city: 'Quezon City' },
  'ph_admu': { lat: 14.6394, lng: 121.0777, city: 'Quezon City' },
  'ph_dlsu': { lat: 14.5647, lng: 120.9932, city: 'Manila' },
  'ph_ust': { lat: 14.6096, lng: 120.9897, city: 'Manila' },
  'ph_mapua': { lat: 14.5905, lng: 120.9778, city: 'Manila' },

  // Indonesia
  'id_ui': { lat: -6.3644, lng: 106.8286, city: 'Depok' },
  'id_itb': { lat: -6.8915, lng: 107.6107, city: 'Bandung' },
  'id_ugm': { lat: -7.7712, lng: 110.3776, city: 'Yogyakarta' },
  'id_unair': { lat: -7.2691, lng: 112.7587, city: 'Surabaya' },
  'id_ipb': { lat: -6.5599, lng: 106.7262, city: 'Bogor' },

  // India
  'in_iitb': { lat: 19.1334, lng: 72.9133, city: 'Mumbai' },
  'in_iitd': { lat: 28.5450, lng: 77.1926, city: 'New Delhi' },
  'in_iitm': { lat: 12.9915, lng: 80.2337, city: 'Chennai' },
  'in_iisc': { lat: 13.0219, lng: 77.5671, city: 'Bangalore' },
  'in_dli': { lat: 28.6892, lng: 77.2104, city: 'Delhi' }
};

export class GroundingService {
  private getClient(): GoogleGenAI {
    const customKey = localStorage.getItem('gemini_api_key');
    const key = customKey || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY || process.env?.API_KEY : '');
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }

  /**
   * Search Grounding using gemini-3.5-flash with googleSearch tool
   * Retrieves real-time admissions, deadlines, visa changes, and scholarship quotas.
   */
  async fetchSearchGroundedData(
    query: string,
    context?: { universityName?: string; location?: string; locale?: Locale }
  ): Promise<GroundingResult> {
    const locale = context?.locale || 'en';
    const targetUni = context?.universityName || 'Asian Universities';
    const targetLoc = context?.location || 'Asia';
    if (!localStorage.getItem('gemini_api_key') &&
        !(typeof process !== 'undefined' && (process.env?.GEMINI_API_KEY || process.env?.API_KEY))) {
      return this.searchFallback(query, context?.universityName, locale);
    }

    const systemPrompt = `You are the lead admissions researcher for Bagdar Asia.
Your task is to provide up-to-date, accurate, grounded information for international students applying to ${targetUni} in ${targetLoc}.
Focus on:
1. Official application deadlines for the upcoming 2026/2027 intake cycles.
2. Verified minimum entry requirements (IELTS/TOEFL, SAT/ACT/national tests, GPA standards).
3. Government & institutional scholarships (quota, coverage, deadlines, stipend details).
4. Recent visa or post-graduation work permit policies.

Formatting: Use structured Markdown with clear headings, bullet points, and highlight verified dates. Write the answer in ${responseLanguage[locale]}.`;

    const userPrompt = `${systemPrompt}\n\nCandidate Question: ${query}`;

    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const text = response.text || translate(locale, 'No information retrieved.');
      const metadata = response.candidates?.[0]?.groundingMetadata;
      const chunks = metadata?.groundingChunks || [];
      const searchQueries = metadata?.webSearchQueries || [];

      const sources: GroundingSource[] = [];
      const seenUris = new Set<string>();

      for (const chunk of chunks) {
        if (chunk.web?.uri && !seenUris.has(chunk.web.uri)) {
          seenUris.add(chunk.web.uri);
          sources.push({
            title: chunk.web.title || chunk.web.uri,
            uri: chunk.web.uri,
            type: 'web'
          });
        }
      }

      if (!response.text?.trim() || !sources.length) {
        return this.searchFallback(query, context?.universityName, locale);
      }

      return {
        text,
        sources,
        searchQueries,
        groundingType: 'search',
        timestamp: new Date().toLocaleTimeString(locale)
      };
    } catch (err: any) {
      console.warn("Search Grounding API encountered an error, activating resilient grounded intelligence:", err);
      return this.searchFallback(query, context?.universityName, locale);
    }
  }

  /**
   * Maps Grounding using gemini-3.5-flash with googleMaps tool
   * Retrieves campus geography, neighborhood navigation, nearby dorms, transit, and food.
   */
  async fetchMapsGroundedData(
    query: string,
    options?: {
      locale?: Locale;
      universityId?: string;
      universityName?: string;
      location?: string;
      userCoordinates?: { latitude: number; longitude: number };
    }
  ): Promise<GroundingResult> {
    const locale = options?.locale || 'en';
    const uniName = options?.universityName || 'Asian University Campus';
    const uniLoc = options?.location || 'Asia';
    
    // Check known coordinates or fallback to user coordinates
    let latLng = options?.userCoordinates;
    if (!latLng && options?.universityId && UNIVERSITY_COORDINATES[options.universityId]) {
      const c = UNIVERSITY_COORDINATES[options.universityId];
      latLng = { latitude: c.lat, longitude: c.lng };
    }

    const prompt = `You are a campus geographical guide for Bagdar Asia.
Analyze the campus location, student transit, surrounding neighborhood, dormitories, and student amenities for ${uniName} in ${uniLoc}.
Focus on:
1. Exact campus district, landmark location, and campus accessibility.
2. Nearest subway / metro stations, bus routes, and transit times to the central city / airport.
3. Student accommodation options (on-campus dorms vs. popular off-campus rental neighborhoods).
4. Student life hubs: popular cafeterias, study libraries, grocery supermarkets, and cafes around campus.

Address this specific inquiry: "${query}".
Provide a concise, helpful Markdown breakdown in ${responseLanguage[locale]}.`;

    try {
      const ai = this.getClient();
      
      const config: any = {
        tools: [{ googleMaps: {} }]
      };

      if (latLng) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: latLng.latitude,
              longitude: latLng.longitude
            }
          }
        };
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config
      });

      const text = response.text || translate(locale, 'No location details available.');
      const metadata = response.candidates?.[0]?.groundingMetadata;
      const chunks = metadata?.groundingChunks || [];

      const sources: GroundingSource[] = [];
      const seenUris = new Set<string>();

      for (const chunk of chunks) {
        const mapsObj = (chunk as any)?.maps;
        if (mapsObj?.uri && !seenUris.has(mapsObj.uri)) {
          seenUris.add(mapsObj.uri);
          sources.push({
            title: mapsObj.title || `${uniName} on Google Maps`,
            uri: mapsObj.uri,
            type: 'maps'
          });
        }
      }

      // If model returned no direct map links, provide direct Google Maps query link
      if (sources.length === 0) {
        sources.push({
          title: `View ${uniName} on Google Maps`,
          uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(uniName + ' ' + uniLoc)}`,
          type: 'maps'
        });
      }

      return {
        text,
        sources,
        groundingType: 'maps',
        timestamp: new Date().toLocaleTimeString(locale)
      };
    } catch (err: any) {
      console.warn("Maps Grounding API encountered an error, activating resilient maps intelligence:", err);
      return this.mapsFallback(uniName, uniLoc, locale);
    }
  }

  private searchFallback(query: string, name: string | undefined, locale: Locale): GroundingResult {
    const universities = ASIA_COUNTRIES.flatMap(country => country.universities);
    const normalizedQuery = query.trim().toLocaleLowerCase(locale);
    const matches = universities.filter(university => {
      const names = [university.name, translate(locale, university.name)];
      return names.some(value => {
        const normalizedName = value.toLocaleLowerCase(locale);
        return normalizedQuery.includes(normalizedName) ||
          (normalizedQuery.length >= 3 && normalizedName.includes(normalizedQuery));
      }) || (normalizedQuery.length >= 3 && university.location.toLocaleLowerCase(locale).includes(normalizedQuery));
    });
    const selected = name ? universities.find(university => university.name === name) : undefined;
    const sources: GroundingSource[] = (selected ? [selected] : matches.slice(0, 6)).map(university => ({
      title: university.name,
      uri: university.website,
      type: 'web',
    }));
    const search = new URL('https://www.google.com/search');
    search.searchParams.set('q', [name, query.trim(), 'university admissions'].filter(Boolean).join(' '));
    sources.push({ title: 'Search on Google', uri: search.toString(), type: 'web' });
    return {
      text: translate(locale, 'Open an official university website below or continue this query on Google.'),
      sources,
      groundingType: 'search',
      timestamp: new Date().toLocaleTimeString(locale),
      fallback: true,
    };
  }

  private mapsFallback(uniName: string, location: string, locale: Locale): GroundingResult {
    const text = translate(locale, 'Live Maps results are unavailable. Use the links below to check the campus, housing, and transit near {name}.', { name: translate(locale, uniName) });
    const mapSearchQuery = encodeURIComponent(`${uniName} ${location}`);
    const sources: GroundingSource[] = [
      {
        title: translate(locale, '{name} Campus on Google Maps', { name: uniName }),
        uri: `https://www.google.com/maps/search/?api=1&query=${mapSearchQuery}`,
        type: 'maps'
      },
      {
        title: translate(locale, 'Student Housing & Dormitories near {name}', { name: uniName }),
        uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('student dorms apartments near ' + uniName)}`,
        type: 'maps'
      },
      {
        title: translate(locale, 'Transit & Metro Stations near {name}', { name: uniName }),
        uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('transit metro station near ' + uniName)}`,
        type: 'maps'
      }
    ];

    return {
      text,
      sources,
      groundingType: 'maps',
      timestamp: new Date().toLocaleTimeString(locale),
      fallback: true,
    };
  }
}

export const groundingService = new GroundingService();
