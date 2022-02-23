const path = require("path");
const fs = require("fs");
const symbolWatch = Symbol.for('watch');

const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const isNode = typeof process !== 'undefined'
  && process.versions != null
  && process.versions.node != null;

function FSON(storagePath) {
  const storage = createLocalStorage(storagePath);
  const dbTarget = {};
  const mainHandler = {
    ownKeys: function () {
      return storage.keys();
    },
    getOwnPropertyDescriptor(target, prop) {
      return {configurable: true, enumerable: true, value: null};
    },
    get(target, name, receiver) {
      try {
        let value = storage.getItem(name);
        /*if (Array.isArray(value)){
            return value;
        }*/

        if (typeof value === 'object') {
          if (value === null) {
            return null;
          }

          //ignore dates!
          if (Object.prototype.toString.call(value) === '[object Date]') {
            return value;
          }

          let mainNp = undefined;
          let nestedHandler = (arg, parentObject, np) => ({
            get(t, n) {
              if (Array.isArray(t)) {
                if (n === 'push') {
                  return (...pushArg) => {
                    let path = arg;
                    let prePushJsonValue = storage.getItem(name);
                    if (path.length) {
                      const sections = path;
                      let temp = prePushJsonValue;
                      for (let i = 0; i < sections.length - 1; i++) {
                        let section = sections[i];
                        temp = temp[section]
                      }
                      let lastSection = sections[sections.length - 1];
                      temp[lastSection] = [...temp[lastSection], ...pushArg];
                    } else {
                      prePushJsonValue = [...prePushJsonValue, ...pushArg];
                    }
                    storage.setItem(name, prePushJsonValue);
                    return true;
                  }
                }

                if (typeof t[n] !== 'object') {
                  return t[n];
                }
                let nestedArrayProxy;
                nestedArrayProxy = new Proxy(t[n], nestedHandler([...arg, n], parentObject, nestedArrayProxy));
                return nestedArrayProxy;
              }

              if (typeof n !== 'string') {
                return t[n];
              }

              let path = [...arg, n];
              let val = getNested(value, path);
              if (typeof val === "object") {
                if (val === null) {
                  return null;
                }
                let nestedProxy = undefined;
                let target = val;
                nestedProxy = new Proxy(target, nestedHandler([...arg, n], parentObject, nestedProxy))
                return nestedProxy;
              }

              return val;
            },
            set(t, n, v) {
              if (n === symbolWatch) {
                t[symbolWatch] = v;
                return true;
              }
              try {
                //recursive nested field resolution
                let obj = storage.getItem(name);
                let path = [...arg, n];

                let afterSave;
                let afterSaveNested;
                if (path.length) {
                  const sections = path;
                  let temp = obj;
                  for (let i = 0; i < sections.length - 1; i++) {
                    let section = sections[i];

                    //watch nested object
                    if (temp[symbolWatch]) {
                      let before = temp[section][sections[sections.length - 1]]
                      if (typeof before === 'object') before = {...before};
                      const newTemp = {...temp};
                      afterSaveNested = function () {
                        newTemp[symbolWatch].call(newTemp,path.slice(i).join('.'),v,before)
                      };
                    }

                    temp = temp[section];
                  }

                  let lastSection = sections[sections.length - 1];

                  //watch main object
                  if (target[symbolWatch]) {
                    let before = temp[lastSection];
                    if (typeof before === 'object') before = {...before};
                    afterSave = () => target[symbolWatch].call(target,[name,...path].join('.'),v,before)
                  }

                  temp[lastSection] = v;
                } else {
                  //watch main object
                  if (target[symbolWatch]) {
                    let before = obj[n];
                    if (typeof before === 'object') before = {...before};
                    afterSave = () => target[symbolWatch].call(target,[name,...path].join('.'),v,before)
                  }


                  obj[n] = v;
                }

                storage.setItem(name, obj);
                if(afterSave) afterSave();
                if(afterSaveNested) afterSaveNested();
                if (t[symbolWatch]) {
                  t[symbolWatch].call(t, n, v)
                }
              } catch (e) {
                console.error(e);
              }
              return true;
            },
            deleteProperty(t, n) {
              try {
                let obj = storage.getItem(name);
                let path = [...arg, n];
                if (path.length) {
                  const sections = path;
                  let temp = obj;
                  for (let i = 0; i < sections.length - 1; i++) {
                    let section = sections[i];
                    temp = temp[section]
                  }
                  let lastSection = sections[sections.length - 1];
                  delete temp[lastSection]
                } else {
                  delete obj[n]
                }
                storage.setItem(name, obj);
              } catch (e) {
                console.error(e);
              }
              return true;
            }
          })
          mainNp = new Proxy(value, nestedHandler([], value, mainNp));
          return mainNp;
        }
        if (typeof value === 'string') {
          const date = isDateString(value);
          if (date) return date;
        }
        return value;
      } catch (e) {
        console.error(e);
        return null;
      }
    },
    set(target, name, value, receiver) {
      //ignore set watcher call to storage
      // don't save to storage
      if (name === symbolWatch) {
        target[symbolWatch] = value;
        return true;
      }
      try {
        let before = storage.getItem(name);
        if (typeof before === 'object') {
          before = {...before};
        }
        storage.setItem(name, value);
        if (target[symbolWatch]) {
          target[symbolWatch].call(target, name, value,before);
        }
      } catch (e) {
        console.error(e);
      }
      return true;
    },
    deleteProperty(target, prop) {
      try {
        storage.removeItem(prop);
      } catch (e) {
        console.error(e);
      }
      return true;
    }
  };

  return new Proxy(dbTarget, mainHandler);
};

function getNested(obj, pathArray) {
  if (obj === null) {
    return null;
  }

  let a = pathArray;
  for (let i = 0, n = a.length; i < n; ++i) {
    const k = a[i];
    if (k in obj) {
      obj = obj[k];
    } else {
      return;
    }
  }
  return obj;
}

function createBrowserStorage() {
  const cache = {}
  return {
    getItem(name) {
      if (cache[name]) return cache[name];
      try {
        const string = localStorage.getItem(name);
        let value = JSON.parse(string);
        cache[name] = value;
        return value;
      } catch (e) {
        return undefined;
      }
    },
    setItem(name, value) {
      cache[name] = value;
      localStorage.setItem(name, JSON.stringify(value));
    },
    keys() {
      return Object.keys(localStorage);
    },
    removeItem(key) {
      delete cache[key];
      try {
        localStorage.removeItem(key)
      } catch (e) {
        console.error(e);
      }
    }
  };
}

function createNodeStorage(storagePath) {
  const fs = require('fs');
  const path = require('path');
  storagePath = path.resolve(storagePath);
  try {
    fs.statSync(path.resolve(storagePath));
  } catch (e) {
    try {
      fs.mkdirSync(path.resolve(storagePath), {recursive: true})
    } catch (ignored) {
      throw new Error('Bad Argument: path does not exists! check:' + storagePath);
    }
  }
  const cache = {};
  return {
    getItem(name) {
      if (cache[name]) return cache[name];
      const jsonPath = path.join(storagePath, name);
      try {
        const string = fs.readFileSync(jsonPath, {encoding: 'utf8'});
        let value = JSON.parse(string);
        cache[name] = value;
        return value;
      } catch (e) {
        return undefined;
      }
    },
    setItem(name, value) {
      cache[name] = value;
      const jsonPath = path.join(storagePath, name);
      fs.writeFileSync(jsonPath, JSON.stringify(value));
    },
    keys() {
      return fs.readdirSync(storagePath)
    },
    removeItem(name) {
      delete cache[name];
      const jsonPath = path.join(storagePath, name);
      try {
        fs.unlinkSync(jsonPath);
      } catch (e) {
        console.error(e);
      }
    }
  };
}

function createLocalStorage(storagePath) {
  if (isBrowser) return createBrowserStorage()
  else if (isNode) return createNodeStorage(storagePath);
  else throw new Error('unsupported environment');
}


function isDateString(value) {
  //todo better check
  let timeStamp = Date.parse(value);
  if (isNaN(timeStamp)) return false;
  const dateParsed = new Date(timeStamp);
  let valid = dateParsed.toISOString() === value || dateParsed.toUTCString() === value || dateParsed.toString() === value;
  return valid ? dateParsed : null;
}


module.exports = FSON;

module.exports.watch = function (obj, callback = () => {
  console.log('default callback')
}, options = {}) {
  obj[symbolWatch] = callback
};


