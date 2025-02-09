
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { convertToRaw } from 'draft-js';

export function useTranslation() {
  const { toast } = useToast();

  const translateContent = async (title: string, content: string) => {
    try {
      console.log('Starting translation with:', { title, content });
      let contentObj;
      
      try {
        contentObj = JSON.parse(content);
        // Handle double-stringified content
        if (typeof contentObj === 'string') {
          contentObj = JSON.parse(contentObj);
        }
      } catch (e) {
        console.error('Error parsing content in translation:', e);
        contentObj = { blocks: [{ text: content }] };
      }
      
      // Extract text from Draft.js content
      const textContent = contentObj.blocks
        .map((block: any) => block.text)
        .filter((text: string) => text.trim())
        .join('\n');

      console.log('Extracted text content for translation:', textContent);

      // First translate the title
      console.log('Translating title:', title);
      const titleResponse = await supabase.functions.invoke('translate', {
        body: { text: title }
      });

      console.log('Title translation response:', titleResponse);
      if (titleResponse.error) throw new Error(titleResponse.error.message);
      
      // Then translate the content
      console.log('Translating content:', textContent);
      const contentResponse = await supabase.functions.invoke('translate', {
        body: { text: textContent }
      });

      console.log('Content translation response:', contentResponse);
      if (contentResponse.error) throw new Error(contentResponse.error.message);

      const translatedTitle = titleResponse.data.data.translations[0].translatedText;
      const translatedText = contentResponse.data.data.translations[0].translatedText;
      
      console.log('Translation results:', { translatedTitle, translatedText });

      // Create Draft.js content structure
      const newContent = {
        blocks: translatedText.split('\n').map((text: string, index: number) => ({
          key: `translated-${index}`,
          text: text.trim(),
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        })).filter((block: any) => block.text.length > 0),
        entityMap: {}
      };

      // Ensure we're returning a properly stringified Draft.js content
      const stringifiedContent = JSON.stringify(newContent);
      console.log('Final translated content structure:', stringifiedContent);

      toast({
        title: "Translation Complete",
        description: "Content has been translated to Tamil",
      });

      return {
        translatedTitle,
        translatedContent: stringifiedContent
      };
    } catch (error: any) {
      console.error('Translation error:', error);
      toast({
        variant: "destructive",
        title: "Translation Failed",
        description: error.message,
      });
      throw error;
    }
  };

  return { translateContent };
}
