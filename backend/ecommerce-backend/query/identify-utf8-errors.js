const url = "mongodb://root:example@localhost:27017/test?authSource=admin"
const database = "test"
const collectionname = "reviews" // change this and run again to fix.
var options = {
  delete: true,
  backup: false,
  quiet: false,
  json: true,
}

var skips = { } // skip the first N items if this is too slow. object indexed by collection name.

for (var n = 5; n < process.argv.length; n++) {
  const arg = process.argv[n];
  if (arg == "--delete") {
    options.delete = true;
  } else if (arg == "--backup") {
    options.backup = true;
  } else if (arg == "--quiet") {
    options.quiet = true;
  }
}

const { MongoClient, BSON } = require('mongodb');
const fs = require('fs')
var count = 0;

var brokenids = [];
var recoverOffset = 0;
var brokendocuments = [];

function getBrokenDocumentId(rawbuffer) {
  var doc = BSON.deserialize(rawbuffer, {validation: {utf8: false}})
  return doc._id;
}

async function retrieve() {
  const client = new MongoClient(url, {raw: true});

  try {
    await client.connect();
    const db = client.db(database);
    const collection = db.collection(collectionname);
    var cursor = collection.find({});
    //if (skips[collectionname]) { cursor.skip(skips[collectionname]); } // skip documents we have already seen
    while (await cursor.hasNext()) {
      count++;
      if (!options.quiet && count % 100 == 0) { process.stderr.write(`total processed: ${count}\n`) }
      var buffer = await cursor.next();
      let doc;
      try {
        doc = BSON.deserialize(buffer, {validation: {utf8: true}});
      } catch (err) {
        if (!options.quiet) { process.stderr.write(`identified problem document at offset: ${count} ${err}\n`); }
        doc = BSON.deserialize(buffer, {validation: {utf8: false}});
        if (options.backup) { fs.writeFileSync(`recovered.${collectionname}.${recoverOffset++}.bson`, buffer); } // save file
        brokendocuments.push(doc);
        console.log(doc._id.toString());
        brokenids.push(doc._id);
      }
    }
  } catch (err) {
    if (!options.quiet) {
      process.stderr.write(`valid ones before error: ${count}\n`)
      process.stderr.write(`err: ${err}\n`)
    }
    return false;
  } finally {
    await client.close();
  }
  return true;
}

async function del(){
  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db(database);
    const collection = db.collection(collectionname);
    await collection.deleteMany({_id: {$in: brokenids}})
  } catch(err){
    process.stderr.write(`error encountered when deleting: ${err}\n`)
  } finally {
    await client.close();
  }
}

retrieve().then(() => {
  if (options.json && brokendocuments.length) { fs.writeFileSync('recovered.json', JSON.stringify(brokendocuments)); }
  if (options.delete) { del(); console.log("deleted") }
})
