# Node.js Fundamentals

## What is Node.js?
Node is an open source Javascript runtime environment. It lets users to execute Javascript code outside of a web browser. It was built on Google Chrome's V8 Javascript engine and uses an event-driven, non-blocking input and output model which makes it lightweight and efficient for data heavy real time applications.

## How does Node.js differ from running JavaScript in the browser?
Node.js focuses on server side operations and Javascript focuses on DOM and user interaction. Javascript lives in a sandbox which is secure so it can't access local file system. Whereas Node provides APIs for file, network, and operating system interactions that cannot be done in browser.

## What is the V8 engine, and how does Node use it?
My understanding of the V8 engine is it's an open-source & high performing javascript engine developed by google for chrome browser. NODE uses V8 to translate Javascript code directly into Machine code instead of interpreting it line by line. 

## What are some key use cases for Node.js?
Some key use cases for Node.js are real-time applications, APIs, streaming services, and command line tools.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

**CommonJS (default in Node.js):**
```js
const add = (a,b) => a + b;
module.exports = {add};

import {add} = require('./math');
```

**ES Modules (supported in modern Node.js):**
`
export const add = (a, b) => a + b;

import {add} from './math.js';
``` 