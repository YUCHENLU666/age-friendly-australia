// age-friendly-database/ai/embeddingService.js
// Use the ready-made MiniLM model to turn text into number lists.
//
// How calls move:
// createEmbedding -> createEmbeddings -> getExtractor -> mean pooling + normalisation; offline batches reuse the extractor.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//   vector / embedding: a list of numbers for the meaning of text.
//   hash: a text check code; changed text gets a different code.
//
// Functions:
//   getExtractor - Load the ready-made text model once and reuse it.
//   createEmbeddings - Turn each text into an embedding: a list of numbers that describes its meaning.
//   createEmbedding - Turn one text into one list of numbers for its meaning.
//   createEmbeddingsInBatches - Split texts into small groups, run the model on each group, and keep the input
//   order.
//
// Fixed values and data:
//   MODEL_NAME - Name of the ready-made MiniLM text model.
//
// Page values and kept data:
//   extractorPromise - Model load already running or finished; later calls use the same Promise.
//
// Notes:
//   The model is ready-made; this project uses it but does not train it.
//   A vector or embedding is a list of numbers for the meaning of text.
//   mean pooling joins token numbers into one text vector; normalize:true makes its length 1.
//   extractorPromise keeps model loading, not recommendation results. It is not reset on load failure.

// Name of the ready-made MiniLM text model.
const MODEL_NAME =
  'onnx-community/all-MiniLM-L6-v2-ONNX'

// Model load already running or finished; later calls use the same Promise.
let extractorPromise = null

// Load the ready-made text model once and reuse it.
// Example input: first call with no arguments
// Example result: Promise gives a model tool; later calls use the same saved Promise.
async function getExtractor() {
  // Load the model once; other calls wait for the same Promise.
  if (!extractorPromise) {
    extractorPromise = import(
      '@huggingface/transformers'
    ).then(({ pipeline }) =>
      pipeline(
        'feature-extraction',
        MODEL_NAME,
      ),
    )
  }

  return extractorPromise
}

// Turn each text into an embedding: a list of numbers that describes its meaning.
// Example input: ['Music', 'Walking']
// Example result: Promise gives two lists of numbers, each with 384 numbers; exact values come from the model.
async function createEmbeddings(texts) {
  const inputTexts =
    Array.isArray(texts)
      ? texts
      : [texts]

  if (inputTexts.length === 0) {
    return []
  }

  const extractor =
    await getExtractor()

  // Use mean pooling and normalize:true to build one length-1 vector per text.
  const output =
    await extractor(
      inputTexts,
      {
        pooling: 'mean',
        normalize: true,
      },
    )

  return output.tolist()
}

// Turn one text into one list of numbers for its meaning.
// Example input: 'Music'
// Example result: Promise gives one list with 384 numbers; exact values come from the model.
async function createEmbedding(text) {
  const embeddings =
    await createEmbeddings([text])

  return embeddings[0]
}

// Split texts into small groups, run the model on each group, and keep the input order.
// Example input: texts=['Music','Walking','Art'], batchSize=2
// Example result: Promise gives three number lists in the same order; model runs on groups of 2 and 1.
async function createEmbeddingsInBatches(
  texts,
  batchSize = 16,
) {
  const embeddings = []

  for (
    let index = 0;
    index < texts.length;
    index += batchSize
  ) {
    // Take one small group of texts for this model call.
    const batch =
      texts.slice(
        index,
        index + batchSize,
      )

    const batchEmbeddings =
      await createEmbeddings(batch)

    // Add the new vectors in the original text order.
    embeddings.push(
      ...batchEmbeddings,
    )

    console.log(
      `Embedded ${Math.min(
        index + batchSize,
        texts.length,
      )}/${texts.length}`,
    )
  }

  return embeddings
}

module.exports = {
  MODEL_NAME,
  createEmbedding,
  createEmbeddings,
  createEmbeddingsInBatches,
}