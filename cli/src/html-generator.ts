import { Spec, DatabaseFunction } from "./types";

// Helper function to get database operation type and color
function getDatabaseOperation(
  opId: string,
  touches?: { read?: string[]; write?: string[] }
): { type: string; color: string } {
  const lowerOpId = opId.toLowerCase();

  // Determine primary operation type based on function name
  if (
    lowerOpId.includes("create") ||
    lowerOpId.includes("add") ||
    lowerOpId.includes("insert")
  ) {
    return { type: "CREATE", color: "post" };
  }
  if (
    lowerOpId.includes("update") ||
    lowerOpId.includes("edit") ||
    lowerOpId.includes("modify")
  ) {
    return { type: "UPDATE", color: "put" };
  }
  if (
    lowerOpId.includes("delete") ||
    lowerOpId.includes("remove") ||
    lowerOpId.includes("drop")
  ) {
    return { type: "DELETE", color: "delete" };
  }
  if (
    lowerOpId.includes("get") ||
    lowerOpId.includes("find") ||
    lowerOpId.includes("search") ||
    lowerOpId.includes("list")
  ) {
    return { type: "READ", color: "get" };
  }

  // If we have touches info, use that to determine operation
  if (touches) {
    const hasRead = touches.read && touches.read.length > 0;
    const hasWrite = touches.write && touches.write.length > 0;

    if (hasWrite && hasRead) {
      return { type: "READ/WRITE", color: "post" };
    } else if (hasWrite) {
      return { type: "WRITE", color: "post" };
    } else if (hasRead) {
      return { type: "READ", color: "get" };
    }
  }

  // Default fallback
  return { type: "READ", color: "get" };
}

export class HTMLGenerator {
  /**
   * Generate HTML documentation from spec
   */
  generateHTML(spec: Spec): string {
    const { functions } = spec;
    const title = spec.info.title;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Database Functions Documentation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #fafafa;
            color: #333;
            line-height: 1.6;
        }

        .swagger-ui {
            max-width: 100%;
            margin: 0;
            padding: 0;
        }

        .topbar {
            background-color: #1b1b1b;
            padding: 8px 0;
            display: none;
        }

        .information-container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
            margin-bottom: 30px;
        }

        .info {
            max-width: 800px;
            margin: 0 auto;
        }

        .info h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 300;
        }

        .info p {
            font-size: 1.2em;
            opacity: 0.9;
        }

        .search-container {
            max-width: 800px;
            margin: 0 auto 30px;
            padding: 0 20px;
        }

        .search-input {
            width: 100%;
            padding: 12px 20px;
            font-size: 16px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            outline: none;
            transition: border-color 0.3s;
        }

        .search-input:focus {
            border-color: #667eea;
        }


        .operations {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
        }

        .opblock {
            background: white;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .opblock:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .opblock-summary {
            padding: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #e0e0e0;
        }

        .opblock-summary:hover {
            background-color: #f8f9fa;
        }

        .opblock-summary-method {
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
            margin-right: 15px;
        }

        /* Database operation colors */
        .opblock-summary-method.get {
            background: #61affe;
        }

        .opblock-summary-method.post {
            background: #49cc90;
        }

        .opblock-summary-method.put {
            background: #fca130;
        }

        .opblock-summary-method.delete {
            background: #f93e3e;
        }

        .opblock-summary-path {
            flex: 1;
            font-weight: 600;
            color: #333;
        }

        .opblock-summary-description {
            color: #666;
            font-size: 14px;
        }

        .opblock-body {
            padding: 0 20px;
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        }

        .opblock.is-open .opblock-body {
            max-height: 2000px;
            padding: 20px;
        }

        .opblock-tag {
            margin-bottom: 20px;
        }

        .opblock-tag small {
            background: #667eea;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }

        .database-operations {
            margin: 20px 0;
        }

        .database-operations h4 {
            color: #333;
            margin-bottom: 10px;
            font-size: 16px;
        }

        .operation-section {
            margin-bottom: 15px;
        }

        .operation-section h5 {
            color: #666;
            font-size: 14px;
            margin-bottom: 5px;
        }

        .operation-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .operation-item {
            background: #f0f0f0;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            color: #555;
        }

        .read-operation {
            background: #e8f5e8;
            color: #2d5a2d;
        }

        .write-operation {
            background: #ffe8e8;
            color: #5a2d2d;
        }

        .parameters {
            margin: 20px 0;
        }

        .parameters h4 {
            color: #333;
            margin-bottom: 15px;
        }

        .parameters-container {
            background: #f8f9fa;
            border-radius: 6px;
            padding: 15px;
        }

        .parameter {
            margin-bottom: 15px;
        }

        .parameter-name {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }

        .parameter-description {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
        }

        .model-container {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            padding: 10px;
        }

        .model-box {
            background: #f8f9fa;
            border-radius: 4px;
            padding: 10px;
        }

        .model {
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 12px;
            color: #333;
            white-space: pre-wrap;
        }

        .examples {
            margin: 20px 0;
            border-top: 1px solid #e0e0e0;
            padding-top: 20px;
        }

        .examples h4 {
            color: #333;
            margin-bottom: 15px;
        }

        .example-section {
            margin-bottom: 20px;
        }

        .example-title {
            font-weight: 600;
            color: #555;
            margin-bottom: 8px;
            font-size: 14px;
        }

        .example-code {
            background: #f8f9fa;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 15px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
            overflow-x: auto;
        }

        .json-schema {
            background: #f8f9fa;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 15px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
            overflow-x: auto;
        }

        .json-key {
            color: #d73a49;
            font-weight: 600;
        }

        .json-string {
            color: #032f62;
        }

        .json-number {
            color: #005cc5;
        }

        .json-boolean {
            color: #e36209;
        }

        .json-null {
            color: #6f42c1;
        }

        .json-bracket {
            color: #24292e;
            font-weight: bold;
        }

        .json-comma {
            color: #586069;
        }

        .json-colon {
            color: #586069;
        }

        /* Code syntax highlighting */
        .code-keyword {
            color: #d73a49;
            font-weight: 600;
        }

        .code-string {
            color: #032f62;
        }

        .code-number {
            color: #005cc5;
        }

        .code-comment {
            color: #6a737d;
            font-style: italic;
        }

        .code-function {
            color: #6f42c1;
            font-weight: 600;
        }

        .code-variable {
            color: #e36209;
        }

        .code-operator {
            color: #d73a49;
        }

        .code-bracket {
            color: #24292e;
            font-weight: bold;
        }

        @media (max-width: 768px) {
            .operations {
                padding: 0 10px;
            }
            
            .opblock-summary {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            
            .opblock-summary-method {
                margin-right: 0;
            }
        }
    </style>
</head>
<body>
    <div class="swagger-ui">
        <div class="topbar"></div>
        
        <div class="information-container">
            <div class="info">
                <h1>${title}</h1>
                <p>Database Functions Documentation</p>
            </div>
        </div>
        
        <div class="search-container">
            <input type="text" class="search-input" placeholder="Search functions..." id="searchInput">
        </div>
        
        
        <div class="operations">
            ${functions.map((func) => this.generateFunctionHTML(func)).join("")}
        </div>
    </div>

    <script>
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const opblocks = document.querySelectorAll('.opblock');
            
            opblocks.forEach(opblock => {
                const summary = opblock.querySelector('.opblock-summary-path').textContent.toLowerCase();
                const description = opblock.querySelector('.opblock-summary-description').textContent.toLowerCase();
                
                if (summary.includes(searchTerm) || description.includes(searchTerm)) {
                    opblock.style.display = 'block';
                } else {
                    opblock.style.display = 'none';
                }
            });
        });

        // Toggle functionality
        function toggleOpblock(element) {
            const opblock = element.closest('.opblock');
            opblock.classList.toggle('is-open');
        }

        // Color code JSON function
        function colorCodeJson(jsonString) {
            let result = jsonString;
            
            // Handle strings (both keys and values)
            result = result.replace(/"([^"\\\\]|\\\\.)*"/g, function(match) {
                // Check if it's a key (followed by colon)
                if (result.indexOf(match + ':') !== -1) {
                    return '<span class="json-key">' + match + '</span>';
                }
                return '<span class="json-string">' + match + '</span>';
            });
            
            // Handle numbers
            result = result.replace(/:\s*(\\d+(?:\\.\\d+)?)/g, ': <span class="json-number">$1</span>');
            
            // Handle booleans
            result = result.replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>');
            
            // Handle null
            result = result.replace(/:\s*null/g, ': <span class="json-null">null</span>');
            
            // Handle brackets and braces
            result = result.replace(/[{}[\\]]/g, '<span class="json-bracket">$&</span>');
            
            // Handle colons
            result = result.replace(/:/g, '<span class="json-colon">:</span>');
            
            // Handle commas
            result = result.replace(/,/g, '<span class="json-comma">,</span>');
            
            return result;
        }

        // Color code JavaScript/TypeScript code function
        function colorCodeCode(codeString) {
            let result = codeString;
            
            // Handle comments
            result = result.replace(/(\\/\\/.*$)/gm, '<span class="code-comment">$1</span>');
            
            // Handle strings
            result = result.replace(/"([^"\\\\]|\\\\.)*"/g, '<span class="code-string">$&</span>');
            result = result.replace(/'([^'\\\\]|\\\\.)*'/g, '<span class="code-string">$&</span>');
            
            // Handle numbers
            result = result.replace(/\\b(\\d+(?:\\.\\d+)?)\\b/g, '<span class="code-number">$1</span>');
            
            // Handle keywords
            const keywords = ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'try', 'catch', 'throw', 'new', 'this', 'class', 'extends', 'import', 'export', 'from', 'default'];
            keywords.forEach(function(keyword) {
                const regex = new RegExp('\\\\b' + keyword + '\\\\b', 'g');
                result = result.replace(regex, '<span class="code-keyword">' + keyword + '</span>');
            });
            
            // Handle function calls
            result = result.replace(/\\b([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*\\(/g, '<span class="code-function">$1</span>(');
            
            // Handle operators
            result = result.replace(/([{}[\\](),;])/g, '<span class="code-bracket">$1</span>');
            result = result.replace(/([=+\\-*/<>!&|])/g, '<span class="code-operator">$1</span>');
            
            return result;
        }
        
        // Auto-expand first function
        const firstOpblock = document.querySelector('.opblock');
        if (firstOpblock) {
            firstOpblock.classList.add('is-open');
        }
    </script>
</body>
</html>`;
  }

  /**
   * Generate HTML for a single function
   */
  private generateFunctionHTML(func: DatabaseFunction): string {
    return `
    <div class="opblock opblock-${
      getDatabaseOperation(func.opId, func.touches).color
    }" data-function-id="${func.opId}-${func.engine}">
        <div class="opblock-summary" onclick="toggleOpblock(this)">
            <span class="opblock-summary-method ${
              getDatabaseOperation(func.opId, func.touches).color
            }">${getDatabaseOperation(func.opId, func.touches).type}</span>
            <span class="opblock-summary-path">${func.opId}</span>
            <span class="opblock-summary-description">${func.summary}</span>
        </div>
        
        <div class="opblock-body">
            <div class="opblock-tag">
                <small>${func.engine.toUpperCase()}</small>
            </div>
            
            <p>${func.description}</p>
            
            ${
              func.touches
                ? `
            <div class="database-operations">
                <h4>DATABASE OPERATIONS</h4>
                ${
                  func.touches.read
                    ? `
                <div class="operation-section">
                    <h5>READ OPERATIONS</h5>
                    <div class="operation-list">
                        ${func.touches.read
                          .map(
                            (table) =>
                              `<span class="operation-item read-operation">${table}</span>`
                          )
                          .join("")}
                    </div>
                </div>
                `
                    : ""
                }
                ${
                  func.touches.write
                    ? `
                <div class="operation-section">
                    <h5>WRITE OPERATIONS</h5>
                    <div class="operation-list">
                        ${func.touches.write
                          .map(
                            (table) =>
                              `<span class="operation-item write-operation">${table}</span>`
                          )
                          .join("")}
                    </div>
                </div>
                `
                    : ""
                }
            </div>
            `
                : ""
            }
            
            ${
              func.input
                ? `
            <div class="parameters">
                <h4>Parameters</h4>
                <div class="parameters-container">
                    <div class="parameter">
                        <div class="parameter-name">Input Schema</div>
                        <div class="parameter-description">Function input parameters</div>
                        <div class="json-schema">
                            <div class="model">${JSON.stringify(
                              func.input,
                              null,
                              2
                            )}</div>
                        </div>
                    </div>
                </div>
            </div>
            `
                : ""
            }
            
            <div class="examples">
                <h4>Examples</h4>
                ${this.generateExamples(func)}
            </div>
        </div>
    </div>`;
  }

  /**
   * Color code JSON string for syntax highlighting
   */
  private colorCodeJson(jsonString: string): string {
    let result = jsonString;

    // Handle strings (both keys and values)
    result = result.replace(/"([^"\\]|\\.)*"/g, (match) => {
      // Check if it's a key (followed by colon)
      if (result.indexOf(match + ":") !== -1) {
        return `<span class="json-key">${match}</span>`;
      }
      return `<span class="json-string">${match}</span>`;
    });

    // Handle numbers
    result = result.replace(
      /:\s*(\d+(?:\.\d+)?)/g,
      ': <span class="json-number">$1</span>'
    );

    // Handle booleans
    result = result.replace(
      /:\s*(true|false)/g,
      ': <span class="json-boolean">$1</span>'
    );

    // Handle null
    result = result.replace(
      /:\s*null/g,
      ': <span class="json-null">null</span>'
    );

    // Handle brackets and braces
    result = result.replace(/[{}[\]]/g, '<span class="json-bracket">$&</span>');

    // Handle colons
    result = result.replace(/:/g, '<span class="json-colon">:</span>');

    // Handle commas
    result = result.replace(/,/g, '<span class="json-comma">,</span>');

    return result;
  }

  /**
   * Color code JavaScript/TypeScript code for syntax highlighting
   */
  private colorCodeCode(codeString: string): string {
    let result = codeString;

    // Handle comments
    result = result.replace(
      /(\/\/.*$)/gm,
      '<span class="code-comment">$1</span>'
    );

    // Handle strings
    result = result.replace(
      /"([^"\\]|\\.)*"/g,
      '<span class="code-string">$&</span>'
    );
    result = result.replace(
      /'([^'\\]|\\.)*'/g,
      '<span class="code-string">$&</span>'
    );

    // Handle numbers
    result = result.replace(
      /\b(\d+(?:\.\d+)?)\b/g,
      '<span class="code-number">$1</span>'
    );

    // Handle keywords
    const keywords = [
      "const",
      "let",
      "var",
      "function",
      "async",
      "await",
      "return",
      "if",
      "else",
      "for",
      "while",
      "try",
      "catch",
      "throw",
      "new",
      "this",
      "class",
      "extends",
      "import",
      "export",
      "from",
      "default",
    ];
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "g");
      result = result.replace(
        regex,
        `<span class="code-keyword">${keyword}</span>`
      );
    });

    // Handle function calls
    result = result.replace(
      /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
      '<span class="code-function">$1</span>('
    );

    // Handle operators
    result = result.replace(
      /([{}[\](),;])/g,
      '<span class="code-bracket">$1</span>'
    );
    result = result.replace(
      /([=+\-*/<>!&|])/g,
      '<span class="code-operator">$1</span>'
    );

    return result;
  }

  /**
   * Generate examples for a database function
   */
  private generateExamples(func: DatabaseFunction): string {
    const examples = this.createExamples(func);
    return examples
      .map(
        (example, idx) => `
      <div class="example-section">
        <div class="example-title">${example.title}</div>
        <div class="example-code">${example.code}</div>
      </div>
    `
      )
      .join("");
  }

  /**
   * Create examples for a database function
   */
  private createExamples(
    func: DatabaseFunction
  ): Array<{ title: string; code: string }> {
    const examples = [];

    // Function call example
    if (func.input) {
      const inputExample = this.generateInputExample(func);
      examples.push({
        title: "Function Call",
        code: `// ${func.opId}\nconst result = await ${func.opId}(${inputExample});`,
      });
    } else {
      examples.push({
        title: "Function Call",
        code: `// ${func.opId}\nconst result = await ${func.opId}();`,
      });
    }

    // Input example
    if (func.input) {
      examples.push({
        title: "Input Parameters",
        code: JSON.stringify(this.generateSampleInput(func.input), null, 2),
      });
    }

    // Output example
    if (func.output) {
      examples.push({
        title: "Expected Output",
        code: JSON.stringify(this.generateSampleOutput(func.output), null, 2),
      });
    }

    // Database operation example
    if (func.touches) {
      const dbExample = this.generateDatabaseExample(func);
      if (dbExample) {
        examples.push({
          title: "Database Operations",
          code: dbExample,
        });
      }
    }

    return examples;
  }

  /**
   * Generate input example for function call
   */
  private generateInputExample(func: DatabaseFunction): string {
    if (!func.input || !func.input.properties) return "";

    const params = Object.keys(func.input.properties).map((key) => {
      const prop = func.input?.properties?.[key] as any;
      if (!prop) return `${key}: null`;

      if (prop.default !== undefined) {
        return `${key}: ${JSON.stringify(prop.default)}`;
      }
      if (prop.type === "string") {
        return `${key}: "example_${key}"`;
      }
      if (prop.type === "number" || prop.type === "integer") {
        return `${key}: 1`;
      }
      if (prop.type === "boolean") {
        return `${key}: true`;
      }
      if (prop.type === "array") {
        return `${key}: ["item1", "item2"]`;
      }
      return `${key}: null`;
    });

    return `{\n  ${params.join(",\n  ")}\n}`;
  }

  /**
   * Generate sample input data
   */
  private generateSampleInput(inputSchema: any): any {
    if (!inputSchema.properties) return {};

    const sample: any = {};
    for (const [key, prop] of Object.entries(inputSchema.properties)) {
      const typedProp = prop as any;
      if (typedProp.default !== undefined) {
        sample[key] = typedProp.default;
      } else if (typedProp.type === "string") {
        sample[key] = `example_${key}`;
      } else if (typedProp.type === "number" || typedProp.type === "integer") {
        sample[key] = 1;
      } else if (typedProp.type === "boolean") {
        sample[key] = true;
      } else if (typedProp.type === "array") {
        sample[key] = ["item1", "item2"];
      } else {
        sample[key] = null;
      }
    }
    return sample;
  }

  /**
   * Generate sample output data
   */
  private generateSampleOutput(outputSchema: any): any {
    if (!outputSchema.properties) return { result: "success" };

    const sample: any = {};
    for (const [key, prop] of Object.entries(outputSchema.properties)) {
      const typedProp = prop as any;
      if (typedProp.type === "string") {
        sample[key] = `sample_${key}`;
      } else if (typedProp.type === "number" || typedProp.type === "integer") {
        sample[key] = 1;
      } else if (typedProp.type === "boolean") {
        sample[key] = true;
      } else if (typedProp.type === "array") {
        sample[key] = [{ id: 1, name: "item1" }];
      } else {
        sample[key] = null;
      }
    }
    return sample;
  }

  /**
   * Generate database operation example
   */
  private generateDatabaseExample(func: DatabaseFunction): string {
    if (!func.touches) return "";

    let example = "";

    if (func.touches.read && func.touches.read.length > 0) {
      example += `// Read operations:\n`;
      func.touches.read.forEach((table) => {
        example += `// - SELECT * FROM ${table}\n`;
      });
    }

    if (func.touches.write && func.touches.write.length > 0) {
      if (example) example += "\n";
      example += `// Write operations:\n`;
      func.touches.write.forEach((table) => {
        if (
          func.opId.toLowerCase().includes("create") ||
          func.opId.toLowerCase().includes("add")
        ) {
          example += `// - INSERT INTO ${table}\n`;
        } else if (
          func.opId.toLowerCase().includes("update") ||
          func.opId.toLowerCase().includes("edit")
        ) {
          example += `// - UPDATE ${table}\n`;
        } else if (
          func.opId.toLowerCase().includes("delete") ||
          func.opId.toLowerCase().includes("remove")
        ) {
          example += `// - DELETE FROM ${table}\n`;
        } else {
          example += `// - MODIFY ${table}\n`;
        }
      });
    }

    return example;
  }
}
