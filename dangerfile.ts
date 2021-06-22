import kirinus from 'danger-plugin-kirinus';

(async function dangerReport() {
  const commitlintConfig = {
    severity: 'warn',
  };
  await kirinus();
})();
