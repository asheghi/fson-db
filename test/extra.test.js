const JSON_DB = require("../fson");

describe("extra test",() => {
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
