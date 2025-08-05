import fs from 'fs';
import path from 'path';

const updateFileReferences = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Update various PNG reference patterns
    content = content.replace(/\.webp/g, '.webp');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated references in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
};

const findFilesToUpdate = (dir, files = []) => {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findFilesToUpdate(itemPath, files);
    } else if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();
      if (['.astro', '.md', '.mdx', '.js', '.ts', '.tsx', '.jsx', '.json', '.css', '.scss'].includes(ext)) {
        files.push(itemPath);
      }
    }
  }
  
  return files;
};

const main = () => {
  const projectRoot = path.resolve(process.cwd());
  const filesToUpdate = findFilesToUpdate(projectRoot);
  
  console.log(`Checking ${filesToUpdate.length} files for PNG references`);
  
  let updatedCount = 0;
  for (const file of filesToUpdate) {
    if (updateFileReferences(file)) {
      updatedCount++;
    }
  }
  
  console.log(`Updated ${updatedCount} files`);
};

main();
