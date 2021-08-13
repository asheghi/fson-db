const fs = require('fs');
const path = require('path');
const {byString} = require("./lib/utils");

function createLocalStorage(storagePath) {
    return {
        getItem(name){
            const jsonPath = path.join(storagePath,name);
            const string = fs.readFileSync(jsonPath,{encoding: 'utf8'});
            const val = JSON.parse(string);
            return val;
        },
        setItem(name,value){
            const jsonPath = path.join(storagePath,name);
            fs.writeFileSync(jsonPath,JSON.stringify(value));
        }
    };
}

const JsonLite = function (storagePath) {
    try {
        fs.statSync(path.resolve(storagePath));
    } catch (e) {
        try {
            fs.mkdirSync(path.resolve(storagePath), {recursive: true})
        } catch (ignored) {
            throw new Error('Bad Argument: path does not exists! check:' + storagePath);
        }
    }

    localStorage = createLocalStorage(path.resolve(storagePath));
    const mainHandler = {
        get(target, name, receiver) {
            try {
                let value = localStorage.getItem(name);
                if (typeof value === 'object') {
                    let nestedHandler = (arg) => ({
                        get(t, n) {
                            let path = arg ? arg + '.' + n : n;
                            let val = byString(value, path);

                            if (typeof val === "object") {
                                return new Proxy(val, nestedHandler(arg ? arg + '.' + n : n))
                            }

                            return val;
                        },
                        set(t, n, v) {
                            let obj = localStorage.getItem(name);
                            let path = arg ? arg + '.' + n : n;
                            if (path.indexOf('.') > -1) {
                                const sections = path.split('.');
                                let temp = obj;
                                for (let i = 0; i < sections.length - 1; i++) {
                                    let section = sections[i];
                                    temp = temp[section]
                                }
                                let lastSection = sections[sections.length - 1];
                                temp[lastSection] = v;
                            } else {
                                obj[n] = v;
                            }
                            localStorage.setItem(name, obj);
                        }
                    })
                    return new Proxy(value, nestedHandler());
                }
                return value;
            } catch (e) {
                console.log(e);
                return null;
            }

        },
        set(target, name, value, receiver) {
            localStorage.setItem(name, value);
            return true;
        }
    };

    return new Proxy({}, mainHandler);
};

module.exports = JsonLite;
