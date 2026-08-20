const fs = require('fs');
let content = fs.readFileSync('src/services/dynadotApi.ts', 'utf8');

// The botched line:
// if (data?.Response?.Error) { throw new Error(`Dynadot Error: ${data.Response.Error}`); }`n    if (data?.SearchResponse?.Status === "invalid_key" || data?.SearchResponse?.Error) { throw new Error(`Dynadot Error: Invalid Key or blocked by IP whitelist`); }`n    const result = data?.SearchResponse?.SearchResults?.[0];

content = content.replace(/if \(data\?.Response\?.Error\).*const result = data\?.SearchResponse\?.SearchResults\?\.\[0\];/,
`if (data?.Response?.Error) { throw new Error(\`Dynadot Error: \${data.Response.Error}\`); }
    if (data?.SearchResponse?.Status === "invalid_key" || data?.SearchResponse?.Error) { throw new Error(\`Dynadot Error: Invalid Key or blocked by IP whitelist\`); }
    const result = data?.SearchResponse?.SearchResults?.[0];`);

fs.writeFileSync('src/services/dynadotApi.ts', content, 'utf8');
