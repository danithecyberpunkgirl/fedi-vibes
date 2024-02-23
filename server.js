const express = require('express')
const app = express()
const port = 8080

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.listen(port, () => {
  console.log(`Open your browser at http://localhost:${port} to get started!`)
});