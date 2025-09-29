// API service for communicating with the backend
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Example API methods - to be implemented
  static async getItems() {
    return this.request("/api/items");
  }

  static async uploadFile(file: FormData) {
    return this.request("/api/items", {
      method: "POST",
      body: file,
      headers: {}, // Let fetch set Content-Type for FormData
    });
  }

  static async deleteItem(id: string) {
    return this.request(`/api/items/${id}`, {
      method: "DELETE",
    });
  }
}
