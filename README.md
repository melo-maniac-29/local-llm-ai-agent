
An AI-powered study scheduling assistant built with Next.js that helps students create personalized study schedules and integrates with Google Calendar for seamless planning.

## 🚀 Features

- **AI-Powered Chat Interface**: Interactive chat with LLM-based assistant
- **Smart Study Scheduling**: Generate personalized study schedules for exams (NEET, JEE, etc.)
- **Google Calendar Integration**: Automatically add study sessions to your calendar
- **Conversation History**: Save and resume chat conversations
- **Real-time Streaming**: Stream responses from local LLM models
- **User Authentication**: Secure user accounts with Convex backend
- **Responsive Design**: Works on desktop and mobile devices

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Convex (serverless backend)
- **AI/LLM**: LangChain, Local LLM via LM Studio
- **Authentication**: Custom auth with Convex
- **Calendar**: Google Calendar API
- **UI Components**: Radix UI, Lucide React

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js 18+ installed
- [LM Studio](https://lmstudio.ai/) for running local LLM models
- Google Cloud Console account for Calendar API
- Convex account for backend services

## 🔧 Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd orbital-ai-next
npm install
```

### 2. Environment Variables
Copy the example environment file and configure:
```bash
cp env.example .env.local
```

Fill in the following variables in `.env.local`:

```bash
# Convex Configuration
CONVEX_DEPLOYMENT=your-convex-deployment
NEXT_PUBLIC_CONVEX_URL=your-convex-url

# LLM Configuration
NEXT_PUBLIC_LLM_API_URL=http://localhost:1234
LLM_API_URL=http://127.0.0.1:1234
LLM_MODEL=mistral-7b-instruct-v0.3
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=500

# Google Calendar API
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Setup LM Studio
1. Download and install [LM Studio](https://lmstudio.ai/)
2. Download a compatible model (recommended: Mistral 7B Instruct)
3. Start the local server on port 1234
4. Ensure the API endpoint is accessible at `http://localhost:1234`

### 4. Setup Convex Backend
```bash
npx convex dev
```
This will:
- Create a new Convex project (if needed)
- Deploy the database schema
- Start the development sync

### 5. Setup Google Calendar API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API
4. Create credentials (OAuth 2.0 Client ID)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
6. Copy the Client ID and Client Secret to your `.env.local`

### 6. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📖 Usage Guide

### Getting Started
1. **Sign Up/Sign In**: Create an account or log in
2. **Start Chatting**: Navigate to "Chat with Agent"
3. **Request Study Schedule**: Ask for help creating a study schedule
   - Example: "Create a NEET study schedule for 14 days"
4. **Calendar Integration**: When prompted, connect your Google Calendar
5. **Automatic Scheduling**: The AI will add study sessions to your calendar

### Example Prompts
- "Create a NEET preparation schedule for 2 weeks"
- "I need help planning for JEE Main exam"
- "Generate a study timetable with 8 hours daily"

## 🏗 Project Structure

```
orbital-ai-next/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard and chat interface
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── calendar/          # Calendar-related components
│   ├── dashboard/         # Dashboard components
│   └── ui/                # UI components
├── convex/                # Convex backend
│   ├── schema.ts          # Database schema
│   └── *.ts               # Backend functions
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and integrations
│   └── langchain/         # LLM and calendar integration
└── providers/             # React context providers
```

## 🔌 API Endpoints

- `POST /api/llm` - Direct LLM communication
- `POST /api/llm/stream` - Streaming LLM responses
- `GET /api/auth/google` - Google OAuth URL generation
- `POST /api/calendar/events` - Add events to Google Calendar

## 🧪 Development

### Running Tests
```bash
npm run test:calendar  # Test calendar authentication (if available)
```

### Debug Mode
In development, access the debug chat interface at `/dashboard/chat/debug` for additional debugging tools.

### Code Quality
- ESLint configuration included
- TypeScript for type safety
- Tailwind CSS for styling

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
Make sure to update these for production:
- `NEXT_PUBLIC_APP_URL` - Your production domain
- `GOOGLE_REDIRECT_URI` - Update to production callback URL
- `CONVEX_DEPLOYMENT` - Production Convex deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**LLM Connection Failed**
- Ensure LM Studio is running on port 1234
- Check if the model is loaded and server is started
- Verify `LLM_API_URL` in environment variables

**Google Calendar Not Working**
- Verify Google API credentials
- Check OAuth redirect URI configuration
- Ensure Calendar API is enabled in Google Cloud Console

**Convex Connection Issues**
- Run `npx convex dev` to sync schema
- Check Convex deployment URL
- Verify environment variables

**Build Errors**
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Check TypeScript errors: `npm run build`

## 📞 Support

For questions and support, please [open an issue](https://github.com/your-repo/issues) on GitHub.
