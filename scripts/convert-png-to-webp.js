import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const convertPngToWebp = async (inputPath, outputPath) => {
  try {
    await sharp(inputPath)
      .webp({ quality: 85 })
      .toFile(outputPath);
    console.log(`Converted: ${inputPath} → ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`Error converting ${inputPath}:`, error);
    return false;
  }
};

const findPngFiles = (dir, pngFiles = []) => {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findPngFiles(filePath, pngFiles);
    } else if (file.toLowerCase().endsWith('.png')) {
      pngFiles.push(filePath);
    }
  }
  
  return pngFiles;
};

const main = async () => {
  const projectRoot = path.resolve(process.cwd());
  const pngFiles = findPngFiles(projectRoot);
  
  console.log(`Found ${pngFiles.length} PNG files to convert`);
  
  // Process files in parallel batches for better performance
  const batchSize = 5;
  let converted = 0;
  
  for (let i = 0; i < pngFiles.length; i += batchSize) {
    const batch = pngFiles.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(pngFile => {
        const webpFile = pngFile.replace(/\.png$/i, '.webp');
        return convertPngToWebp(pngFile, webpFile);
      })
    );
    converted += results.filter(Boolean).length;
  }
  
  console.log(`Conversion complete! Successfully converted ${converted}/${pngFiles.length} files.`);
};

main().catch(console.error);
