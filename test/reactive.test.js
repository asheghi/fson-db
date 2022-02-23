const JSON_DB = require('../fson');
const {watch} = require('../fson');

const {join} = require("path");
const fs = require("fs");

describe('watch changes', () => {
  let clearFiles = () => {
    let path = join(__dirname,'.test-data');
    if (fs.existsSync(path)) {
      fs.rmSync(path,{recursive:true});
    }
  };

  beforeAll(clearFiles)
  beforeEach(clearFiles)
  afterEach(clearFiles)

  test('watch changes on db object', () => {
    const db = JSON_DB('.test-data/watch-main');
    const obj = {
      callback() {
      }
    }
    jest.spyOn(obj, 'callback');
    db.foo = 'before';
    watch(db, obj.callback);
    db.foo = 'after';
    expect(obj.callback).toBeCalled();
    expect(obj.callback).toBeCalledWith('foo', 'after','before')
  })

  test('watch nested changes on db object', () => {
    const db = JSON_DB('.test-data/watch-nested-changes');
    const obj = {
      callback() {
      }
    }
    jest.spyOn(obj, 'callback');
    db.a = {
      b:{
        c:'before'
      }
    }
    watch(db, obj.callback);
    db.a.b.c = 'after'
    expect(obj.callback).toBeCalled();
    expect(obj.callback).toBeCalledWith('a.b.c', 'after','before')
  })

  test('watch nested changes on nested objects', () => {
    const db = JSON_DB('.test-data/watch-nested-on-nested');
    const obj = {
      callback() {
      }
    }
    jest.spyOn(obj, 'callback');
    db.a = {
      b:{
        c:'before'
      }
    }
    watch(db.a, obj.callback);
    db.a.b.c = 'after'
    expect(obj.callback).toBeCalled();
    expect(obj.callback).toBeCalledWith('b.c', 'after','before')
  })

  test('watch very nested changes on very nested objects', () => {
    const db = JSON_DB('.test-data/watch-nested-on-nested-extra');
    const obj = {
      callback() {
      }
    }
    jest.spyOn(obj, 'callback');
    db.a = {
      b:{
        c:{
          d:{
            e:'before',
          }
        }
      }
    }
    watch(db.a.b.c, obj.callback);
    db.a.b.c.d.e = 'after'
    expect(obj.callback).toBeCalled();
    expect(obj.callback).toBeCalledWith('d.e', 'after','before')
  })
})
