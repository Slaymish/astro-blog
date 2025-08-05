import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const convertPngToWebp = async (inputPath, outputPath) => {
  try {
    await sharp(inputPath)
      .webp({ quality: 85 })
      .toFile(outputPath);
    console.log(`Converted: ${inputPath} → ${outputPath}`);
  } catch (error) {
    console.error(`Error converting ${inputPath}:`, error);
  }
};

const findPngFiles = (dir, pngFiles = []) => {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findPngFiles(filePath, pngFiles);
    } else if (file.toLowerCase().endsWith('.webp')) {
      pngFiles.push(filePath);
    }
  }
  
  return pngFiles;
};

const main = async () => {
  const projectRoot = path.resolve(process.cwd());
  const pngFiles = findPngFiles(projectRoot);
  
  console.log(`Found ${pngFiles.length} PNG files to convert`);
  
  for (const pngFile of pngFiles) {
    const webpFile = pngFile.replace(/\.webp$/i, '.webp');
    await convertPngToWebp(pngFile, webpFile);
    
    // Optionally remove the original PNG file
    // fs.unlinkSync(pngFile);
    // console.log(`Removed: ${pngFile}`);
  }
  
  console.log('Conversion complete!');
};

main().catch(console.error);
