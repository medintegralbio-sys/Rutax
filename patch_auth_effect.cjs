const fs = require('fs');
let content = fs.readFileSync('src/components/AuthFlow.tsx', 'utf8');

content = content.replace("import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';");

const effectCode = `  useEffect(() => {
    // Sync users from firestore so different devices can login
    rutaxStore.hydrateFromFirestore().catch(console.error);
  }, []);

  // Form States`;

content = content.replace("  // Form States", effectCode);
fs.writeFileSync('src/components/AuthFlow.tsx', content);
