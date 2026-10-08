// age-friendly-database/ai/test/testEmbedding.js
// Check that the text model returns a number list.
//
// How calls move:
// testEmbedding -> createEmbedding -> createEmbeddings -> getExtractor.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//   vector / embedding: a list of numbers for the meaning of text.
//   hash: a text check code; changed text gets a different code.
//
// Functions:
//   testEmbedding - Run the sample text through the model and print a few numbers.
//
// Notes:
//   This prints model output; it does not check recommendation quality.

const {
  MODEL_NAME,
  createEmbedding,
} = require(
  '../embeddingService',
)

// Run the sample text through the model and print a few numbers.
// Example input: run this script
// Example result: prints embedding size 384 and its first five numbers; Promise gives no value.
async function testEmbedding() {
  console.log(
    `Loading model: ${MODEL_NAME}`,
  )

  const embedding =
    await createEmbedding(
      'I enjoy gentle dance and health activities.',
    )

  console.log(
    'Vector dimensions:',
    embedding.length,
  )

  console.log(
    'First five values:',
    embedding.slice(0, 5),
  )
}

testEmbedding().catch(
  (error) => {
    console.error(
      'Embedding test failed:',
      error,
    )

    process.exit(1)
  },
)
