import kirinus from 'danger-plugin-kirinus';

(async function dangerReport() {
  await kirinus({
    prLint: {
      scoped: false,
    },
    jira: {
      severity: 'disabled',
    },
  });
})();
