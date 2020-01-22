"use strict";

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");

let d = {};
let filePath = "./db.json";
const bytes = s => {
  return ~-encodeURI(JSON.stringify(s)).split(/%..|./).length;
};

function writeData(path = "./db.json", d = {}) {
  return new Promise(async (resolve, reject) => {
    await fsp
      .writeFile(path, JSON.stringify(d))
      .then(() => resolve())
      .catch(x => reject(x));
  });
}

async function defaultPath(value) {
  if (Object.entries(d).length === 0) {
    try {
      let data;
      if (value == "sync") {
        data = fs.readFileSync("./db.json");
      } else if (value == "async") {
        data = await fsp.readFile("./db.json");
      }
      if (data.length !== 0) {
        d = JSON.parse(data);
      }
      return true;
    } catch {
      return false;
    }
  }
}

let setpath = function (userPath = "./db.json") {
  let filePath = path.resolve(userPath);
  if (path.extname(filePath) === ".json") {
    try {
      let exists = fs.existsSync(path.dirname(filePath));
      if (!exists) {
        throw {
          code: "noDir"
        };
      }
      let data = fs.readFileSync(filePath);
      if (data.length !== 0) {
        d = JSON.parse(data);
      }
      return `${path.basename(filePath)} path set`;
    } catch (e) {
      if (e.code) {
        try {
          if (e.code === "noDir") {
            fs.mkdirSync(path.dirname(filePath), {
              recursive: true
            }); //errno: -4071,code: 'EINVAL',syscall: 'mkdir',
          }
          fs.writeFileSync(filePath, "");
          d = {};
          return `${path.basename(filePath)} path set`;
        } catch (e) {
          return {
            error: "given path is invalid"
          };
        }
      } else {
        return {
          error: "file contains invalid JSON data"
        };
      }
    }
  } else {
    return {
      error: "invalid file name: should be a json file"
    };
  }
};

function readkey(key) {
  if (defaultPath("sync") === false) {
    return {
      error: `createkey() to create new key value pair or use setpath() to set new path`
    };
  }
  if (d.hasOwnProperty(key)) {
    let fValue = d[key];
    if (
      fValue[1] == 0 ||
      Math.round(new Date().getTime() / 1000) <= fValue[1]
    ) {
      return JSON.stringify({
        [key]: fValue[0]
      });
    } else {
      return {
        error: `time-to-live of key: ${key} has expired`
      };
    }
  } else {
    return {
      error: "key does not exists"
    };
  }
}

function createkey(key1, value, timeout = 0) {
  if (defaultPath("sync") === false) {
    return {
      error: `createkey() to create new key value pair or use setpath() to set new path`
    };
  }
  let key = key1.trim();
  if (d.hasOwnProperty(key)) {
    return {
      error: "key already exist"
    };
  } else {
    let regex = /^[A-Za-z]+$/;
    if (regex.test(key.trim()) && key.length <= 32) {
      if (
        bytes(d) < Math.pow(1024, 3) &&
        bytes(value) < 16 * Math.pow(1024, 3)
      ) {
        let fval = [];
        timeout = parseInt(timeout);
        if (timeout === 0) {
          fval = [value, timeout];
        } else {
          let ftime = Math.round(new Date().getTime() / 1000) + timeout;
          fval = [value, ftime];
        }
        d[key] = fval;
        try {
          fs.writeFileSync((filePath = "./db.json"), JSON.stringify(d));
          return "key-value pair created";
        } catch (e) {
          delete d[key];
          return {
            error: "key-value not added to the file!"
          };
        }
      } else {
        return {
          error:
            "File size is capped at 1 GB and value of JSON is capped at 16KB"
        };
      }
    } else {
      return {
        error:
          "key must contain only alphabets and must not exceed 32 characters"
      };
    }
  }
}

function deletekey(key) {
  if (defaultPath("sync") === false) {
    return {
      error: `createkey() to create new key value pair or use setpath() to set new path`
    };
  }
  if (d.hasOwnProperty(key)) {
    let fValue = d[key];
    if (
      fValue[1] == 0 ||
      Math.round(new Date().getTime() / 1000) <= fValue[1]
    ) {
      let tempd = {
        ...d
      };
      delete d[key];
      try {
        fs.writeFileSync((filePath = "./db.json"), JSON.stringify(d));
        return "key deleted";
      } catch (e) {
        d = tempd;
        return {
          error: "key-value not deleted from the file!"
        };
      }
    } else {
      return {
        error: `time-to-live of key: ${key} has expired`
      };
    }
  } else {
    return {
      error: "key does not exists"
    };
  }
}

exports.async = {
  setpath: function (userPath = "./db.json") {
    let filePath = path.resolve(userPath);
    return new Promise(async (resolve, reject) => {
      if (path.extname(userPath) === ".json") {
        try {
          let exists = fs.existsSync(path.dirname(filePath));
          if (!exists) {
            throw {
              code: "noDir"
            };
          }
          let data = await fsp.readFile(filePath);
          if (data != "") {
            d = JSON.parse(data);
          }
          return resolve("file read successfully");
        } catch (e) {
          if (e.code) {
            try {
              if (e.code === "noDir") {
                await fsp.mkdir(path.dirname(filePath), {
                  recursive: true
                }); //errno: -4071,code: 'EINVAL',syscall: 'mkdir',
              }
              await fsp.writeFile(filePath, "");
              d = {};
              return resolve(`${path.basename(filePath)} path set`);
            } catch (e) {
              if (e.syscall == "mkdir") {
                return reject({
                  error: "invalid path given"
                });
              } else {
                return reject({
                  error: "unable to create file in the given path"
                });
              }
            }
          } else {
            return reject({
              error: "file contains invalid JSON data"
            });
          }
        }
      } else {
        return reject({
          error: "invalid file name: should be a json file"
        });
      }
    });
  },

  readkey: function (key) {
    return new Promise(async (resolve, reject) => {
      if (await defaultPath("async") === false) {
        return reject({
          error: `createkey() to create new key value pair or use setpath() to set new path`
        });
      }
      if (d.hasOwnProperty(key)) {
        let fValue = d[key];
        if (
          fValue[1] == 0 ||
          Math.round(new Date().getTime() / 1000) <= fValue[1]
        ) {
          return resolve(
            JSON.stringify({
              [key]: fValue[0]
            })
          );
        } else {
          return reject({
            error: `time-to-live of key: ${key} has expired`
          });
        }
      } else {
        return reject({
          error: "key does not exists"
        });
      }
    });
  },

  createkey: function (key1, value, timeout = 0) {
    let key = key1.trim();
    if (parseInt(value)) {
      value = parseInt(value);
    }
    return new Promise(async (resolve, reject) => {
      if (await defaultPath("async") === false) {
        return reject({
          error: `createkey() to create new key value pair or use setpath() to set new path`
        });
      }
      if (d.hasOwnProperty(key)) {
        return reject({
          error: "key already exists"
        });
      } else {
        let regex = /^[A-Za-z]+$/;
        if (regex.test(key.trim()) && key.length <= 32) {
          if (
            bytes(d) < Math.pow(1024, 3) &&
            bytes(value) < 16 * Math.pow(1024, 3)
          ) {
            let fval = [];
            timeout = parseInt(timeout);
            if (timeout === 0) {
              fval = [value, timeout];
            } else {
              let ftime = Math.round(new Date().getTime() / 1000) + timeout;
              fval = [value, ftime];
            }
            d[key] = fval;
            await writeData(filePath, d)
              .then(() => {
                return resolve("key-value pair created");
              })
              .catch(e => {
                delete d[key];
                return reject({
                  error: "key-value not added to the file!"
                });
              });
          } else {
            return reject({
              error:
                "File size is capped at 1 GB and value of JSON is capped at 16KB"
            });
          }
        } else {
          return reject({
            error:
              "key must contain only alphabets and must not exceed 32 characters"
          });
        }
      }
    });
  },

  deletekey: function (key) {
    return new Promise(async (resolve, reject) => {
      if (await defaultPath("async") === false) {
        return reject({
          error: `createkey() to create new key value pair or use setpath() to set new path`
        });
      }
      if (d.hasOwnProperty(key)) {
        let fValue = d[key];
        if (
          fValue[1] == 0 ||
          Math.round(new Date().getTime() / 1000) <= fValue[1]
        ) {
          let tempd = {
            ...d
          };
          delete d[key];
          writeData(filePath, d)
            .then(() => {
              return resolve("key deleted");
            })
            .catch(e => {
              d = tempd;
              return reject({
                error: "key-value not deleted from the db!"
              });
            });
        } else {
          return reject({
            error: `time-to-live of key: ${key} has expired`
          });
        }
      } else {
        return reject({
          error: "key does not exists"
        });
      }
    });
  }
};


exports.setpath = setpath;
exports.readkey = readkey;
exports.createkey = createkey;
exports.deletekey = deletekey;