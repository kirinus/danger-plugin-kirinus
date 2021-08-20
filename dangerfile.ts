import kirinus from './src';
import { Severity } from './src/types';

(async function dangerReport() {
  await kirinus({
    prLint: {
      scoped: false,
    },
    jira: {
      severity: Severity.Disable,
    },
  });
})();
