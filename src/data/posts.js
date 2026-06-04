// Static blog post data — add new posts here
// To add a new post, add an object to this array with id, title, sub-title,
// content (JSON string from TipTap editor), image path, and created_at.

const posts = [
  {
    id: 2,
    title: "Welcome to Noigel Blog",
    "sub-title": "A space for thoughts on technology, AI, and more",
    content: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Welcome to my blog! This is a space where I share my thoughts on technology, artificial intelligence, software development, and anything else that catches my interest. Stay tuned for more posts." }]
        }
      ]
    }),
    image: "/images/welcome-blog.jpg",
    created_at: "2025-06-01T10:00:00Z"
  }
];

export default posts;
