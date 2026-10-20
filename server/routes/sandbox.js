import { Router } from 'express';
import { asyncHandler, HttpError, requireAuth } from './http.js';
import { CREDIT_COSTS, grantCredits, spendCredits } from '../credits.js';
import { LANGUAGES, runCode } from '../sandbox.js';

const router = Router();

router.get('/languages', requireAuth, (_req, res) => {
  res.json({
    languages: Object.entries(LANGUAGES).map(([id, spec]) => ({ id, label: spec.label })),
    sandboxEnabled: !(process.env.NODE_ENV === 'production' && process.env.SANDBOX_ALLOW !== 'true'),
  });
});

router.post(
  '/run',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { language, code } = req.body ?? {};
    if (!LANGUAGES[language]) throw new HttpError(400, 'Unsupported language.', 'VALIDATION');
    if (typeof code !== 'string' || !code.trim()) throw new HttpError(400, 'No code supplied.', 'VALIDATION');

    let credits = await spendCredits(req.user.id, CREDIT_COSTS.CODE_RUN, 'code_run', {
      language,
      bytes: code.length,
    });

    const result = await runCode({ language, code });

    if (!result.supported) {
      // A missing runtime is not the learner's fault: refund the charge.
      credits = await grantCredits(req.user.id, CREDIT_COSTS.CODE_RUN, 'sandbox_refund', { language });
      res.status(503).json({ ...result, credits, cost: 0 });
      return;
    }

    res.json({ ...result, credits, cost: CREDIT_COSTS.CODE_RUN });
  }),
);

export default router;
