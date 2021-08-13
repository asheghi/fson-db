const Fson = require('./../fson');

const it = Fson('.config');
const assert = require('assert');

it.int = 1;
assert.strictEqual(1, it.int);

it.int = 2;
assert.strictEqual(2, it.int);

it.nested = {
    field: 'string',
}
assert.strictEqual('string', it.nested.field);

it.nested.field = 'changed';
assert.strictEqual('changed', it.nested.field);


it.a = {
    b: {
        c: {
            d: 1
        },
    },
};

assert.strictEqual(1,it.a.b.c.d);

it.a.b.c.d = 2;
assert.strictEqual(2,it.a.b.c.d);





