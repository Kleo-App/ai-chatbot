import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { linkedinConnection } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { storePostAnalytics } from '@/app/actions/post-actions';

// Database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client, { schema: { linkedinConnection } });

// Helper function to convert HTML to plain text for LinkedIn
function htmlToPlainText(html: string): string {
  // Handle TipTap editor format which uses <p><br class="ProseMirror-trailingBreak"></p> for intentional breaks
  let text = html
    // First, identify paragraphs with trailing breaks (intentional double line breaks)
    .replace(/<p[^>]*>\s*<br[^>]*>\s*<\/p>/gi, '___DOUBLE_BREAK___')
    // Convert regular paragraph boundaries to single line breaks
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
    // Remove all remaining paragraph and br tags
    .replace(/<\/?p[^>]*>/gi, '')
    .replace(/<br[^>]*>/gi, '\n')
    // Convert div tags to line breaks
    .replace(/<\/div>\s*<div[^>]*>/gi, '\n')
    .replace(/<\/?div[^>]*>/gi, '')
    // Remove all other HTML tags
    .replace(/<[^>]*>/g, '')
    // Convert double break markers to actual double line breaks
    .replace(/___DOUBLE_BREAK___/g, '\n\n')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up: remove leading/trailing whitespace from each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Remove any leading/trailing empty lines
    .replace(/^\n+|\n+$/g, '')
    // Clean up excessive line breaks (more than 2 consecutive)
    .replace(/\n{3,}/g, '\n\n');

  return text;
}

// Helper function to upload images to LinkedIn
async function uploadImageToLinkedIn(imageUrl: string, accessToken: string, linkedinId: string) {
  try {
    // Download the image from our storage
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image');
    }
    const imageBuffer = await imageResponse.arrayBuffer();

    // Register upload with LinkedIn
    const registerResponse = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: `urn:li:person:${linkedinId}`,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent'
            }
          ]
        }
      })
    });

    if (!registerResponse.ok) {
      throw new Error('Failed to register image upload');
    }

    const registerData = await registerResponse.json();
    const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const assetId = registerData.value.asset;

    // Upload the image
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: imageBuffer
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload image');
    }

    return assetId;
  } catch (error) {
    console.error('Error uploading image to LinkedIn:', error);
    throw error;
  }
}

// Helper function to upload videos to LinkedIn
async function uploadVideoToLinkedIn(videoUrl: string, accessToken: string, linkedinId: string) {
  try {
    // Download the video from our storage
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error('Failed to fetch video');
    }
    const videoBuffer = await videoResponse.arrayBuffer();

    // Register upload with LinkedIn
    const registerResponse = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
          owner: `urn:li:person:${linkedinId}`,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent'
            }
          ]
        }
      })
    });

    if (!registerResponse.ok) {
      throw new Error('Failed to register video upload');
    }

    const registerData = await registerResponse.json();
    const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const assetId = registerData.value.asset;

    // Upload the video (note: no auth header for video upload)
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: videoBuffer
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload video');
    }

    return assetId;
  } catch (error) {
    console.error('Error uploading video to LinkedIn:', error);
    throw error;
  }
}

// Helper function to upload documents to LinkedIn using Documents API
async function uploadDocumentToLinkedIn(documentUrl: string, accessToken: string, linkedinId: string) {
  try {
    // Step 1: Initialize document upload
    const initializeResponse = await fetch('https://api.linkedin.com/rest/documents?action=initializeUpload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202507',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: `urn:li:person:${linkedinId}`
        }
      })
    });

    if (!initializeResponse.ok) {
      const errorText = await initializeResponse.text();
      console.error('Failed to initialize document upload:', {
        status: initializeResponse.status,
        statusText: initializeResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to initialize document upload: ${initializeResponse.status} ${errorText}`);
    }

    const initializeData = await initializeResponse.json();
    const documentUrn = initializeData.value.document;
    const uploadUrl = initializeData.value.uploadUrl;

    // Step 2: Download the document from our storage
    const documentResponse = await fetch(documentUrl);
    if (!documentResponse.ok) {
      throw new Error('Failed to fetch document');
    }
    const documentBuffer = await documentResponse.arrayBuffer();

    // Step 3: Upload the document to LinkedIn
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: documentBuffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Failed to upload document:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to upload document: ${uploadResponse.status} ${errorText}`);
    }

    return documentUrn;
  } catch (error) {
    console.error('Error uploading document to LinkedIn:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { content, images, videos, documents } = await request.json();
    
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get LinkedIn connection for the user
    const connection = await db
      .select()
      .from(linkedinConnection)
      .where(eq(linkedinConnection.userId, userId))
      .limit(1);

    if (connection.length === 0) {
      return NextResponse.json(
        { error: 'LinkedIn not connected' },
        { status: 400 }
      );
    }

    const linkedinConn = connection[0];

    // Check if token needs refresh
    const now = new Date();
    if (linkedinConn.expiresAt && linkedinConn.expiresAt <= now) {
      // Token expired, try to refresh
      if (linkedinConn.refreshToken) {
        const refreshed = await refreshLinkedInToken(linkedinConn.refreshToken);
        if (!refreshed) {
          return NextResponse.json(
            { error: 'LinkedIn connection expired. Please reconnect.' },
            { status: 401 }
          );
        }
        // Update the connection with new token
        await db
          .update(linkedinConnection)
          .set({
            accessToken: refreshed.access_token,
            expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
            updatedAt: new Date(),
          })
          .where(eq(linkedinConnection.userId, userId));
        linkedinConn.accessToken = refreshed.access_token;
      } else {
        return NextResponse.json(
          { error: 'LinkedIn connection expired. Please reconnect.' },
          { status: 401 }
        );
      }
    }

    // Upload media assets to LinkedIn if any
    const uploadedAssets = [];
    let shareMediaCategory = 'NONE';

    // Handle documents (carousel posts) - use Posts API for document carousels
    if (documents && documents.length > 0) {
      try {
        // Upload document and get document URN
        const firstDocument = documents[0];
        const documentUrl = typeof firstDocument === 'string' ? firstDocument : firstDocument.url;
        const documentName = typeof firstDocument === 'string' ? 'Document' : firstDocument.name;
        const documentUrn = await uploadDocumentToLinkedIn(documentUrl, linkedinConn.accessToken, linkedinConn.linkedinId);
        
        // Use Posts API for document carousel
        const postsResponse = await fetch('https://api.linkedin.com/rest/posts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${linkedinConn.accessToken}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': '202507',
            'X-Restli-Protocol-Version': '2.0.0',
          },
          body: JSON.stringify({
            author: `urn:li:person:${linkedinConn.linkedinId}`,
            commentary: htmlToPlainText(content),
            visibility: 'PUBLIC',
            distribution: {
              feedDistribution: 'MAIN_FEED',
              targetEntities: [],
              thirdPartyDistributionChannels: []
            },
            content: {
              media: {
                title: documentName,
                id: documentUrn
              }
            },
            lifecycleState: 'PUBLISHED',
            isReshareDisabledByAuthor: false
          })
        });

        if (!postsResponse.ok) {
          const errorText = await postsResponse.text();
          console.error('Failed to create document post:', errorText);
          throw new Error('Failed to create document post');
        }

        // Store analytics for document post
        await storePostAnalytics(content);

        return NextResponse.json({ 
          success: true, 
          message: 'Document carousel posted successfully!' 
        });

      } catch (error) {
        console.error('Document carousel creation failed:', error);
        return NextResponse.json(
          { error: 'Failed to create document carousel' },
          { status: 500 }
        );
      }
    }

    // Determine media category priority: videos > images (documents handled above)
    // LinkedIn supports only one type of media per post
    if (videos && videos.length > 0) {
      shareMediaCategory = 'VIDEO';
      for (const videoUrl of videos) {
        try {
          const assetId = await uploadVideoToLinkedIn(videoUrl, linkedinConn.accessToken, linkedinConn.linkedinId);
          uploadedAssets.push({
            status: 'READY',
            media: assetId
          });
        } catch (error) {
          console.error('Failed to upload video:', error);
          // Continue with other assets
        }
      }
    } else if (images && images.length > 0) {
      shareMediaCategory = 'IMAGE';
      for (const imageUrl of images) {
        try {
          const assetId = await uploadImageToLinkedIn(imageUrl, linkedinConn.accessToken, linkedinConn.linkedinId);
          uploadedAssets.push({
            status: 'READY',
            media: assetId
          });
        } catch (error) {
          console.error('Failed to upload image:', error);
          // Continue with other assets
        }
      }
    }

    // Build the post content based on media type
    const postContent: any = {
      author: `urn:li:person:${linkedinConn.linkedinId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: htmlToPlainText(content),
          },
          shareMediaCategory: shareMediaCategory,
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    // Add media if we have any uploaded assets
    if (uploadedAssets.length > 0) {
      postContent.specificContent['com.linkedin.ugc.ShareContent'].media = uploadedAssets;
    }

    // Publish to LinkedIn
    const publishResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${linkedinConn.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postContent),
    });

    if (!publishResponse.ok) {
      const errorData = await publishResponse.text();
      console.error('LinkedIn API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to publish to LinkedIn' },
        { status: 500 }
      );
    }

    const result = await publishResponse.json();
    return NextResponse.json({ success: true, postId: result.id });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function refreshLinkedInToken(refreshToken: string) {
  try {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
} 