/**
 * Utility function to delete a message from the database
 */
export async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/message?id=${messageId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      console.error('Failed to delete message:', await response.text());
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
}
