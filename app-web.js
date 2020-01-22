const ds = require("./lib/keyvalue-db").async;

const express = require("express");
const app = express();

app.get('/read', function (req, res, next) {
  let key = req.query.key;
  ds.readkey(key).then(x => {
    return res.status(200).send(JSON.parse(x));
  }).catch(x => {
    return res.status(400).send(x);
  })
})

app.post('/create', function (req, res, next) {
  let key = req.query.key;
  let value = req.query.value;
  let timeout = req.query.timeout ? req.query.timeout : 0;
  ds.createkey(key, value, timeout)
    .then(x => {
      return res.status(201).send(x);
    }).catch(x => {
      return res.status(400).send(x);
    })
})

app.get('/delete', function (req, res, next) {
  let key = req.query.key;
  ds.deletekey(key).then(x => {
    return res.status(200).send(x);
  }).catch(x => {
    return res.status(400).send(x);
  })
})

app.get('/setpath', function (req, res, next) {
  let key = req.query.key;
  ds.setpath(key).then(x => {
    return res.status(200).send(x);
  }).catch(x => {
    return res.status(400).send(x);
  })
})

app.listen(3000, () => {
  console.log('Server is running!!: 3000')
})