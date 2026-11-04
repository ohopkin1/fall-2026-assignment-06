const API_URL = 'http://localhost:8080';

export interface Article {
  articleId: number;
  title: string;
  contents: string;
}

export interface Comment {
  commentId: number;
  articleId: number;
  body: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const getArticles = (query = '') =>
  request<Article[]>(
    `/articles?title_contains=${encodeURIComponent(query)}`
  );

export const getArticle = (id: number) =>
  request<Article>(`/articles/${id}`);

export const createArticle = (data: {
  title: string;
  contents: string;
}) =>
  request<Article>('/articles', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateArticle = (
  id: number,
  data: { title: string; contents: string }
) =>
  request<Article>(`/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteArticle = (id: number) =>
  request<Article>(`/articles/${id}`, {
    method: 'DELETE',
  });

export const getComments = (articleId: number) =>
  request<Comment[]>(`/articles/${articleId}/comments`);

export const createComment = (articleId: number, body: string) =>
  request<Comment>(`/articles/${articleId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });

export const updateComment = (
  articleId: number,
  commentId: number,
  body: string
) =>
  request<Comment>(
    `/articles/${articleId}/comments/${commentId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ body }),
    }
  );

export const deleteComment = (
  articleId: number,
  commentId: number
) =>
  request<Comment>(
    `/articles/${articleId}/comments/${commentId}`,
    { method: 'DELETE' }
  );
