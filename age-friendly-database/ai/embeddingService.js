// choose model
const MODEL_NAME =
  'onnx-community/all-MiniLM-L6-v2-ONNX'

// Save model loading results
let extractorPromise = null

// if extractorPromise is null, load the model
// load @huggingface/transformers, creat feature-extraction Pipeline, load MiniLM model, save the results in extractorPromise
async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = import(
      '@huggingface/transformers'
    ).then(({ pipeline }) =>
      // Extract semantic features from the text and convert them into numerical vectors
      pipeline(
        'feature-extraction',
        MODEL_NAME,
      ),
    )
  }

  return extractorPromise
}

async function createEmbeddings(texts) {
  //Convert a batch of text at a time
  const inputTexts =
    Array.isArray(texts)
      ? texts
      : [texts]

  // check the input is empty or not
  if (inputTexts.length === 0) {
    return []
  }

  // get model
  const extractor =
    await getExtractor()

  //Run the model, covert the word to a 384-vector
  const output =
    await extractor(
      inputTexts,
      {
        pooling: 'mean',
        normalize: true,
      },
    )

  //Convert to a standard JavaScript array.
  return output.tolist()
}

// Convert a text to 384-vector
//Generate a user preference vector.
async function createEmbedding(text) {
  const embeddings =
    await createEmbeddings([text])

  return embeddings[0]
}

//Generate activity vectors in batches
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
    const batch =
      texts.slice(
        index,
        index + batchSize,
      )

    const batchEmbeddings =
      await createEmbeddings(batch)

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

//Other backend files can then use the model name and the three conversion functions
module.exports = {
  MODEL_NAME,
  createEmbedding,
  createEmbeddings,
  createEmbeddingsInBatches,
}