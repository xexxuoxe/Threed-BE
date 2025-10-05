var express = require('express')
var cors = require('cors')
var app = express()
const port = 3000;
 
app.use(cors())
 
app.get('/products/:id', function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for all origins!'})
})
 
app.listen(port, function () {
  console.log('CORS-enabled web server listening on port 80')
})