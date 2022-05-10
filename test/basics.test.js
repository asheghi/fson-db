const JSON_DB = require('../fson');
const fs = require('fs')
const {join} = require('path');

const assert = require('assert');
describe('FSON Basic Features', function () {
  beforeEach(() => {
    let path = join(__dirname,'.test-data');
    if (fs.existsSync(path)) {
      fs.rmSync(path,{recursive:true});
    }
  })

  test('save and access literals', () => {
    const db = JSON_DB('.test-data/literals');
    db.name = 'john doe';
    db.age = 24;
    db.pi = 3.1415;
    db.isActive = true;

    assert.strictEqual(db.name, 'john doe');
    assert.strictEqual(db.age, 24);
    assert.strictEqual(db.pi, 3.1415);
    assert.strictEqual(db.isActive, true);

    db.int = 2;
    assert.strictEqual(2, db.int);

    const field = 'the_field';
    db[field] = 'value';

    assert.strictEqual(db[field], 'value');

    //read literals from storage
    const anotherDB = JSON_DB('.test-data/literals');
    assert.strictEqual(anotherDB.name, 'john doe');
    assert.strictEqual(anotherDB.age, 24);
    assert.strictEqual(anotherDB.pi, 3.1415);
    assert.strictEqual(anotherDB.isActive, true);

    assert.strictEqual(2, anotherDB.int);

    anotherDB[field] = 'value';
    assert.strictEqual(anotherDB[field], 'value');
  })

  test('date works fine!',()=>{
    const db = JSON_DB('.test-data/date');
    db.date = new Date(1997, 1, 20, 0, 0, 0, 0);
    expect(db.date).toStrictEqual(new Date(1997, 1, 20,0,0,0,0));

    //read from storage
    const db2 = JSON_DB('.test-data/date');
    expect(db2.date).toStrictEqual(new Date(1997, 1, 20,0,0,0,0));
  })

  test('js object', () => {
    const db = JSON_DB('.test-data/js-objects');

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
    expect(db.null).toBeFalsy()
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
    assert.equal(6, db.list[5]);

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

    assert.deepStrictEqual(db.a.b.c.d[3], {id: 5});

    db.foo = {
      'bar.baz': 1,
      bar: {
        baz: 2,
      }
    };

    assert.strictEqual(db.foo['bar.baz'], 1);
    assert.strictEqual(db.foo.bar.baz, 2);

    db.arr = [{id: 1}, {id: 2}, {id: 3}]

    assert.strictEqual(db.arr[0].id, 1);
    db.arr[0].id = 2
    assert.strictEqual(db.arr[0].id, 2);

  })

  test('js object keys', () => {
    const db = JSON_DB('.test-data/object-keys');

    db.obj = {
      one: 'the one',
      two: 'the two',
      three: 'the three',
    };
    assert.deepStrictEqual(Object.keys(db.obj), ['one', 'two', 'three']);

    db.obj.nested = {
      a: '',
      b: '',
      c: '',
    }
    assert.deepStrictEqual(Object.keys(db.obj.nested), ['a', 'b', 'c']);
  })

  test('delete', () => {
    const db = JSON_DB('.test-data/delete');
    db.obj = {};
    delete db.obj;
    expect(db.obj).toBeFalsy();

    //load from storage
    const db2 = JSON_DB('.test-data/delete');
    assert.equal(typeof db2.obj, 'undefined');
    expect(db2.obj).toBeFalsy();

    db.obj = {
      nested: {},
    };
    delete db.obj.nested;
    assert.equal(typeof db.obj.nested, 'undefined');

    //load from storage
    const db3 = JSON_DB('.test-data/delete');
    assert.equal(typeof db3.obj.nested, 'undefined');
  })
});
