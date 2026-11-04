import { useEffect, useState, type FormEvent } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  getComments,
  createComment,
  updateComment,
  deleteComment,
  type Article,
  type Comment,
} from './api';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="brand">ArticleHub</Link>
      <Link to="/articles/new" className="nav-button">
        + New Article
      </Link>
    </nav>
  );
}

function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError('');
        setArticles(await getArticles(search));
      } catch {
        setError('Unable to load articles. Is the server running?');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <main className="container">
      <section className="hero">
        <span className="eyebrow">YOUR IDEAS, YOUR SPACE</span>
        <h1>Discover stories<br />worth sharing.</h1>
        <p>Read, create, and join conversations.</p>
      </section>

      <section className="section-heading">
        <div>
          <span className="eyebrow">THE COLLECTION</span>
          <h2>Latest Articles</h2>
        </div>
        <Link to="/articles/new" className="button">
          Write an Article +
        </Link>
      </section>

      <input
        className="search"
        type="search"
        placeholder="Search articles by title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p className="status">Loading articles...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && articles.length === 0 && (
        <div className="empty">
          <h3>No articles found</h3>
          <p>Try another search or write the first article.</p>
        </div>
      )}

      <div className="article-grid">
        {articles.map((article) => (
          <Link
            to={`/articles/${article.articleId}`}
            className="article-card"
            key={article.articleId}
          >
            <span className="card-label">ARTICLE</span>
            <h3>{article.title}</h3>
            <p>
              {article.contents.length > 160
                ? article.contents.slice(0, 160) + '...'
                : article.contents}
            </p>
            <span className="read-more">Read article →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

function ArticleForm({ editing = false }: { editing?: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [contents, setContents] = useState('');
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing || !id) return;

    getArticle(Number(id))
      .then((article) => {
        setTitle(article.title);
        setContents(article.contents);
      })
      .catch(() => setError('Unable to load article.'))
      .finally(() => setLoading(false));
  }, [editing, id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!title.trim() || !contents.trim()) {
      setError('Both title and contents are required.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (editing && id) {
        await updateArticle(Number(id), {
          title: title.trim(),
          contents: contents.trim(),
        });
        navigate(`/articles/${id}`);
      } else {
        const article = await createArticle({
          title: title.trim(),
          contents: contents.trim(),
        });
        navigate(`/articles/${article.articleId}`);
      }
    } catch {
      setError('Unable to save article. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="status">Loading...</p>;

  return (
    <main className="container form-container">
      <Link to="/" className="back-link">← Back to articles</Link>

      <span className="eyebrow">
        {editing ? 'UPDATE YOUR STORY' : 'SHARE YOUR IDEAS'}
      </span>

      <h1>{editing ? 'Edit Article' : 'Create an Article'}</h1>

      <form onSubmit={handleSubmit} className="form">
        <label htmlFor="title">Article Title</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your article a title..."
        />

        <label htmlFor="contents">Article Contents</label>
        <textarea
          id="contents"
          rows={12}
          value={contents}
          onChange={(e) => setContents(e.target.value)}
          placeholder="Start writing your article..."
        />

        {error && <p className="error">{error}</p>}

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Publish Article'}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}

function Comments({ articleId }: { articleId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState('');

  useEffect(() => {
    getComments(articleId)
      .then(setComments)
      .catch(() => setError('Unable to load comments.'))
      .finally(() => setLoading(false));
  }, [articleId]);

  async function addComment(e: FormEvent) {
    e.preventDefault();

    if (!body.trim()) {
      setError('Comment cannot be empty.');
      return;
    }

    try {
      const newComment = await createComment(articleId, body.trim());
      setComments((previous) => [...previous, newComment]);
      setBody('');
      setError('');
    } catch {
      setError('Unable to add comment.');
    }
  }

  async function saveComment(commentId: number) {
    if (!editBody.trim()) {
      setError('Comment cannot be empty.');
      return;
    }

    try {
      const updated = await updateComment(
        articleId,
        commentId,
        editBody.trim()
      );

      setComments((previous) =>
        previous.map((comment) =>
          comment.commentId === commentId ? updated : comment
        )
      );

      setEditingId(null);
      setError('');
    } catch {
      setError('Unable to update comment.');
    }
  }

  async function removeComment(commentId: number) {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await deleteComment(articleId, commentId);

      setComments((previous) =>
        previous.filter((comment) => comment.commentId !== commentId)
      );
    } catch {
      setError('Unable to delete comment.');
    }
  }

  return (
    <section className="comments">
      <span className="eyebrow">JOIN THE CONVERSATION</span>
      <h2>Comments ({comments.length})</h2>

      {loading && <p className="status">Loading comments...</p>}

      {!loading && comments.length === 0 && (
        <p className="muted">No comments yet. Be the first to comment!</p>
      )}

      {comments.map((comment) => (
        <div className="comment" key={comment.commentId}>
          {editingId === comment.commentId ? (
            <>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={3}
              />
              <div className="comment-actions">
                <button onClick={() => saveComment(comment.commentId)}>
                  Save
                </button>
                <button
                  className="secondary"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p>{comment.body}</p>
              <div className="comment-actions">
                <button
                  className="small secondary"
                  onClick={() => {
                    setEditingId(comment.commentId);
                    setEditBody(comment.body);
                    setError('');
                  }}
                >
                  Edit
                </button>
                <button
                  className="small danger"
                  onClick={() => removeComment(comment.commentId)}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      <form onSubmit={addComment} className="comment-form">
        <label htmlFor="comment">Add a comment</label>
        <textarea
          id="comment"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your thoughts..."
          rows={3}
        />
        <button type="submit">Post Comment</button>
      </form>

      {error && <p className="error">{error}</p>}
    </section>
  );
}

function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    getArticle(Number(id))
      .then(setArticle)
      .catch(() => setError('Article not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!id || !window.confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      await deleteArticle(Number(id));
      navigate('/');
    } catch {
      setError('Unable to delete article.');
    }
  }

  if (loading) return <main className="container status">Loading article...</main>;

  if (!article) {
    return <main className="container error">{error || 'Article not found.'}</main>;
  }

  return (
    <main className="container detail-container">
      <Link to="/" className="back-link">← All articles</Link>

      <article className="detail">
        <span className="eyebrow">ARTICLE</span>
        <h1>{article.title}</h1>
        <div className="article-contents">{article.contents}</div>

        <div className="detail-actions">
          <button onClick={() => navigate(`/articles/${id}/edit`)}>
            Edit Article
          </button>
          <button className="danger" onClick={handleDelete}>
            Delete Article
          </button>
        </div>
      </article>

      {error && <p className="error">{error}</p>}

      <Comments articleId={Number(id)} />
    </main>
  );
}

function AppContent() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<ArticleList />} />
        <Route path="/articles/new" element={<ArticleForm />} />
        <Route path="/articles/:id" element={<ArticleDetail />} />
        <Route path="/articles/:id/edit" element={<ArticleForm editing />} />
        <Route path="*" element={<main className="container"><h1>Page not found</h1><Link to="/">Go home</Link></main>} />
      </Routes>
      <footer>ArticleHub · A place for ideas and conversations.</footer>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
