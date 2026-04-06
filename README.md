# Lilac

An online epub and pdf reader with a spoiler-free AI reading assistant. Ask questions about your book without ever seeing content ahead of where you've read.

## Features

- Upload and read epub and pdf files in the browser
- **Spoiler-free chatbot** — powered by a locally-run Ollama model, the assistant only has context up to your current reading position
- Vector search over book content for grounded, accurate answers
- User accounts with personal libraries

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, TypeScript |
| Backend | Go |
| Database | PostgreSQL + pgvector |
| AI | Ollama (local LLM + embeddings) |
| Auth | Custom JWT |
| Hosting | Fly.io (backend), Supabase (DB), Vercel (frontend) |

## How the AI Works

When a book is uploaded, it is chunked and embedded using Ollama's embedding model (`nomic-embed-text`). Chunks are stored in pgvector with their position in the book.

At query time, only chunks **at or before the user's current reading position** are retrieved. These are passed as context to the chat model, keeping the assistant completely spoiler-free.

## Self-Hosting

Ollama must be running locally or on a server you control — it is not a cloud service. Pull the required models before starting:

```bash
ollama pull nomic-embed-text   # embeddings
ollama pull <chat-model>       # e.g. mistral, llama3, gemma3
```
