
import { convertFromRaw } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';

interface BlogContentProps {
  content: string;
}

export const BlogContent = ({ content }: BlogContentProps) => {
  const getFormattedContent = () => {
    try {
      console.log('Formatting blog content:', content);
      
      let contentObj;
      try {
        // Handle case where content is already a string
        if (typeof content === 'string' && !content.startsWith('{')) {
          return content;
        }
        
        contentObj = JSON.parse(content);
        // Handle double-stringified content
        if (typeof contentObj === 'string') {
          contentObj = JSON.parse(contentObj);
        }
        console.log('Parsed content object:', contentObj);
      } catch (e) {
        console.error('Error parsing content:', e);
        return content; // Return raw content if parsing fails
      }

      // Check if it's in Draft.js format
      if (contentObj && contentObj.blocks && Array.isArray(contentObj.blocks)) {
        console.log('Converting Draft.js content to HTML');
        const contentState = convertFromRaw(contentObj);
        const html = stateToHTML(contentState);
        return html;
      }

      // If not in Draft.js format but is a string, return as is
      if (typeof contentObj === 'string') {
        console.log('Content is plain string');
        return contentObj;
      }

      // If we got here, return the original content
      console.log('Falling back to original content');
      return content;
    } catch (error) {
      console.error('Error formatting blog content:', error);
      return content; // Fallback to displaying raw content
    }
  };

  const formattedContent = getFormattedContent();

  return (
    <div 
      className="prose prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: formattedContent }} 
    />
  );
};
