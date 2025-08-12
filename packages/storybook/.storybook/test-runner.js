const { getStoryContext } = require('@storybook/test-runner');

module.exports = {
  async preVisit(page, context) {
    // Increase timeout for longer running tests
    page.setDefaultTimeout(60000); // Increased from 30000
    
    // Add error handling for navigation errors
    page.on('pageerror', (error) => {
      console.log('Page error:', error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
      // Log ProfileModal specific messages
      if (msg.text().includes('ProfileModal') || msg.text().includes('Router')) {
        console.log('ProfileModal/Router log:', msg.text());
      }
    });
  },
  
  async postVisit(page, context) {
    const storyContext = await getStoryContext(page, context);
    
    // Check multiple ways to skip stories
    const shouldSkip = 
      storyContext.parameters?.testRunner?.skip ||
      storyContext.parameters?.test?.skip ||
      storyContext.tags?.includes('skip-test');
    
    if (shouldSkip) {
      console.log('Skipping story:', storyContext.name, 'due to skip configuration');
      return; // Early return to skip processing
    }
    
  }
};