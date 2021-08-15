const fs = require('fs');
const path = require('path');
const {getNested} = require("./lib/utils");

function createLocalStorage(storagePath) {
    return {
        getItem(name) {
            const jsonPath = path.join(storagePath, name);
            try {
                const string = fs.readFileSync(jsonPath, {encoding: 'utf8'});
                return JSON.parse(string);
            } catch (e) {
                return undefined;
            }
        },
        setItem(name, value) {
            const jsonPath = path.join(storagePath, name);
            fs.writeFileSync(jsonPath, JSON.stringify(value));
        }
    };
}

module.exports = function (storagePath) {
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
                /*if (Array.isArray(value)){
                    return value;
                }*/
                if (typeof value === 'object') {
                    if (value === null) {
                        return null;
                    }
                    let mainNp = undefined;
                    let nestedHandler = (arg, parentObject, np) => ({
                        get(t, n) {
                            if (Array.isArray(t)) {
                                if (n === 'push') {
                                    return (...pushArg) => {
                                        let path = arg;
                                        let prePushJsonValue = localStorage.getItem(name);
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
                                        localStorage.setItem(name, prePushJsonValue);
                                        return true;
                                    }
                                }

                                if(typeof t[n] !== 'object'){
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
                            let obj = localStorage.getItem(name);
                            let path = [...arg, n];
                            if (path.length) {
                                const sections = path;
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
                    let target = value;
                    mainNp = new Proxy(target, nestedHandler([], value, mainNp));
                    return mainNp;
                }
                return value;
            } catch (e) {
                console.error(e);
                return null;
            }

        },
        set(target, name, value, receiver) {
            localStorage.setItem(name, value);
            return true;
        },
    };

    return new Proxy({}, mainHandler);
};
