/**
 * jscodeshift transformer to add data-testid attributes to React components
 * Generates data-testid using pattern: ComponentName__fileHash
 *
 * This transformer:
 * 1. Finds JSX opening elements with uppercase initial letter (React components)
 * 2. Skips if element already has data-testid
 * 3. Generates hash from filename for uniqueness
 * 4. Adds data-testid="ComponentName__hash" attribute
 *
 * Usage: Run with dry-run first, then apply changes
 */

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const filePath = file.path || file.pathname || "";

  if (!filePath) return file.source;

  // If file contains the special marker, skip processing. Use this to protect strategic files.
  // Add the following comment to a file to prevent codemod changes:
  //   // @data-testid-ignore
  if (/@data-testid-ignore\b/i.test(file.source)) {
    console.log(`Skipping by marker: ${filePath}`);
    return file.source;
  }

  // Skip files in excluded directories to prevent recursive processing
  const excludedPaths = [
    "node_modules",
    "dist",
    "build",
    ".next",
    "coverage",
    ".git",
    ".storybook-static",
    "storybook-static",
    "__generated__",
  ];

  const shouldSkipDirectory = excludedPaths.some(
    (excluded) => filePath.includes(`/${excluded}/`) || filePath.includes(`\\${excluded}\\`)
  );

  // Skip test files based on common naming patterns
  const testPatterns = [
    /\.test\.(tsx?|jsx?)$/, // file.test.tsx/jsx/ts/js
    /\.spec\.(tsx?|jsx?)$/, // file.spec.tsx/jsx/ts/js
    /__tests__/, // __tests__ directory
    /\.stories\.(tsx?|jsx?)$/, // storybook files
    /\.mock\.(tsx?|jsx?)$/, // mock files
  ];

  const isTestFile = testPatterns.some((pattern) => pattern.test(filePath));

  if (shouldSkipDirectory || isTestFile) {
    console.log(`Skipping ${isTestFile ? "test file" : "excluded path"}: ${filePath}`);
    return file.source;
  }

  // simple deterministic hash from the file path
  function fileHash(s) {
    // djb2
    let hash = 5381;
    for (let i = 0; i < s.length; i++) {
      hash = (hash * 33) ^ s.charCodeAt(i);
    }
    // convert to positive hex, take 6 chars
    return (hash >>> 0).toString(16).slice(0, 6);
  }

  const hash = fileHash(filePath);

  const elementsToUpdate = root.find(j.JSXOpeningElement).filter((path) => {
    const nameNode = path.node.name;
    // Only JSXIdentifier (not member expressions like Foo.Bar) and starts with uppercase
    return nameNode && nameNode.type === "JSXIdentifier" && /^[A-Z]/.test(nameNode.name);
  });
  function hasFieldInScope(path) {
    // Traverse ancestors and inspect function params and variable declarations
    let cur = path.parentPath;
    while (cur) {
      const node = cur.node;
      if (
        node.type === "FunctionDeclaration" ||
        node.type === "FunctionExpression" ||
        node.type === "ArrowFunctionExpression"
      ) {
        const params = node.params || [];
        for (const p of params) {
          if (!p) continue;
          // direct identifier: function fn(field) {}
          if (p.type === "Identifier" && p.name === "field") return true;
          // destructuring: function fn({ field }) {}
          if (p.type === "ObjectPattern" && Array.isArray(p.properties)) {
            for (const prop of p.properties) {
              if (prop && prop.key && prop.key.name === "field") return true;
            }
          }
        }
      }

      // variable declarator: const { field } = props; or const field = ...;
      if (node.type === "VariableDeclarator") {
        const id = node.id;
        if (!id) {
          cur = cur.parentPath;
          continue;
        }
        if (id.type === "Identifier" && id.name === "field") return true;
        if (id.type === "ObjectPattern" && Array.isArray(id.properties)) {
          for (const prop of id.properties) {
            if (prop && prop.key && prop.key.name === "field") return true;
          }
        }
      }

      cur = cur.parentPath;
    }
    return false;
  }

  for (const path of elementsToUpdate.paths()) {
    const attrs = path.node.attributes || [];
    const hasTestId = attrs.some((a) => a && a.type === "JSXAttribute" && a.name && a.name.name === "data-testid");
    if (hasTestId) continue;

    const compName = path.node.name.name;

    // If a `field` variable is in ancestor scope, prefer `field.id` token
    if (hasFieldInScope(path)) {
      // Create expression: {"ComponentName__" + field.id}
      const expr = j.binaryExpression(
        "+",
        j.literal(`${compName}__`),
        j.memberExpression(j.identifier("field"), j.identifier("id"))
      );
      attrs.push(j.jsxAttribute(j.jsxIdentifier("data-testid"), j.jsxExpressionContainer(expr)));
    } else {
      // fallback: ComponentName__fileHash
      const testIdValue = `${compName}__${hash}`;
      attrs.push(j.jsxAttribute(j.jsxIdentifier("data-testid"), j.literal(testIdValue)));
    }

    path.node.attributes = attrs;
  }

  // Attempt to preserve original whitespace/formatting where possible.
  return root.toSource({ quote: "double", reuseWhitespace: true });
};
