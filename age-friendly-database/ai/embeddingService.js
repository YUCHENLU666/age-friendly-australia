const MODEL_NAME =
  'onnx-community/all-MiniLM-L6-v2-ONNX'

let extractorPromise = null

async function getExtractor() {
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

async function createEmbedding(text) {
  const embeddings =
    await createEmbeddings([text])

  return embeddings[0]
}

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

module.exports = {
  MODEL_NAME,
  createEmbedding,
  createEmbeddings,
  createEmbeddingsInBatches,
}