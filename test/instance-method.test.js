const JSON_DB = require("../fson");
const {join} = require("path");
const fs = require("fs");

const baseDir = '/tmp'
describe("Mongoose", () => {
  let clearFiles = () => {
    let path = join(baseDir, '.test-data');
    if (fs.existsSync(path)) {
      fs.rmSync(path, {recursive: true});
    }
  };

  beforeAll(clearFiles)
  beforeEach(clearFiles)
  afterEach(clearFiles)

  test('define method', function () {
    let storagePath = join(baseDir,'.test-data','Collection');
    const db = JSON_DB(storagePath);
    if (!db.posts) db.posts = [];
    const Post = db.posts;
    Post.push({
      'title':'first post',
    })
    Post.push({
      'title':'second post',
    })
    Post.push({
      'title':'third post',
    })

    db.posts.findOne = function () {
      console.log('instance method', this);
      const [first] = this;
      return first;
    };

    console.log(db.posts.findOne());
  });
});
