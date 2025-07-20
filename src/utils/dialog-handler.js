// Helper method to detect and handle posting dialogs
async function handlePostingDialogs(page, logger) {
  try {
    // Wait a moment for any dialogs to appear
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for various types of dialogs that might appear
    const dialogSelectors = [
      '[role="dialog"]',
      '.modal',
      '[data-testid*="modal"]',
      '[data-testid*="dialog"]',
      '.react-modal',
      '[aria-modal="true"]'
    ];
    
    let dialog = null;
    for (const selector of dialogSelectors) {
      try {
        dialog = await page.$(selector);
        if (dialog) {
          const isVisible = await dialog.isIntersectingViewport();
          if (isVisible) {
            logger.debug(`Found dialog with selector: ${selector}`);
            break;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (dialog) {
      // Check what type of dialog this is
      const dialogText = await dialog.evaluate(el => el.textContent?.toLowerCase() || '');
      
      if (dialogText.includes('schedule') || dialogText.includes('time') || dialogText.includes('date')) {
        logger.info('Scheduling dialog detected');
        
        // Look for immediate posting options
        const immediateOptions = [
          'button:has-text("Post now")',
          'button:has-text("Post immediately")',
          '[role="button"]:has-text("Post now")',
          '[role="button"]:has-text("Skip")',
          'button:has-text("Cancel")'
        ];
        
        for (const selector of immediateOptions) {
          try {
            const button = await page.$(selector);
            if (button) {
              const isVisible = await button.isIntersectingViewport();
              if (isVisible) {
                logger.info(`Clicking ${selector} to avoid scheduling`);
                await button.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                return 'immediate_post';
              }
            }
          } catch (e) {
            // Continue
          }
        }
        
        return 'scheduling_dialog';
      }
      
      if (dialogText.includes('draft') || dialogText.includes('save')) {
        logger.info('Draft dialog detected');
        
        // Look for publish options
        const publishOptions = [
          'button:has-text("Post")',
          'button:has-text("Publish")',
          '[role="button"]:has-text("Post")',
          '[role="button"]:has-text("Publish")'
        ];
        
        for (const selector of publishOptions) {
          try {
            const button = await page.$(selector);
            if (button) {
              const isVisible = await button.isIntersectingViewport();
              if (isVisible) {
                logger.info(`Clicking ${selector} to publish draft`);
                await button.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                return 'published_from_draft';
              }
            }
          } catch (e) {
            // Continue
          }
        }
        
        return 'draft_dialog';
      }
    }
    
    return 'no_dialog';
    
  } catch (error) {
    logger.debug('Error handling dialogs:', error.message);
    return 'error';
  }
}

module.exports = { handlePostingDialogs };
