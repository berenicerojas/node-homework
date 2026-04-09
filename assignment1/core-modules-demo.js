const os = require('os');
const path = require('path');
const fs = require('fs');
const fsPromises = require ('fs/promises');

// OS module
async function runCoreModulesDemo(){
  console.log('Platform:', os.platform());
  console.log('CPU:', os.cpus()[0].model);
  console.log('Total Memory:', os.totalmem());

  // Path module
  const joinedPath = path.join(__dirname, 'sample-files', 'folder', 'file.txt');
  console.log ('Joined path:', joinedPath);
  // fs.promises API
  const demoPath = path.join(__dirname, 'sample-files', 'demo.txt');
  try {
    await fsPromises.writeFile(demoPath,'Hello from fs.promises!');
    const data = await fsPromises.readFile(demoPath, 'utf8');
    console.log('fs.promises read:', data);
  } catch (err) {
    console.error('fs.promises error:', err);
  }
// Streams for large files- log first 40 chars of each chunk
  const largeFilePath = path.join (__dirname, 'sample-files', 'largefile.txt');

  const streamWriter = fs.createWriteStream(largeFilePath);
  for (let i = 1; i <= 100; i++){
    streamWriter.write(`Line ${i}: This is a line in a large file specifically for the stream demo. \n`);
  }

  streamWriter.end();

  streamWriter.on('finish', ()=>{
    const readStream = fs.createReadStream(largeFilePath,{
      encoding: 'utf8',
      highWaterMark: 1024
    });

    readStream.on('data', (chunk) =>{
      console.log ('Read chunk:', chunk.substring(0,40).replace(/\n/g,'') + '...');
    });

    readStream.on('end', () => {
      console.log('Finished reading large file with streams.');
    });
  });
}

runCoreModulesDemo();
