# Ollama UI

A modern, responsive web interface for [Ollama](https://ollama.ai/) that allows you to interact with locally running large language models through an intuitive chat interface.

![Next.js](https://img.shields.io/badge/Next.js-15.4.4-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## 🚀 Features

- **Real-time Chat Interface**: Stream responses from local LLMs with a clean, modern UI
- **Model Management**: Easy switching between installed Ollama models
- **System Prompts**: Pre-configured prompts for different use cases (Default, Coder, Teacher, Creative)
- **Markdown Support**: Full markdown rendering with syntax highlighting for code blocks
- **Dark Mode**: Automatic dark mode support based on system preferences
- **Chat Management**: Export conversations and clear chat history
- **Connection Status**: Real-time Ollama connection monitoring
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Streaming Responses**: See AI responses as they're generated
- **Cancel Generation**: Stop long-running responses mid-stream

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0 or higher
- **npm/yarn/pnpm**: Package manager of your choice
- **Ollama**: Running locally on your machine ([Download Ollama](https://ollama.ai/))

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/ollama-ui.git
   cd ollama-ui
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Ensure Ollama is running**

   ```bash
   # Start Ollama if it's not already running
   ollama serve
   ```

4. **Pull at least one model**

   ```bash
   # Example: Pull Llama 3.1 8B model
   ollama pull llama3.1:8b
   ```

## 🚀 Usage

1. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

2. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Start chatting!**
   - Select your preferred model from the dropdown
   - Choose a system prompt preset or use the default
   - Type your message and press Enter or click Send

## 🏗️ Building for Production

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 🔧 Configuration

The application connects to Ollama at `http://localhost:11434` by default. If your Ollama instance is running on a different host or port, you'll need to update the API routes:

- Edit `app/api/chat/route.ts` and `app/api/models/route.ts`
- Update the Ollama URL in the fetch calls

## 📁 Project Structure

```plaintext
ollama-ui/
├── app/
│   ├── api/
│   │   ├── chat/          # Chat endpoint for Ollama communication
│   │   └── models/        # Models endpoint to fetch available models
│   ├── components/
│   │   └── Message.tsx    # Message component with markdown rendering
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Main chat interface
├── public/
│   └── icons/            # Application icons
├── package.json
├── tsconfig.json
└── next.config.ts
```

## 🛡️ API Endpoints

### POST `/api/chat`

Handles chat requests to Ollama

- **Body**:

  ```json
  {
    "messages": [{ "role": "user", "content": "Hello" }],
    "model": "llama3.1:8b",
    "systemPrompt": "You are a helpful assistant"
  }
  ```

- **Response**: Server-sent events stream

### GET `/api/models`

Fetches available Ollama models

- **Response**:

  ```json
  {
    "models": [
      {
        "name": "llama3.1:8b",
        "size": 4661226112,
        "modified_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
  ```

## 🎨 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown) with remark-gfm
- **Syntax Highlighting**: [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)
- **Font**: [Geist](https://vercel.com/font) by Vercel

## 🐛 Troubleshooting

### Ollama Connection Issues

- Ensure Ollama is running: `ollama serve`
- Check if Ollama is accessible: `curl http://localhost:11434/api/tags`
- Verify you have at least one model installed: `ollama list`

### Build Errors

- Clear Next.js cache: `rm -rf .next`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Performance Issues

- For large models, ensure you have sufficient RAM
- Consider using smaller models for faster responses
- Check Ollama logs for any errors: `ollama logs`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) for making local LLM inference accessible
- [Vercel](https://vercel.com/) for Next.js and the Geist font
- The open-source community for the amazing tools and libraries

## 📞 Support

If you encounter any issues or have questions:

- Open an issue on GitHub
- Check the [Ollama documentation](https://github.com/ollama/ollama)
- Join the Ollama Discord community

---

Built with ❤️ for the local AI community
