const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');

const dirPath = path.join(__dirname, 'sample-files');
const filePath = path.join(dirPath, 'sample.txt');
const content = 'Hello, async world!';

// Write a sample file for demonstration
if (!fs.existsSync(dirPath)){
  fs.mkdirSync(dirPath);
}

fs.writeFileSync(filePath, content);
  // Callback hell example (test and leave it in comments):

  /*
  fs.readFile ('file1.txt', (err, data1) =>{
    fs.readFile ('file2.txt', (err, data2) => {
      fs.readFile ('file3.txt', (err, data3) => {
        this pyramid makes it hard to read and mantain!!!!
        });
      });
    '});
  */


// 1. Callback style
fs.readFile(filePath, 'utf8', (err, data) =>{
  if (err){
    console.error ('Callback error:', err);
  } else {
    console.log('Callback read:', data);
   
 // 2. Promise style 
    fsPromises.readFile(filePath,'utf8')
    .then((data) => {
      console.log('Promise read:', data);
      runAsyncAwait();
    })
    .catch((err) => {
      console.error('Promise error:', err);
    });
  }
});
// 3. Async/Await style
async function runAsyncAwait(){
  try {
    const data = await fsPromises.readFile(filePath, 'utf8');
    console.log('Async/Await read:', data);
  } catch (err) {
    console.error('Async/Await error:', err);
  }
}
