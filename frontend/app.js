const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'page')));

app.listen(80, () => {
  console.log('Frontend is running on port 80');
});
