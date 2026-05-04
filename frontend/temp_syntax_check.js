const fs = require('fs');  
const code = fs.readFileSync('c:/Users/jeffe/Downloads/Brane/frontend/src/pages/SocialPage.js','utf8');  
try {  
  const parser = require('@babel/parser');  
  parser.parse(code,{sourceType:'module',plugins:['jsx']});  
  console.log('parse ok');  
} catch (e) {  
  console.error('parse error');  
  console.error(e.message);  
  process.exit(1);  
}  
