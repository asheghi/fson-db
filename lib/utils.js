module.exports.byString = function (obj, str) {
    if(obj === null){
        return null;
    }
    str = str.replace(/\[(\w+)\]/g, '.$1');
    str = str.replace(/^\./, '');
    let a = str.split('.');
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

module.exports.shallowEqual = function(object1, object2) {
    if (!object1 || !object2) {
        return false;
    }
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (let key of keys1) {
        if (object1[key] !== object2[key]) {
            return false;
        }
    }

    return true;
}
