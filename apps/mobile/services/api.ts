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

  private static async streamRequest(
    endpoint: string,
    formData: FormData,
    onProgress?: (progress: any) => void
  ): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    const authHeaders = await this.getAuthHeaders();

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let fetch handle it
        Authorization: authHeaders.Authorization || "",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText}`
      );
    }

    if (!response.body) {
      throw new Error("No response stream available");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      // Keep the last incomplete line in buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const eventData = JSON.parse(line.slice(6));
            if (eventData.category === "upload" && onProgress) {
              onProgress(eventData);
            }
          } catch (parseError) {
            console.error("Failed to parse SSE event:", parseError);
          }
        }
      }
    }

    return { success: true };
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
    return this.streamRequest("/api/items?stream=true", files, onProgress);
  }

  static async downloadItem(id: string) {
    return this.request(`/api/items/${id}?action=download`, {
      method: "GET",
    });
  }

  static async deleteItem(id: string, permanent: boolean = true) {
    return this.request(`/api/items/${id}?permanent=${permanent}`, {
      method: "DELETE",
    });
  }

  static async updateItem(id: string, data: { name?: string }) {
    return this.request(`/api/items/${id}`, {
      method: "PATCH",
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
