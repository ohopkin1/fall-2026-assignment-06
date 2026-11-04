const API_URL = "http://localhost:8080";

// Types
export interface Article {
  id: number;
  title: string;
  contents: string;
}

export interface Comment {
  id: number;
  article_id: number;
  body: string;
}

// Helper function for API requests
async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ARTICLES

export function getArticles(search?: string): Promise<Article[]> {
  const query = search
    ? `?title_contains=${encodeURIComponent(search)}`
    : "";

  return request<Article[]>(`/articles${query}`);
}

export function getArticle(id: number): Promise<Article> {
  return request<Article>(`/articles/${id}`);
}

export function createArticle(
  article: { title: string; contents: string }
): Promise<Article> {
  return request<Article>("/articles", {
    method: "POST",
    body: JSON.stringify(article),
  });
}

export function updateArticle(
  id: number,
  article: { title?: string; contents?: string }
): Promise<Article> {
  return request<Article>(`/articles/${id}`, {
    method: "PUT",
    body: JSON.stringify(article),
  });
}

export function deleteArticle(id: number): Promise<void> {
  return request<void>(`/articles/${id}`, {
    method: "DELETE",
  });
}

// COMMENTS

export function getComments(articleId: number): Promise<Comment[]> {
  return request<Comment[]>(`/articles/${articleId}/comments`);
}

export function getComment(
  articleId: number,
  commentId: number
): Promise<Comment> {
  return request<Comment>(
    `/articles/${articleId}/comments/${commentId}`
  );
}

export function createComment(
  articleId: number,
  body: string
): Promise<Comment> {
  return request<Comment>(`/articles/${articleId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function updateComment(
  articleId: number,
  commentId: number,
  body: string
): Promise<Comment> {
  return request<Comment>(
    `/articles/${articleId}/comments/${commentId}`,
    {
      method: "PUT",
      body: JSON.stringify({ body }),
    }
  );
}

export function deleteComment(
  articleId: number,
  commentId: number
): Promise<void> {
  return request<void>(
    `/articles/${articleId}/comments/${commentId}`,
    {
      method: "DELETE",
    }
  );
}