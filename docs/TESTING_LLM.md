# LLM Testing Guide

This guide explains how to properly set up and test the LangChain agent with LLM services.

## Configuration Options

You have two options for configuring the LLM backend:

### 1. Using OpenAI API

1. Sign up for an [OpenAI API key](https://platform.openai.com/signup)
2. Create a `.env.local` file in the project root 
3. Add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   LLM_MODEL=gpt-3.5-turbo
   LLM_TEMPERATURE=0.7
   ```

### 2. Using Local LM Studio

If you prefer to use a local LLM service like LM Studio:

1. Download and install [LM Studio](https://lmstudio.ai/)
2. Launch LM Studio and set up a local server with a model of your choice
3. Create a `.env.local` file in the project root with:
   ```
   LLM_API_URL=http://localhost:1234/v1
   LLM_MODEL=mistral-7b-instruct-v0.3:2
   LLM_TEMPERATURE=0.7
   ```

## Testing the LLM Integration

To verify your LLM is working correctly:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. In the chat interface, try sending a message that should trigger the LangChain agent, such as:
   - "Help me create a study schedule for NEET exam"
   - "I need a study plan for the next 30 days"

3. If you see intelligent responses that handle your scheduling request, the LLM is working correctly.

## Troubleshooting

If you encounter errors:

1. **Authentication Errors**: 
   - Double-check your API key in `.env.local`
   - For OpenAI, ensure your account has billing set up
   - For LM Studio, make sure the local server is running

2. **Model Errors**:
   - Ensure you're using a model name that is supported by your chosen service
   - For local models, make sure the model is fully loaded in LM Studio

3. **Browser Console Errors**:
   - Open browser developer tools to check for detailed error messages
   - Look for HTTP errors (401, 403) which indicate authentication issues

## Need More Help?

If issues persist:

1. Check the LangChain documentation for your specific model
2. Verify network connectivity to the API endpoint
3. Try a different model to see if the issue is model-specific
