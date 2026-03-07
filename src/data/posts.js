// Static blog post data — add new posts here
// Since Supabase is no longer available, posts are stored as static data.
// To add a new post, add an object to this array.

const posts = [
  {
    id: 1,
    title: "Can AI Models Introspect?",
    "sub-title": "New research provides evidence for introspective awareness in Claude models",
    content: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Have you ever asked an AI model what's on its mind? Or to explain how it came up with its responses? Models will sometimes answer questions like these, but it's hard to know what to make of their answers. Can AI systems really introspect—that is, can they consider their own thoughts? Or do they just make up plausible-sounding answers when they're asked to do so?"
            }
          ]
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Understanding whether AI systems can truly introspect has important implications for their transparency and reliability. If models can accurately report on their own internal mechanisms, this could help us understand their reasoning and debug behavioral issues. Beyond these immediate practical considerations, probing for high-level cognitive capabilities like introspection can shape our understanding of what these systems are and how they work. Using interpretability techniques, we've started to investigate this question scientifically, and found some surprising results."
            }
          ]
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Our new research provides evidence for some degree of introspective awareness in our current Claude models, as well as a degree of control over their own internal states. We stress that this introspective capability is still highly unreliable and limited in scope: we do not have evidence that current models can introspect in the same way, or to the same extent, that humans do."
            }
          ]
        }
      ]
    }),
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop",
    created_at: "2025-06-15T10:00:00Z"
  },
  {
    id: 2,
    title: "Welcome to Noigel Blog",
    "sub-title": "A space for thoughts on technology, AI, and more",
    content: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Welcome to my blog! This is a space where I share my thoughts on technology, artificial intelligence, software development, and anything else that catches my interest. Stay tuned for more posts."
            }
          ]
        }
      ]
    }),
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=400&fit=crop",
    created_at: "2025-06-01T10:00:00Z"
  }
];

export default posts;
