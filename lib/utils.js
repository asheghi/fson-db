module.exports.getNested = function (obj, pathArray) {
    if(obj === null){
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
