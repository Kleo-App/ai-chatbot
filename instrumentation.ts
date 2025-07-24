import { registerOTel } from '@vercel/otel';
import { LangfuseExporter } from 'langfuse-vercel';

export function register() {
  // Check if Langfuse credentials are available
  const hasLangfuseCredentials = process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY;
  
  if (!hasLangfuseCredentials) {
    console.warn('Langfuse credentials not found. OpenTelemetry tracing will be disabled. Set LANGFUSE_SECRET_KEY and LANGFUSE_PUBLIC_KEY to enable Langfuse integration.');
    
    // Register OTel without Langfuse exporter
    registerOTel({
      serviceName: 'ai-chatbot',
    });
    return;
  }

  try {
    registerOTel({
      serviceName: 'ai-chatbot',
      traceExporter: new LangfuseExporter({
        //debug: process.env.NODE_ENV === 'development',
      }),
    });
    console.log('OpenTelemetry with Langfuse integration registered successfully');
  } catch (error) {
    console.error('Failed to register OpenTelemetry with Langfuse:', error);
    // Fallback to basic OTel without Langfuse
    registerOTel({
      serviceName: 'ai-chatbot',
    });
  }
}
