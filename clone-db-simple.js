import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function cloneDatabase() {
  const targetConnectionString = process.env.MONGO_CONNECTION_STRING;
  const sourceConnectionString = process.env.MONGO_CONNECTION_STRING_TEST;

  if (!targetConnectionString || !sourceConnectionString) {
    console.log(targetConnectionString, sourceConnectionString);
    console.error('❌ Missing database connection strings in .env file');
    console.error(
      'Required: MONGO_CONNECTION_STRING and MONGO_CONNECTION_STRING_TEST',
    );
    process.exit(1);
  }

  console.log('🗄️  MongoDB Database Cloner');
  console.log('============================');

  let sourceConnection = null;
  let targetConnection = null;

  try {
    // Connect to source database
    console.log('📡 Connecting to source database...');
    sourceConnection = await mongoose
      .createConnection(sourceConnectionString)
      .asPromise();
    const sourceDbName = sourceConnection.db.databaseName;
    console.log(`✅ Connected to source: ${sourceDbName}`);

    // Connect to target database
    console.log('📡 Connecting to target database...');
    targetConnection = await mongoose
      .createConnection(targetConnectionString)
      .asPromise();
    const targetDbName = targetConnection.db.databaseName;
    console.log(`✅ Connected to target: ${targetDbName}`);

    console.log(`\n🔄 Starting clone: ${sourceDbName} → ${targetDbName}\n`);

    // Get all collections from source
    const collections = await sourceConnection.db.listCollections().toArray();
    const collectionNames = collections
      .map((col) => col.name)
      .filter((name) => !name.startsWith('system.'));

    console.log(
      `📋 Found ${collectionNames.length} collections: ${collectionNames.join(', ')}`,
    );

    let totalDocuments = 0;
    const results = {};

    // Clone each collection
    for (const collectionName of collectionNames) {
      console.log(`\n📦 Processing collection: ${collectionName}`);

      // Get source and target collections
      const sourceCollection = sourceConnection.db.collection(collectionName);
      const targetCollection = targetConnection.db.collection(collectionName);

      // Get all documents from source
      const documents = await sourceCollection.find({}).toArray();
      console.log(`   📄 Found ${documents.length} documents in source`);

      if (documents.length > 0) {
        // Clear target collection first
        const deleteResult = await targetCollection.deleteMany({});
        console.log(
          `   🗑️  Cleared ${deleteResult.deletedCount} existing documents from target`,
        );

        // Insert documents in batches for better performance
        const batchSize = 1000;
        let totalInserted = 0;

        for (let i = 0; i < documents.length; i += batchSize) {
          const batch = documents.slice(i, i + batchSize);
          try {
            const insertResult = await targetCollection.insertMany(batch, {
              ordered: false,
            });
            totalInserted += insertResult.insertedCount;

            // Show progress for large collections
            if (
              documents.length > batchSize &&
              (i + batchSize) % (batchSize * 5) === 0
            ) {
              console.log(
                `   ⏳ Progress: ${totalInserted}/${documents.length} documents...`,
              );
            }
          } catch (insertError) {
            console.log(`   ⚠️  Batch insert warning: ${insertError.message}`);
            // Try to insert individually for this batch
            for (const doc of batch) {
              try {
                await targetCollection.insertOne(doc);
                totalInserted++;
              } catch (docError) {
                console.log(
                  `   ❌ Failed to insert document: ${docError.message}`,
                );
              }
            }
          }
        }

        console.log(`   ✅ Successfully inserted ${totalInserted} documents`);
        totalDocuments += totalInserted;

        results[collectionName] = {
          source: documents.length,
          cloned: totalInserted,
        };

        // Copy indexes
        try {
          const indexes = await sourceCollection.listIndexes().toArray();
          const customIndexes = indexes.filter(
            (index) => index.name !== '_id_',
          );

          if (customIndexes.length > 0) {
            let copiedIndexes = 0;

            for (const index of customIndexes) {
              try {
                const { key, ...options } = index;
                // Remove MongoDB internal fields
                delete options.v;
                delete options.ns;

                await targetCollection.createIndex(key, options);
                copiedIndexes++;
              } catch (indexError) {
                console.log(
                  `   ⚠️  Could not copy index ${index.name}: ${indexError.message}`,
                );
              }
            }

            console.log(
              `   📑 Copied ${copiedIndexes}/${customIndexes.length} indexes`,
            );
          }
        } catch (indexError) {
          console.log(
            `   ⚠️  Could not process indexes: ${indexError.message}`,
          );
        }
      } else {
        console.log(`   ⚠️  No documents to clone`);
        results[collectionName] = { source: 0, cloned: 0 };
      }
    }

    // Final summary
    console.log(`\n🎉 Database cloning completed!`);
    console.log(`\n📊 Summary:`);
    console.log(`   📂 Source Database: ${sourceDbName}`);
    console.log(`   📂 Target Database: ${targetDbName}`);
    console.log(`   📄 Total Documents Cloned: ${totalDocuments}`);
    console.log(`   📋 Collections Processed: ${Object.keys(results).length}`);

    console.log(`\n📋 Collection Details:`);
    Object.entries(results).forEach(([collection, stats]) => {
      const status = stats.cloned === stats.source ? '✅' : '⚠️';
      console.log(
        `   ${status} ${collection}: ${stats.source} → ${stats.cloned}`,
      );
    });

    console.log(`\n🎯 Clone completed successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ Error during database cloning: ${error.message}`);
    console.error('Full error:', error);
    return false;
  } finally {
    // Close connections
    if (sourceConnection) {
      await sourceConnection.close();
      console.log('\n🔐 Source connection closed');
    }
    if (targetConnection) {
      await targetConnection.close();
      console.log('🔐 Target connection closed');
    }
  }
}

// Run the cloning process
async function main() {
  console.log('🚀 Starting database cloning process...\n');

  const success = await cloneDatabase();

  if (success) {
    console.log('\n✨ Database cloning process completed successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 Database cloning process failed!');
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { cloneDatabase };
