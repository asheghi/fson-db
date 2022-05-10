const JSON_DB = require("../fson");
const {join} = require("path");
const fs = require("fs");

const baseDir = '/tmp'
describe("Performance Test", () => {
  let clearFiles = () => {
    let path = join(baseDir, '.test-data');
    if (fs.existsSync(path)) {
      fs.rmSync(path, {recursive: true});
    }
  };

  beforeAll(clearFiles)
  beforeEach(clearFiles)
  afterEach(clearFiles)

  test('worse case scenario, writing and reading on 10_000 different keys!', async () => {
    let storagePath = join(baseDir,'.test-data','perf-1');
    const db = JSON_DB(storagePath,{maxWaitWrite:5000});
    const db2 = JSON_DB(storagePath);

    const start = new Date().getTime();
    db['item-0'] = 1;
    let count = 10_000;

    for (let i = 1; i < count; i++) {
      db['item-' + i] = db['item-' + (i - 1)] + 1;
    }

    expect(Object.keys(db).length).toBe(count);
    expect(Object.keys(db2).length).toBe(count);
    expect(db['item-' + (count - 1)]).toBe(count )
    expect(db2['item-' + (count - 1)]).toBe(count )
    const diff = new Date().getTime() - start;
    console.log('performance test took', diff+'ms');
  })

  test('performance test', async () => {
    const db = JSON_DB(join(baseDir,'.test-data2'),{maxWaitWrite:5000});
    const start = new Date().getTime();
    db.nested = {['item-0'] : 1};
    let count = 10_000;

    for (let i = 1; i < count; i++) {
      db.nested['item-' + i] = db.nested['item-' + (i - 1)] + 1;
    }

    const db2 = JSON_DB(join(baseDir,'.test-data2'));
    expect(Object.keys(db.nested).length).toBe(count);
    expect(db.nested['item-' + (count - 1)]).toBe(count )

    expect(Object.keys(db2.nested).length).toBe(count);
    expect(db2.nested['item-' + (count - 1)]).toBe(count )

    const diff = new Date().getTime() - start;
    console.log('nested performance test took', diff+'ms');
  })
})
