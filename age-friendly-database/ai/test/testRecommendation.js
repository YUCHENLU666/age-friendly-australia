const {
  recommendActivities,
} = require(
  '../recommendationService',
)

const preferences = {
  interests: [
    'Dance',
    'Health',
  ],

  activityTypes: [
    'Health & wellbeing',
  ],
}

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
