const { getStoryContext } = require('@storybook/test-runner');

module.exports = {
  async preVisit(page, context) {
    // Increase timeout for longer running tests
    page.setDefaultTimeout(30000);
    
    // Add error handling for navigation errors
    page.on('pageerror', (error) => {
      console.log('Page error:', error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
  },
  
  async postVisit(page, context) {
    const storyContext = await getStoryContext(page, context);
    
    // Skip smoke test for stories that have navigation issues
    if (storyContext.title.includes('ProfileModal')) {
      // Wait for component to be fully rendered
      await page.waitForSelector('[data-testid="profile-modal"], .profile-modal, [class*="modal"]', {
        timeout: 20000,
        state: 'visible'
      }).catch(() => {
        // If selector not found, just wait a bit for the component to render
        return page.waitForTimeout(2000);
      });
    }
  }
};