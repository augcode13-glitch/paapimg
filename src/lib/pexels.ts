import type { PexelsSearchResponse, PexelsCuratedResponse } from '../types/pexels';

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const PEXELS_API_URL = 'https://api.pexels.com/v1';

export class PexelsAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${PEXELS_API_URL}${endpoint}`, {
      headers: {
        Authorization: this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.statusText}`);
    }

    return response.json();
  }

  async searchPhotos(query: string, page = 1, perPage = 30): Promise<PexelsSearchResponse> {
    return this.fetch<PexelsSearchResponse>(
      `/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`
    );
  }

  async getCuratedPhotos(page = 1, perPage = 30): Promise<PexelsCuratedResponse> {
    return this.fetch<PexelsCuratedResponse>(
      `/curated?page=${page}&per_page=${perPage}`
    );
  }
}

export const pexelsClient = PEXELS_API_KEY ? new PexelsAPI(PEXELS_API_KEY) : null;
