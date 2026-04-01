import { list, del } from '@vercel/blob';
import * as dotenv from 'dotenv';

// Load .env file
dotenv.config();

async function main() {
  console.log('--- CLEARING VERCEL BLOB STORAGE ---');
  
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('Error: BLOB_READ_WRITE_TOKEN not found in .env file.');
    return;
  }

  let hasMore = true;
  let cursor: string | undefined;
  let totalDeleted = 0;

  try {
    while (hasMore) {
      const result = await list({ cursor });
      
      if (result.blobs.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`Processing batch of ${result.blobs.length} blobs...`);
      
      // Delete in parallel to speed up the reset
      await Promise.all(result.blobs.map(async (blob) => {
        await del(blob.url);
        totalDeleted++;
      }));
      
      hasMore = result.hasMore;
      cursor = result.cursor;
    }

    if (totalDeleted === 0) {
      console.log('No files were found in your Vercel storage.');
    } else {
      console.log(`✓ Successfully deleted ${totalDeleted} files from Vercel storage.`);
    }
    
    console.log('--- STORAGE RESET COMPLETED ---');
  } catch (error) {
    console.error('Error clearing blobs:', error);
  }
}

main();
