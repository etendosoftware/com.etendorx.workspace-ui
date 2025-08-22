/**
 * jscodeshift transformer to remove data-testid attributes from test files
 *
 * This transformer:
 * 1. Only processes test files (*.test.*, *.spec.*, __tests__ directories)
 * 2. Finds JSX elements with data-testid attributes
 * 3. Removes data-testid attributes that follow our pattern ComponentName__hash
 * 4. Preserves manually added data-testid attributes (those not following the pattern)
 */

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const filePath = file.path || file.pathname || "";

  if (!filePath) return file.source;

  // Only process test files
  const testPatterns = [
    /\.test\.(tsx?|jsx?)$/, // file.test.tsx/jsx/ts/js
    /\.spec\.(tsx?|jsx?)$/, // file.spec.tsx/jsx/ts/js
    /__tests__/, // __tests__ directory
    /\.stories\.(tsx?|jsx?)$/, // storybook files
  ];

  const isTestFile = testPatterns.some((pattern) => pattern.test(filePath));

  if (!isTestFile) {
    return file.source;
  }

  console.log(`Cleaning test file: ${filePath}`);

  let modificationsCount = 0;

  // Find all JSX elements with data-testid attributes
  const elementsWithTestId = root.find(j.JSXOpeningElement).filter((path) => {
    const attrs = path.node.attributes || [];
    return attrs.some((attr) => attr && attr.type === "JSXAttribute" && attr.name && attr.name.name === "data-testid");
  });

  for (const path of elementsWithTestId.paths()) {
    const attrs = path.node.attributes || [];

    // Find and remove data-testid attributes that match our generated pattern
    const filteredAttrs = attrs.filter((attr) => {
      if (attr && attr.type === "JSXAttribute" && attr.name && attr.name.name === "data-testid") {
        // Check if it follows our pattern: ComponentName__hash (6 hex chars)
        if (attr.value && attr.value.type === "Literal" && typeof attr.value.value === "string") {
          const testIdValue = attr.value.value;
          const generatedPattern = /^[A-Z][a-zA-Z0-9]*__[a-f0-9]{6}$/;

          if (generatedPattern.test(testIdValue)) {
            console.log(`  Removing generated data-testid: ${testIdValue}`);
            modificationsCount++;
            return false; // Remove this attribute
          }
          console.log(`  Preserving manual data-testid: ${testIdValue}`);
          return true; // Keep manually added data-testid
        }
      }
      return true; // Keep all other attributes
    });

    path.node.attributes = filteredAttrs;
  }

  if (modificationsCount > 0) {
    console.log(`  Removed ${modificationsCount} generated data-testid attributes`);
  }

  return root.toSource({ quote: "double" });
};
