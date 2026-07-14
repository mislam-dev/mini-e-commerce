module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Require a commit type
    'type-empty': [2, 'never'],

    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'chore',
        'docs',
        'style',
        'refactor',
        'test',
        'perf',
        'build',
        'ci',
        'revert',
      ],
    ],
  },
};
