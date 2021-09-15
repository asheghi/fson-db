fson-db
====

Super Simple Database for Node.js and Browser

`fson-db` stores data with `json` format in localStorage for browsers and fs for node-js.

the following apis are supported, full js object apis support is in progress

Example Usage:

```javascript
//browser
import Fson from 'fson-db';

//Node.js
const Fson = require('fson-db');

//specify a directory path
const dbPath = './config';

//db is a js object! but any changes to in will be persistent!
//dbPath is only required for Node.js
const db = Fson(dbPath); //db must be a constant!

//save any type of literals
db.name = 'john doe';
db.age = 24;
db.pi = 3.1415;
db.isActive = true;
db.date = new Date();

//fetch literals
console.log(db.name) // john doe
console.log(db.age) //  24
console.log(db.pi) //  3.1415
console.log(db.isActive) //  true
console.log(db.date) //  "1997-02-19T20:30:00.000Z"


//save objects!
db.object = {
    foo: 'bar',
}

//fetch objest and nested fields
console.log(db.object); // { foo:"bar" }
console.log(db.object.foo); // bar

//modify nested objects
db.object.foo = 'rab';
console.log(db.object.foo); // rab


//save arrays!
db.numbers = [1, 2, 3, 4, 5, 6];

//modify arrays!
db.numbers = db.numbers.filter(i => i % 2 == 0);
console.log(db.numbers); // [ 2, 4, 6 ]

//push to arrays
db.numbers.push(8, 10, 12);
console.log(db.numbers); // [ 2, 4, 6, 8, 9, 10 ]

//save array of objects
db.users = [{id: 1}, {id: 2}]
console.log(db.users[0].id); // 1
console.log(db.users.length); // 2

//modify with indexes!
db.users[1] = {id: 3}
console.log(db.users[1].id); // 3
```
Loop through entries
```javascript
//list entries with Object.keys
db.obj = {
    one:'the_one',
    two:'the_two',
    three:'the_three',
};
console.log(Object.keys(db.obj)) // ['one', 'two', 'three']

//loop through object keys
for(const key of db.obj){
    const value = db.obj[key];
    // ...
}

for (const [key, value] of Object.entries(db.obj)) {
    console.log(`${key}: ${value}`);
}


//the above example also works for nested objects
```

Delete Operator
```javascript
db.obj = {};
delete db.obj;
console.log(typeof db.obj) // 'undefined'

//nested objects!
db.obj = {
    nested:{},
};
delete db.obj.nested;
console.log(typeof db.obj.nested) // 'undefined'
```


Note: high performance is not a priority for now, everything is synchronous, so use `db` inside `async` functions
