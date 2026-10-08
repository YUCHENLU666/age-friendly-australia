// age-friendly-database/ai/test/testRecommendation.js
// Print AI results for three sample activities.
//
// How calls move:
// runTest -> recommendActivities -> print the returned ranks and scores.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//   vector / embedding: a list of numbers for the meaning of text.
//   hash: a text check code; changed text gets a different code.
//
// Functions:
//   runTest - Score the three sample activities and print names and scores.
//
// Fixed values and data:
//   preferences - Fixed sample interests and activity types for this test.
//   activities - Three sample activity records for this test.
//
// Notes:
//   The sample IDs may not match saved vectors. This script alone does not prove AI match quality.

const {
  recommendActivities,
} = require(
  '../recommendationService',
)

// Fixed sample interests and activity types for this test.
const preferences = {
  interests: [
    'Dance',
    'Health',
  ],

  activityTypes: [
    'Health & wellbeing',
  ],
}

// Three sample activity records for this test.
const activities = [
  {
    id: 1,
    event_name:
      "Over 60's Dance Classes",
    category_tags:
      'Dance Classes',
    description:
      'Gentle dance classes focusing on balance, mobility and wellbeing.',
  },
  {
    id: 2,
    event_name:
      'Beginner Computer Workshop',
    category_tags:
      'Technology',
    description:
      'Learn how to use computers, email and online services.',
  },
  {
    id: 3,
    event_name:
      'Local Gardening Group',
    category_tags:
      'Gardening',
    description:
      'Meet local gardeners and learn how to grow plants.',
  },
]

// Score the three sample activities and print names and scores.
// Example input: run this script with its built-in sample choices
// Example result: prints up to three ranked names and scores; Promise gives no value; sample IDs may have no
// saved vectors.
async function runTest() {
  const recommendations =
    await recommendActivities(
      preferences,
      activities,
      3,
    )

  console.table(
    recommendations.map(
      (
        recommendation,
        index,
      ) => ({
        rank: index + 1,

        activity:
          recommendation.activity
            .event_name,

        score:
          recommendation.score.toFixed(
            4,
          ),
      }),
    ),
  )
}

runTest().catch(
  (error) => {
    console.error(
      'Recommendation test failed:',
      error,
    )

    process.exit(1)
  },
)
