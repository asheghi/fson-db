const symbolWatch = Symbol.for('watch');
const symbolStorage = Symbol.for('storage');
const {debounce} = require('lodash')
const _ = require("lodash");
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const d = require('debug')('fson')
const isNode = typeof process !== 'undefined'
  && process.versions != null
  && process.versions.node != null;

function escapeReference(value) {
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      return [...value]
    } else if (Object.prototype.toString.call(value) === '[object Date]') {
      return new Date(value.getTime());
    } else {
      return {...value};
    }
  }
  return value;
}

function FSON(storagePath, options = {}) {
  const d = require('debug')('fson-' + storagePath);
  d('creating new fson object', storagePath, options);
  const storage = createStorage(storagePath, options);
  const dbTarget = {};
  const mainHandler = {
    ownKeys: function () {
      return storage.keys();
    },
    getOwnPropertyDescriptor(target, prop) {
      return {configurable: true, enumerable: true, value: null};
    },
    get(target, name, receiver) {
      d('main getting', name);
      if (typeof name === 'symbol'){
        return target[name];
      }
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
                        newTemp[symbolWatch].call(newTemp, path.slice(i).join('.'), v, before)
                      };
                    }

                    temp = temp[section];
                  }

                  let lastSection = sections[sections.length - 1];

                  //watch main object
                  if (target[symbolWatch]) {
                    let before = temp[lastSection];
                    if (typeof before === 'object') before = {...before};
                    afterSave = () => target[symbolWatch].call(target, [name, ...path].join('.'), v, before)
                  }

                  temp[lastSection] = v;
                } else {
                  //watch main object
                  if (target[symbolWatch]) {
                    let before = obj[n];
                    if (typeof before === 'object') before = {...before};
                    afterSave = () => target[symbolWatch].call(target, [name, ...path].join('.'), v, before)
                  }


                  obj[n] = v;
                }

                storage.setItem(name, obj);
                if (afterSave) afterSave();
                if (afterSaveNested) afterSaveNested();
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
      d('main setting', name, value);
      if (typeof name === 'symbol') {
        d('set: ignoring ',name,value);
        target[name] = value;
        return;
      };

      if (typeof value === 'function') {
        target[name] = value.bind(target);
        return;
      }

      try {
        let before = escapeReference(storage.getItem(name));
        storage.setItem(name, escapeReference(value))

        if (target[symbolWatch]) {
          target[symbolWatch].call(target, name, value, before);
        }
      } catch (e) {
        console.error(e);
      }
      return true;
    },
    deleteProperty(target, prop) {
      d('deleting ', prop);
      try {
        storage.removeItem(prop);
      } catch (e) {
        console.error(e);
      }
      return true;
    }
  };

  let proxy = new Proxy(dbTarget, mainHandler);
  proxy[symbolStorage] = storage;
  return proxy;
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
  d('creating browser storage')
  const cache = {}
  return {
    flush(){
      // does nothing
    },
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

function createNodeStorage(storagePath, opt) {
  const d = require('debug')('fson-node-storage');
  d('creating node storage')
  const fs = require('fs');
  const path = require('path');
  const pendingWrite = {};
  const cache = {};

  storagePath = path.resolve(storagePath);
  d('resolved path', storagePath);

  const maxWait = opt.maxWaitWrite || 0;
  const invalidateCache = opt.invalidateCache ? +opt.invalidateCache : false;

  function checkInvalidation(name) {
    if (invalidateCache) {
      setTimeout(() => {
        storageWriteSync(name);
        delete cache[name]
      }, invalidateCache);
    }
  }

  function storageWriteSync(name) {
    d('write sync called for', name);
    if (!pendingWrite[name]) return;
    const jsonPath = path.join(storagePath, name);
    let content = JSON.stringify(cache[name]) || '';
    d('write sync writing', name, jsonPath, content);
    fs.writeFileSync(jsonPath, content);
    pendingWrite[name] = false;
    d('write sync finished', name)
  }

  const debouncedStorageWrite = debounce(function (name) {
    if (pendingWrite[name]) storageWriteSync(name);
  }, maxWait, {
    // leading:true,
    // trailing:true,
    maxWait,
  })

  const storageWriteAsync = function (name) {
    debouncedStorageWrite(name);
  };

  //create directory if not exists
  if (!fs.existsSync(storagePath)) {
    d('making directory', storagePath);
    fs.mkdirSync(path.resolve(storagePath), {recursive: true})
  }

  const cleanUp = (reason) => () => {
    d('clean up called for', reason)
    let pendingWriteNames = Object.keys(pendingWrite).filter(key => pendingWrite[key]);
    if (pendingWriteNames) {
      for (const name of pendingWriteNames) {
        storageWriteSync(name);
      }
    }
  }

  process.addListener('exit', cleanUp('exit'))
  process.addListener('SIGINT', cleanUp('SIGINT'))
  process.addListener('SIGUSR1', cleanUp('sig1'))
  process.addListener('SIGUSR2', cleanUp('sig2'))
  process.addListener('uncaughtException', cleanUp('uncaughtException'))

  return {
    flush(){
      d('flush called')
      cleanUp('flush')();
    },
    cache,
    getItem(name) {
      if (cache[name]) return cache[name];
      //apply pending changes to prevent inconsistency
      // if (pendingWrite[name]) storageWriteSync(name);
      const jsonPath = path.join(storagePath, name);
      try {
        if (!fs.existsSync(jsonPath)) return undefined;
        const string = fs.readFileSync(jsonPath, {encoding: 'utf8'});
        let value = JSON.parse(string);
        cache[name] = value;
        return value;
      } catch (e) {
        console.error(e);
      }
      return undefined;
    },
    setItem(name, value) {
      cache[name] = value;
      pendingWrite[name] = true;
      checkInvalidation(name);
      setTimeout(() => {
        storageWriteAsync(name);
      })
    },
    keys() {
      d('keys called()', storagePath)
      //in case of double instance on the same path ->  cleanUp('getting keys');
      let one = fs.existsSync(storagePath) ? fs.readdirSync(storagePath)  : [];
      let two = Object.keys(escapeReference(cache));
      return _.union(two, one,)
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

function createStorage(storagePath, options) {
  if (isBrowser) return createBrowserStorage()
  else if (isNode) return createNodeStorage(storagePath, options);
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



//todo add a mechanism to define a default config
const instances = {};

function FsonFactory(storagePath, options) {
  const key = storagePath /*+ JSON.stringify(options)*/;
  if (!instances[key]) {
    instances[key] = FSON(storagePath, options);
  }
  return instances[key]
}

FsonFactory.watch = function (obj, callback = (fieldPath, newVal, oldVal) => {
}, options = {}) {
  obj[symbolWatch] = callback
};


module.exports = FsonFactory;
