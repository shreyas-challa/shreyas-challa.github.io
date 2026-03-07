// Static blog post data — add new posts here
// To add a new post, add an object to this array with id, title, sub-title,
// content (JSON string from TipTap editor), image path, and created_at.

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
          content: [{ type: "text", text: "Have you ever asked an AI model what's on its mind? Or to explain how it came up with its responses? Models will sometimes answer questions like these, but it's hard to know what to make of their answers. Can AI systems really introspect—that is, can they consider their own thoughts? Or do they just make up plausible-sounding answers when they're asked to do so?" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Understanding whether AI systems can truly introspect has important implications for their transparency and reliability. If models can accurately report on their own internal mechanisms, this could help us understand their reasoning and debug behavioral issues. Beyond these immediate practical considerations, probing for high-level cognitive capabilities like introspection can shape our understanding of what these systems are and how they work. Using interpretability techniques, we've started to investigate this question scientifically, and found some surprising results." }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Our new research provides evidence for some degree of introspective awareness in our current Claude models, as well as a degree of control over their own internal states. We stress that this introspective capability is still highly unreliable and limited in scope: we do not have evidence that current models can introspect in the same way, or to the same extent, that humans do. Nevertheless, these findings challenge some common intuitions about what language models are capable of—and since we found that the most capable models we tested (Claude Opus 4 and 4.1) performed the best on our tests of introspection, we think it's likely that AI models' introspective capabilities will continue to grow more sophisticated in the future." }]
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "What does it mean for an AI to introspect?" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Before explaining our results, we should take a moment to consider what it means for an AI model to introspect. What could they even be introspecting on? Language models like Claude process text (and image) inputs and produce text outputs. Along the way, they perform complex internal computations in order to decide what to say. These internal processes remain largely mysterious, but we know that models use their internal neural activity to represent abstract concepts." }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "You might wonder, then, whether AI models know about these internal representations, in a way that's analogous to a human, say, telling you how they worked their way through a math problem. If we ask a model what it's thinking, will it accurately report the concepts that it's representing internally? If a model can correctly identify its own private internal states, then we can conclude it is capable of introspection." }]
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Testing introspection with concept injection" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "In order to test whether a model can introspect, we need to compare the model's self-reported \"thoughts\" to its actual internal states. To do so, we can use an experimental trick we call concept injection. First, we find neural activity patterns whose meanings we know, by recording the model's activations in specific contexts. Then we inject these activity patterns into the model in an unrelated context, where we ask the model whether it notices this injection, and whether it can identify the injected concept." }]
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Introspection for detecting unusual outputs" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "In another experiment, we tested whether models make use of introspective capabilities for practical purposes, without being explicitly asked to introspect. We forced a model to say something it wouldn't normally say, by artificially prefilling its response with an unrelated word. This behavior is striking because it suggests the model is checking its internal \"intentions\" to determine whether it produced an output." }]
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Conclusions and caveats" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Taken together, our experiments suggest that models possess some genuine capacity to monitor and control their own internal states. This doesn't mean they're able to do so all the time, or reliably. But the pattern of results indicates that, when conditions are right, models can recognize the contents of their own representations. As AI systems continue to improve, understanding the limits and possibilities of machine introspection will be crucial for building systems that are more transparent and trustworthy." }]
        }
      ]
    }),
    image: "/images/ai-introspection.jpg",
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
          content: [{ type: "text", text: "Welcome to my blog! This is a space where I share my thoughts on technology, artificial intelligence, software development, and anything else that catches my interest. Stay tuned for more posts." }]
        }
      ]
    }),
    image: "/images/welcome-blog.jpg",
    created_at: "2025-06-01T10:00:00Z"
  }
];

export default posts;
