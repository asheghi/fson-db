const JSON_DB = require("../fson");
const {join} = require("path");
const fs = require("fs");

describe("extra test",() => {
  let clearFiles = () => {
    let path = join(__dirname,'.test-data');
    if (fs.existsSync(path)) {
      fs.rmSync(path,{recursive:true});
    }
  };

  afterEach(clearFiles)

  test('js obj reference',()=>{
    const db = JSON_DB('.test-data/js-obj-ref');

    db.one  = {
      val:'one',
    }
    db.two = db.one
    db.two.val = 'two'

    expect(db.one.val).toBe('one');
  })
})
