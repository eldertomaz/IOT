const crypto = require('crypto');
buf = Buffer.alloc(10);
salt = crypto.randomFillSync(buf).toString('hex');
console.log(salt);

key1 = crypto.pbkdf2Sync('secret1', salt, 100000, 64, 'sha512');
key2 = crypto.pbkdf2Sync('secret1', salt, 100000, 64, 'sha512');

console.log(key1.toString('hex'));
console.log(key2.toString('hex'));
console.log(key1.toString('hex') == key1.toString('hex'));
