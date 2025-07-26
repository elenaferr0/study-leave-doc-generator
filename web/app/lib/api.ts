// API types and interfaces
export interface ActivityType {
  value: string;
  name: string;
}

export interface Language {
  code: string;
  name: string;
}

export interface DocumentInputs {
  language: string;
  name: string;
  id: string;
  degree: string;
  course?: string;
  professor?: string;
  date: string;
  city: string;
  image_path?: string;
  activity_type: string;
}

export interface ApiError {
  error: string;
  message: string;
}

// API service class
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  private async fetchWithErrorHandling<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getActivityTypes(): Promise<{ activity_types: ActivityType[] }> {
    return this.fetchWithErrorHandling<{ activity_types: ActivityType[] }>('/document/activity-types');
  }

  async getSupportedLanguages(): Promise<Language[]> {
    return this.fetchWithErrorHandling<Language[]>('/document/supported-languages');
  }

  async buildDocument(inputs: DocumentInputs): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/document/build`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputs),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Document build failed:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const apiService = new ApiService();

// Export the class for custom instances if needed
export { ApiService };
