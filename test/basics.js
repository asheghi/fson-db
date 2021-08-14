const JSON_DB = require('../');

const db = JSON_DB('.config');
const assert = require('assert');


//literals
db.name = 'john doe';
db.age = 24;
db.pi = 3.1415;
db.isActive = true;
db.date = new Date(1997, 1, 20);

assert.strictEqual(db.name, 'john doe');
assert.strictEqual(db.age, 24);
assert.strictEqual(db.pi, 3.1415);
assert.strictEqual(db.isActive, true);

//dates are stored as standard string for now
assert.strictEqual(new Date(db.date).valueOf(), new Date(1997, 1, 20).valueOf());

db.int = 2;
assert.strictEqual(2, db.int);

//json object
db.nested = {
    field: 'string',
}
assert.strictEqual('string', db.nested.field);

db.nested.field = 'changed';
assert.strictEqual('changed', db.nested.field);


assert.strictEqual(typeof db.undefinedField, 'undefined');

db.obj = {
    a: undefined,
}
assert.strictEqual(typeof db.obj.a, 'undefined');


db.null = null;
assert.strictEqual(db.null, null);
db.obj2 = {
    null: null
}
assert.strictEqual(db.obj2.null, null);

db.a = {
    b: {
        c: {
            d: 1
        },
    },
};

assert.strictEqual(1, db.a.b.c.d);
db.a.b.c.d = 2;
assert.strictEqual(2, db.a.b.c.d);


db.list = [1, 2, 3];
db.list.push(4, 5, 6);
assert.deepStrictEqual([1, 2, 3, 4, 5, 6], db.list);

db.list = db.list.filter(it => it % 2 === 0);

db.a = {
    b: {
        c: {
            d: [{id: 1,}, {id: 2}],
        }
    }
}

db.a.b.c.d.push({id: 3}, {id: 4})

assert.deepStrictEqual(db.a.b.c.d, [{id: 1}, {id: 2}, {id: 3}, {id: 4}])

assert.deepStrictEqual(db.a.b.c.d[0], {id: 1});

db.a.b.c.d[3] = {id: 5};

assert.deepStrictEqual(db.a.b.c.d[3],{id:5});

//todo db.a.b.c.d[3].id = 5
