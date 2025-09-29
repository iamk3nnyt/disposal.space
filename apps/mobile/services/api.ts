// API service for communicating with the backend
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://untitled-monorepo-untitled.vercel.app";

export class ApiService {
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    // This will be set by the hook that uses this service
    const token = (global as any).__clerkToken;

    if (token) {
      return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
    }

    return {
      "Content-Type": "application/json",
    };
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const authHeaders = await this.getAuthHeaders();

    const response = await fetch(url, {
      headers: {
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API Error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }

  // Items API
  static async getItems(parentId?: string | null): Promise<{ items: any[] }> {
    const params = parentId ? `?parentId=${parentId}` : "";
    return this.request(`/api/items${params}`);
  }

  static async searchItems(query: string) {
    return this.request(`/api/items/search?q=${encodeURIComponent(query)}`);
  }

  static async createFolder(name: string, parentId?: string | null) {
    return this.request("/api/items", {
      method: "POST",
      body: JSON.stringify({
        name,
        type: "folder",
        parentId,
      }),
    });
  }

  static async uploadFiles(
    files: FormData,
    onProgress?: (progress: any) => void
  ) {
    // Use non-streaming endpoint for React Native compatibility
    const url = `${API_BASE_URL}/api/items`;
    const authHeaders = await this.getAuthHeaders();

    const response = await fetch(url, {
      method: "POST",
      body: files,
      headers: {
        // Don't set Content-Type for FormData, let fetch handle it
        Authorization: authHeaders.Authorization || "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }

  static async downloadItem(id: string) {
    return this.request(`/api/items/${id}?action=download`, {
      method: "GET",
    });
  }

  // Get preview URL for file download (returns presigned URL)
  static async getItemPreviewUrl(id: string): Promise<{
    url: string;
    fileName: string;
    mimeType: string;
    size: number;
    expiresIn: number;
  }> {
    return this.request(`/api/items/${id}?preview=true`);
  }

  static async deleteItem(id: string, permanent: boolean = true) {
    return this.request(`/api/items/${id}?permanent=${permanent}`, {
      method: "DELETE",
    });
  }

  static async updateItem(
    id: string,
    data: { name?: string; parentId?: string }
  ) {
    return this.request(`/api/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Folder navigation
  static async resolveFolderPath(pathSegments: string[]) {
    return this.request("/api/folders/resolve-path", {
      method: "POST",
      body: JSON.stringify({ pathSegments }),
    });
  }

  // User storage
  static async getUserStorage() {
    return this.request<any>("/api/user/storage");
  }
}
