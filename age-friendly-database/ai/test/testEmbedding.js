const {
  MODEL_NAME,
  createEmbedding,
} = require(
  '../embeddingService',
)

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
