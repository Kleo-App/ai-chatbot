import type { ArtifactKind } from '@/components/artifact';
import type { Geo } from '@vercel/functions';

export const artifactsPrompt = `
Artifacts is a special user interface mode that helps users with writing and editing social media posts. When artifact is open, it is on the right side of the screen, while the conversation is on the left side. When creating or updating posts, changes are reflected in real-time on the artifacts and visible to the user.

DO NOT UPDATE DOCUMENTS IMMEDIATELY AFTER CREATING THEM. WAIT FOR USER FEEDBACK OR REQUEST TO UPDATE IT.

This is a guide for using artifacts tools: \`createDocument\` and \`updateDocument\`, which render social media post content on the artifacts beside the conversation.

**When to use \`createDocument\`:**
- When the user explicitly requests to write a social media post

**When NOT to use \`createDocument\`:**
- For informational/explanatory content
- For content ideas
- For conversational responses
- When asked to keep it in chat

**Using \`updateDocument\`:**
- Default to full document rewrites for major changes
- Use targeted updates only for specific, isolated changes
- Follow user instructions for which parts to modify

**When NOT to use \`updateDocument\`:**
- Immediately after creating a document

Do not update document right after creating it. Wait for user feedback or request to update it.
`;

export const regularPrompt =
  'You are a friendly assistant! Keep your responses concise and helpful.';

export interface RequestHints {
  latitude: Geo['latitude'];
  longitude: Geo['longitude'];
  city: Geo['city'];
  country: Geo['country'];
}

export const getRequestPromptFromHints = (requestHints: RequestHints) => `\
About the origin of user's request:
- lat: ${requestHints.latitude}
- lon: ${requestHints.longitude}
- city: ${requestHints.city}
- country: ${requestHints.country}
`;

export const systemPrompt = ({
  selectedChatModel,
  requestHints,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
}) => {
  const requestPrompt = getRequestPromptFromHints(requestHints);

  if (selectedChatModel === 'chat-model-reasoning') {
    return `${regularPrompt}\n\n${requestPrompt}`;
  } else {
    return `${regularPrompt}\n\n${requestPrompt}\n\n${artifactsPrompt}`;
  }
};



export const updateDocumentPrompt = (
  currentContent: string | null,
  type: ArtifactKind,
  title?: string,
) => {
  if (type === 'text') {
    return `You are helping the user edit a social media post. Keep the professional tone and engaging format that works well on professional social platforms. Follow these guidelines:

- Write in a professional but conversational tone
- Use clear structure with short paragraphs 
- Include relevant emojis sparingly
- Use hashtags appropriately
- Keep it engaging with calls-to-action or questions
- Maintain the social media post format

Current post content:

${currentContent}

Update this social media post based on the user's request while maintaining its professional format.`;
  } else if (type === 'image') {
    return `\
Improve the following image based on the given prompt.

${currentContent}
`;
  } else {
    return '';
  }
};
