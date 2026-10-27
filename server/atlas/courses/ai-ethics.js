/**
 * Machine learning and technology ethics.
 *
 * The ethics course deliberately ships in the same structure as the technical
 * ones: moral reasoning is a skill ladder, not a list of headlines.
 */

export const machineLearning = {
  slug: 'machine-learning',
  title: 'Machine Learning',
  discipline: 'Artificial Intelligence',
  level: 'Foundation → Advanced',
  icon: 'network',
  summary:
    'From features and loss functions to transformers — learn why models generalise, fail, and drift.',
  layers: [
    {
      layer: 1,
      title: 'Data, Features & the Learning Problem',
      tier: 'FOUNDATION',
      minutes: 18,
      objectives: [
        'Frame a task as supervised, unsupervised, or reinforcement learning',
        'Separate features from labels and explain the role of each',
        'Split data without leaking information',
        'Define generalisation in measurable terms',
      ],
      concepts: [
        {
          term: 'Feature',
          definition:
            'An input variable the model observes. Feature quality — relevance, scale, encoding — usually matters more than model choice.',
        },
        {
          term: 'Label',
          definition:
            'The target the model learns to predict in supervised learning. Noisy or biased labels cap achievable accuracy.',
        },
        {
          term: 'Train / validation / test split',
          definition:
            'Disjoint partitions used for fitting, tuning, and final evaluation. The test set is touched once, to avoid optimistic bias.',
        },
        {
          term: 'Generalisation',
          definition:
            'Performance on unseen data drawn from the same distribution. It is the only result that matters; training error alone is memorisation.',
        },
      ],
      intuition:
        'A model is a compressed guess about a relationship. Training fits that guess to examples; generalisation tests whether the compression captured the pattern rather than the noise. Every methodological rule — held-out data, cross-validation, no peeking — exists to keep that test honest.',
      worked: {
        problem: 'You predict apartment rents from size, rooms, and distance to transit. Identify features, label, and a leakage risk.',
        steps: [
          'Features: size, number of rooms, distance to transit.',
          'Label: monthly rent.',
          'Leakage risk: including a column such as "deposit", computed from rent.',
          'Split by building or time rather than randomly if listings repeat across rows.',
          'Report error on a held-out set never used for tuning.',
        ],
        answer: 'Supervised regression; guard against rent-derived columns and duplicate listings',
      },
      table: {
        caption: 'Learning paradigms',
        head: ['Paradigm', 'Signal', 'Typical task'],
        rows: [
          ['Supervised', 'Labelled examples', 'Classification, regression'],
          ['Unsupervised', 'No labels', 'Clustering, dimensionality reduction'],
          ['Self-supervised', 'Labels derived from data', 'Language modelling'],
          ['Reinforcement', 'Reward from environment', 'Control, game playing'],
        ],
      },
      diagram:
        'flowchart LR\n  D[Raw data] --> F[Feature engineering]\n  F --> S[Train / val / test split]\n  S --> M[Fit model]\n  M --> V[Validate and tune]\n  V --> T[Test once]\n  T --> G{Generalises?}\n  G -->|No| F\n  G -->|Yes| P[Deploy with monitoring]',
      pitfalls: [
        'Normalising using statistics computed on the full dataset before splitting.',
        'Evaluating repeatedly on the test set until it effectively becomes validation data.',
        'Assuming more features always help — irrelevant features add variance.',
      ],
      scenario: {
        q: 'Your model scores 99% on training data and 62% on test data. What is happening?',
        options: ['Overfitting', 'Underfitting', 'Data leakage', 'Perfect generalisation'],
        answer: 0,
        why: 'A large train-test gap means the model memorised training noise instead of learning the underlying pattern.',
      },
    },
    {
      layer: 2,
      title: 'Linear Models & Loss',
      tier: 'FOUNDATION',
      minutes: 22,
      objectives: [
        'Write a linear model and its loss function',
        'Derive a gradient descent update',
        'Explain learning rate effects',
        'Apply L1 and L2 regularisation',
      ],
      concepts: [
        {
          term: 'Linear regression',
          definition:
            'Predicts ŷ = w·x + b by minimising squared error. Its closed-form solution exists, but gradient methods scale better.',
        },
        {
          term: 'Loss function',
          definition:
            'A scalar measuring prediction error, such as mean squared error. Training minimises it; the choice encodes what you consider a mistake.',
        },
        {
          term: 'Gradient descent',
          definition:
            'Iteratively updates w ← w − η∇L(w). The learning rate η controls step size: too large diverges, too small crawls.',
        },
        {
          term: 'Regularisation',
          definition:
            'Penalising model complexity — L2 adds λ‖w‖², shrinking weights; L1 adds λ‖w‖₁, encouraging sparsity and feature selection.',
        },
      ],
      intuition:
        'The loss defines the landscape; the gradient is the slope at your feet; the learning rate is your stride. Everything else — momentum, Adam, schedulers — is a refinement of that walk. Regularisation is a prior: it says "prefer simpler explanations unless the data insists otherwise".',
      worked: {
        problem: 'For L(w) = (w − 3)², start at w = 0 with η = 0.1. Show two update steps.',
        steps: [
          'Gradient: dL/dw = 2(w − 3).',
          'At w = 0: gradient = −6, so w ← 0 − 0.1(−6) = 0.6.',
          'At w = 0.6: gradient = 2(−2.4) = −4.8, so w ← 0.6 + 0.48 = 1.08.',
          'The sequence approaches the minimum w = 3 without overshooting because η is small.',
        ],
        answer: 'w: 0 → 0.6 → 1.08, converging toward 3',
      },
      table: {
        caption: 'Loss functions and their behaviour',
        head: ['Loss', 'Formula', 'Sensitive to outliers'],
        rows: [
          ['MSE', '(1/n)Σ(y − ŷ)²', 'Yes, quadratic'],
          ['MAE', '(1/n)Σ|y − ŷ|', 'Less'],
          ['Huber', 'Quadratic near 0, linear far', 'Tunable'],
          ['Log loss', '−Σ[y log p + (1−y) log(1−p)]', 'Penalises confident errors'],
        ],
      },
      diagram:
        'flowchart TD\n  I[Initialise weights] --> P[Predict]\n  P --> L[Compute loss]\n  L --> G[Compute gradient]\n  G --> U["Update w ← w − η∇L"]\n  U --> C{Converged?}\n  C -->|No| P\n  C -->|Yes| E[Evaluate on validation]',
      pitfalls: [
        'Using a learning rate too large and seeing the loss oscillate or explode.',
        'Regularising the bias term along with the weights.',
        'Comparing MSE values across datasets with different scales.',
      ],
      scenario: {
        q: 'Training loss decreases, validation loss increases. What should you try first?',
        options: ['Increase regularisation or reduce model capacity', 'Train longer', 'Increase learning rate', 'Remove the validation set'],
        answer: 0,
        why: 'This is the classic overfitting signature; constraining the model or adding data addresses it, while training longer worsens it.',
      },
    },
    {
      layer: 3,
      title: 'Classification & Evaluation',
      tier: 'INTERMEDIATE',
      minutes: 25,
      objectives: [
        'Convert a score into a class with a threshold',
        'Compute precision, recall, and F1 from a confusion matrix',
        'Interpret ROC and precision-recall curves',
        'Choose a metric that matches the cost of errors',
      ],
      concepts: [
        {
          term: 'Logistic regression',
          definition:
            'Models P(y=1|x) = σ(w·x + b) with the sigmoid. It is a linear classifier whose outputs are calibrated probabilities.',
        },
        {
          term: 'Confusion matrix',
          definition:
            'Counts of true positives, false positives, false negatives, and true negatives. Every classification metric is derived from these four numbers.',
        },
        {
          term: 'Precision & recall',
          definition:
            'Precision = TP/(TP+FP) — of the flagged positives, how many were real. Recall = TP/(TP+FN) — of the real positives, how many were found.',
        },
        {
          term: 'AUC',
          definition:
            'Area under the ROC curve: the probability that a random positive scores above a random negative. Threshold-independent, but insensitive to class imbalance.',
        },
      ],
      intuition:
        'A classifier outputs a score; a threshold makes a decision, and the threshold encodes your error costs. Precision and recall pull in opposite directions, so "accuracy" can be misleading when classes are rare: 99% accuracy is trivial if 99% of cases are negative. Pick the metric before you look at results.',
      worked: {
        problem: 'A fraud model flags 200 transactions. 120 are fraud, 80 are not. There were 300 actual frauds. Compute precision and recall.',
        steps: [
          'TP = 120, FP = 80, FN = 300 − 120 = 180.',
          'Precision = 120 / (120 + 80) = 0.60.',
          'Recall = 120 / (120 + 180) = 0.40.',
          'F1 = 2 · (0.6 · 0.4) / (0.6 + 0.4) = 0.48.',
          'The model finds only 40% of fraud: lowering the threshold would raise recall at the cost of precision.',
        ],
        answer: 'precision 0.60, recall 0.40, F1 0.48',
      },
      table: {
        caption: 'Metric choice by cost profile',
        head: ['Situation', 'Prioritise', 'Why'],
        rows: [
          ['Missing a fraud is expensive', 'Recall', 'False negatives dominate cost'],
          ['Flagging a user is expensive', 'Precision', 'False positives erode trust'],
          ['Balanced costs, imbalanced classes', 'F1 or PR-AUC', 'Accuracy misleads'],
          ['Ranking, threshold-free', 'ROC-AUC', 'Measures separability'],
        ],
      },
      diagram:
        'flowchart LR\n  S[Model score] --> T[Choose threshold]\n  T --> C[Confusion matrix]\n  C --> P[Precision]\n  C --> R[Recall]\n  P --> F[F1]\n  R --> F\n  T --> V[Vary threshold]\n  V --> U[ROC / PR curve]\n  U --> A[AUC]',
      pitfalls: [
        'Reporting accuracy on a 1%-positive dataset and calling 99% excellent.',
        'Optimising the threshold on the test set.',
        'Using ROC-AUC when the positive class is rare and operational precision is what matters.',
      ],
      scenario: {
        q: 'A cancer screen must not miss cases. Which operating point is appropriate?',
        options: [
          'High recall, accepting more false positives',
          'High precision, accepting more false negatives',
          'Balanced F1 regardless of cost',
          'Whatever maximises accuracy',
        ],
        answer: 0,
        why: 'When a false negative is dangerous, the threshold should be lowered to catch more positives even at the cost of extra follow-up tests.',
      },
    },
    {
      layer: 4,
      title: 'Trees, Ensembles & Unsupervised Learning',
      tier: 'INTERMEDIATE',
      minutes: 28,
      objectives: [
        'Explain how a decision tree splits on impurity',
        'Compare bagging with boosting',
        'Cluster data with k-means and choose k',
        'Reduce dimensions with PCA',
      ],
      concepts: [
        {
          term: 'Gini impurity',
          definition:
            '1 − Σpᵢ² over class proportions in a node. Splits are chosen to maximise the impurity drop, giving axis-aligned decision boundaries.',
        },
        {
          term: 'Bagging',
          definition:
            'Train many trees on bootstrap samples and average them. Reduces variance; random forests add feature subsampling for decorrelation.',
        },
        {
          term: 'Boosting',
          definition:
            'Sequentially fit weak learners to the residual errors of the current ensemble. Reduces bias, but must be regularised against overfitting.',
        },
        {
          term: 'k-means',
          definition:
            'Alternates assigning points to the nearest centroid and recomputing centroids. Minimises within-cluster variance; assumes roughly spherical, equal-variance clusters.',
        },
      ],
      intuition:
        'Trees are interpretable but unstable — a small data change can redraw the splits. Ensembles turn that weakness into strength: averaging decorrelated trees cancels variance, while boosting deliberately targets what the ensemble still gets wrong. Unsupervised methods have no ground truth, so validation is qualitative and domain-driven.',
      worked: {
        problem: 'A node has 8 positives and 2 negatives. Compute its Gini impurity.',
        steps: [
          'Proportions: p₁ = 0.8, p₂ = 0.2.',
          'Gini = 1 − (0.8² + 0.2²).',
          '= 1 − (0.64 + 0.04) = 0.32.',
          'A perfect split would reach 0; a 50/50 node would be 0.5.',
        ],
        answer: '0.32',
      },
      table: {
        caption: 'Ensemble strategies',
        head: ['Method', 'Reduces', 'Mechanism'],
        rows: [
          ['Random forest', 'Variance', 'Bagging + feature subsampling'],
          ['Gradient boosting', 'Bias', 'Sequential residual fitting'],
          ['Stacking', 'Both (sometimes)', 'Meta-model over base predictions'],
          ['Isolation forest', '—', 'Anomaly detection via random splits'],
        ],
      },
      diagram:
        'flowchart TD\n  D[Dataset] --> T{Supervised?}\n  T -->|Yes| E{Error profile?}\n  E -->|High variance| B[Bagging / random forest]\n  E -->|High bias| G[Boosting]\n  T -->|No| U{Goal?}\n  U -->|Grouping| K[k-means / DBSCAN]\n  U -->|Compression| P[PCA / t-SNE]',
      pitfalls: [
        'Choosing k for k-means without checking cluster stability or domain meaning.',
        'Letting a single deep tree overfit without pruning or depth limits.',
        'Applying PCA before scaling features, so the largest-variance unit dominates.',
      ],
      scenario: {
        q: 'Your random forest has high variance across folds and individual trees are very deep. Best fix?',
        options: ['Limit depth and increase the number of trees', 'Switch to a single tree', 'Remove cross-validation', 'Increase learning rate'],
        answer: 0,
        why: 'Constraining depth tames individual tree variance, and averaging more decorrelated trees further stabilises predictions.',
      },
    },
    {
      layer: 5,
      title: 'Deep Learning, Transformers & Deployment',
      tier: 'ADVANCED',
      minutes: 32,
      objectives: [
        'Explain backpropagation as the chain rule on a graph',
        'Describe attention and why transformers scale',
        'Distinguish pretraining from fine-tuning',
        'Diagnose distribution shift and monitor a deployed model',
      ],
      concepts: [
        {
          term: 'Backpropagation',
          definition:
            'Reverse-mode automatic differentiation over the computation graph: gradients of the loss with respect to every parameter, computed in one backward pass.',
        },
        {
          term: 'Attention',
          definition:
            'Each token forms a query, key, and value; weights are softmax(QKᵀ/√d) applied to values. It lets every position integrate information from every other position.',
        },
        {
          term: 'Embedding',
          definition:
            'A learned dense vector representing a token, item, or user, positioned so that semantic similarity becomes geometric proximity.',
        },
        {
          term: 'Distribution shift',
          definition:
            'Deployment data differs from training data — covariate shift, label shift, or concept drift — silently degrading accuracy without any code change.',
        },
      ],
      intuition:
        'Deep networks are function compositions, and backprop is just the chain rule applied efficiently from the output backwards. Attention replaced recurrence because it parallelises over sequence length and lets distant tokens interact in one step. Deployment is where machine learning becomes engineering: a model is a hypothesis about a distribution, and distributions move.',
      worked: {
        problem: 'A deployed churn model drops from 0.88 to 0.71 AUC two months after launch. Outline a diagnosis.',
        steps: [
          'Compare input distributions: check feature drift with PSI or KS tests.',
          'Verify the label pipeline has not changed (late-arriving labels can fake a drop).',
          'Segment performance by cohort to find where the degradation concentrates.',
          'Check whether a competing product launch changed behaviour (concept drift).',
          'Decide: retrain on recent data, add the new signal as a feature, or recalibrate thresholds.',
        ],
        answer: 'Measure drift first, then segment, then retrain or recalibrate — never assume it is a bug',
      },
      table: {
        caption: 'Architecture families',
        head: ['Family', 'Inductive bias', 'Strong at'],
        rows: [
          ['CNN', 'Local translation equivariance', 'Images, signals'],
          ['RNN / LSTM', 'Sequential recurrence', 'Streaming sequences'],
          ['Transformer', 'Global attention, order via encoding', 'Language, long-range structure'],
          ['GNN', 'Relational message passing', 'Molecules, social graphs'],
        ],
      },
      diagram:
        'flowchart LR\n  X[Input tokens] --> E[Embeddings + position]\n  E --> A["Self-attention: Q K V"]\n  A --> N[Feed-forward + norm]\n  N --> L[Stack N layers]\n  L --> H[Task head]\n  H --> L2[Loss]\n  L2 -->|backprop| E',
      pitfalls: [
        'Fine-tuning on a tiny dataset with a high learning rate, destroying pretrained representations.',
        'Evaluating a deployed model only on the original test set, missing drift.',
        'Treating attention weights as a faithful explanation of model reasoning.',
      ],
      scenario: {
        q: 'Why does attention scale better than recurrence during training?',
        options: [
          'All positions are processed in parallel instead of sequentially',
          'Attention uses fewer parameters',
          'It removes the need for a loss function',
          'It eliminates the need for positional information',
        ],
        answer: 0,
        why: 'Self-attention computes all pairwise interactions as one matrix operation, so GPUs stay busy across the whole sequence; recurrence is inherently sequential.',
      },
    },
  ],
};

export const techEthics = {
  slug: 'tech-ethics',
  title: 'Tech Ethics',
  discipline: 'Humanities',
  level: 'Foundation → Advanced',
  icon: 'scales',
  summary:
    'Moral reasoning, privacy, fairness, accountability, and frontier risk — practised as engineering judgement, not opinion.',
  layers: [
    {
      layer: 1,
      title: 'Moral Frameworks for Engineers',
      tier: 'FOUNDATION',
      minutes: 18,
      objectives: [
        'Apply consequentialist, deontological, and virtue reasoning to a design decision',
        'Identify stakeholders and their conflicting interests',
        'Distinguish a moral claim from a preference',
        'Use a structured ethical decision procedure',
      ],
      concepts: [
        {
          term: 'Consequentialism',
          definition:
            'Judges actions by outcomes: choose the option with the best overall consequences, often measured as total welfare.',
        },
        {
          term: 'Deontology',
          definition:
            'Judges actions by duties and rules regardless of outcome — for example, never deceive users, even when it would increase engagement.',
        },
        {
          term: 'Virtue ethics',
          definition:
            'Asks what a person of good character would do: honesty, care, practical wisdom. It focuses on the agent rather than the act.',
        },
        {
          term: 'Stakeholder analysis',
          definition:
            'Enumerating everyone affected by a decision — users, non-users, employees, communities — and mapping who bears risk versus who captures benefit.',
        },
      ],
      intuition:
        'Frameworks are not competing answers; they are different lenses that reveal different blind spots. Consequentialism asks who is helped and harmed, deontology asks what you must not do, virtue asks who you become while shipping. Sound engineering judgement uses at least two lenses before committing.',
      worked: {
        problem: 'A dark pattern increases sign-ups by 12%. Analyse it with two frameworks.',
        steps: [
          'Consequentialist: short-term sign-ups rise, but trust loss and churn may outweigh the gain; include support cost and reputational risk.',
          'Deontological: if the design relies on confusing the user, it violates the duty of informed consent regardless of the metric.',
          'Virtue: would you be comfortable explaining the design to the affected user?',
          'Stakeholder check: the company captures the metric; the user bears the cost of an unwanted subscription.',
          'Conclusion: reject the pattern, or redesign so consent is genuine.',
        ],
        answer: 'The metric gain does not survive either lens; the design should not ship',
      },
      table: {
        caption: 'What each lens optimises',
        head: ['Framework', 'Question', 'Typical blind spot'],
        rows: [
          ['Consequentialist', 'What happens?', 'Distant or diffuse harms'],
          ['Deontological', 'What am I permitted to do?', 'Rigidity in hard trade-offs'],
          ['Virtue', 'What would a good engineer do?', 'Vagueness under pressure'],
          ['Stakeholder', 'Who is affected and how?', 'Power asymmetry not addressed'],
        ],
      },
      diagram:
        'flowchart TD\n  P[Decision] --> C[Consequences?]\n  P --> D[Duties and rights?]\n  P --> V[Character and care?]\n  P --> S[Who is affected?]\n  C --> J[Weigh and justify]\n  D --> J\n  V --> J\n  S --> J\n  J --> R{Justifiable to those affected?}\n  R -->|No| X[Redesign or refuse]\n  R -->|Yes| Y[Document reasoning]',
      pitfalls: [
        'Treating ethics as purely subjective and therefore skippable.',
        'Counting only measurable stakeholders and ignoring those without a voice.',
        'Using one framework to rationalise a decision already made for commercial reasons.',
      ],
      scenario: {
        q: 'A team ships a recommendation model without an opt-out, arguing users can just ignore it. Which lens most directly challenges this?',
        options: [
          'Deontology, because it removes a user\'s ability to choose',
          'Consequentialism, because recommendations are popular',
          'Virtue ethics, because engineering is hard',
          'None — no harm is measurable',
        ],
        answer: 0,
        why: 'The core objection is about autonomy and consent, which is a duty-based concern; utility arguments for engagement do not answer it.',
      },
    },
    {
      layer: 2,
      title: 'Privacy & Data Governance',
      tier: 'FOUNDATION',
      minutes: 20,
      objectives: [
        'Classify data by sensitivity and purpose',
        'Apply data minimisation and purpose limitation',
        'Distinguish anonymisation from pseudonymisation',
        'Write a lawful basis summary for a feature',
      ],
      concepts: [
        {
          term: 'Personally identifiable information (PII)',
          definition:
            'Data that can identify, or be linked to, an individual — directly (name, email) or indirectly (device id, precise location).',
        },
        {
          term: 'Data minimisation',
          definition:
            'Collect only what the stated purpose requires, for only as long as required. It reduces breach impact and legal exposure simultaneously.',
        },
        {
          term: 'Anonymisation vs pseudonymisation',
          definition:
            'Pseudonymised data still allows re-identification with extra information; anonymised data cannot be re-identified by reasonable means and falls outside most consent regimes.',
        },
        {
          term: 'Retention policy',
          definition:
            'Rules defining how long each data class is kept and what destroys it. Absent deletion is a liability, not a neutral default.',
        },
      ],
      intuition:
        'Privacy is an engineering property, not a legal afterthought. The cheapest way to protect sensitive data is never to collect it. When collection is necessary, separate identity from behaviour, scope the purpose, and set an expiry — because the breach you prevent is worth more than the compliance checkbox you earn.',
      worked: {
        problem: 'A product team wants device location every 30 seconds to improve delivery estimates. Apply data minimisation.',
        steps: [
          'State the purpose precisely: estimate arrival windows while an order is active.',
          'Reduce granularity: city-level or geohash precision rather than exact coordinates.',
          'Reduce frequency: poll on order state changes rather than every 30 seconds.',
          'Reduce lifetime: delete raw fixes after the order completes, keep aggregates.',
          'Result: the purpose is served with a fraction of the exposure.',
        ],
        answer: 'Coarser precision, event-driven collection, short retention, aggregate only',
      },
      table: {
        caption: 'Handling by data class',
        head: ['Class', 'Examples', 'Default handling'],
        rows: [
          ['Direct identifiers', 'Name, email, phone', 'Encrypt at rest, restrict access'],
          ['Quasi-identifiers', 'Zip, birth date, gender', 'Generalise before analysis'],
          ['Sensitive attributes', 'Health, biometrics, ethnicity', 'Explicit consent, strict purpose'],
          ['Derived signals', 'Inferred interests, risk scores', 'Explainable, contestable, reviewable'],
        ],
      },
      diagram:
        'flowchart LR\n  C[Collect] --> P{Purpose stated?}\n  P -->|No| S[Stop: redesign]\n  P -->|Yes| M[Minimise fields]\n  M --> R[Set retention]\n  R --> A{Access needed?}\n  A -->|Yes| L[Log and scope]\n  A -->|No| D[Delete]\n  L --> X[Delete at expiry]',
      pitfalls: [
        'Calling hashed identifiers "anonymous" when the mapping table still exists.',
        'Retaining raw logs indefinitely "for debugging" without an expiry.',
        'Treating consent as a one-time click rather than an ongoing, revocable basis.',
      ],
      scenario: {
        q: 'Hashing user emails with an unsalted function still risks what?',
        options: [
          'Re-identification through rainbow tables or correlation with other datasets',
          'Nothing — hashing is always anonymisation',
          'Slower queries',
          'Loss of compression',
        ],
        answer: 0,
        why: 'Unsalted hashes of low-entropy values like emails are reversible by enumeration, and the hash itself is a stable join key.',
      },
    },
    {
      layer: 3,
      title: 'Bias, Fairness & Harm',
      tier: 'INTERMEDIATE',
      minutes: 24,
      objectives: [
        'Trace how historical bias becomes model bias',
        'Distinguish proxy variables from protected attributes',
        'Compare fairness definitions and explain why they conflict',
        'Design a harm reduction and red-teaming loop',
      ],
      concepts: [
        {
          term: 'Proxy variable',
          definition:
            'A feature correlated with a protected attribute — postcode with ethnicity, or name with gender — carrying discrimination even when the protected attribute is excluded.',
        },
        {
          term: 'Disparate impact',
          definition:
            'A neutral-seeming policy producing substantially different outcomes across groups. Intent is irrelevant to the measurement.',
        },
        {
          term: 'Feedback loop',
          definition:
            'Predictions shape future data. Policing deployed to a neighbourhood generates arrests there, which "confirms" the original prediction.',
        },
        {
          term: 'Fairness impossibility',
          definition:
            'Demographic parity, equalised odds, and calibration generally cannot hold simultaneously when base rates differ; the choice is a values decision.',
        },
      ],
      intuition:
        'A model learns the world as recorded, including its inequities. Removing a protected attribute does not remove the signal — correlated features reconstruct it. Because fairness metrics conflict mathematically, "fair" must be defined explicitly, with the harm model stated, before evaluation.',
      worked: {
        problem: 'A hiring model excludes gender but uses "years since graduation" and "leadership in a fraternity". Analyse.',
        steps: [
          'Postcode-like proxies remain: graduation timing correlates with caregiving gaps, often gendered.',
          'Fraternity membership is a gendered social proxy with near-zero job relevance.',
          'Test for disparate impact by measuring selection rate ratios across groups.',
          'Remove or justify each feature with job-relatedness evidence.',
          'Audit outcomes, not just inputs, and document the chosen fairness definition.',
        ],
        answer: 'Inputs are proxies, not neutral: measure impact and prune unjustified features',
      },
      table: {
        caption: 'Fairness definitions in tension',
        head: ['Definition', 'Guarantee', 'Tension'],
        rows: [
          ['Demographic parity', 'Equal positive rates', 'Ignores differing base rates'],
          ['Equalised odds', 'Equal TPR and FPR', 'Requires group-aware thresholds'],
          ['Calibration', 'Scores mean the same per group', 'Can coexist with unequal error costs'],
          ['Individual fairness', 'Similar people treated similarly', 'Depends on a similarity metric'],
        ],
      },
      diagram:
        'flowchart TD\n  H[Historical data] --> B[Encoded bias]\n  B --> M[Model learns pattern]\n  M --> D[Deployment]\n  D --> O[Outcomes by group]\n  O --> F[Feedback into data]\n  F --> H\n  O --> A{Audit}\n  A -->|Disparity| R[Remediate: data, features, thresholds]\n  R --> M',
      pitfalls: [
        'Believing that dropping the protected column makes a model fair.',
        'Optimising one fairness metric and silently degrading another.',
        'Auditing only aggregate accuracy instead of per-group error rates.',
      ],
      scenario: {
        q: 'A model is equally accurate for two groups but approves group A at twice the rate because base rates differ. Which fairness claim holds?',
        options: [
          'Calibration may hold while demographic parity fails',
          'Demographic parity holds',
          'Both parity and calibration hold',
          'No fairness statement can be made',
        ],
        answer: 0,
        why: 'Equal accuracy and calibration are compatible with different approval rates when base rates differ; that tension is exactly the impossibility result.',
      },
    },
    {
      layer: 4,
      title: 'Accountability, Transparency & IP',
      tier: 'INTERMEDIATE',
      minutes: 26,
      objectives: [
        'Distinguish explainability from interpretability',
        'Design an audit trail sufficient for post-hoc review',
        'Apply licence obligations to dependencies and models',
        'Define a responsible disclosure and whistleblowing path',
      ],
      concepts: [
        {
          term: 'Interpretability vs explainability',
          definition:
            'Interpretable models are understandable by construction (linear, shallow trees); explainability approximates reasons for complex models after the fact.',
        },
        {
          term: 'Audit trail',
          definition:
            'Immutable records of decisions, inputs, model versions, and operator actions, sufficient to reconstruct why an outcome occurred.',
        },
        {
          term: 'Model licence',
          definition:
            'The terms governing use of weights and architecture — permissive, copyleft, or restricted to research. They are distinct from the code licence.',
        },
        {
          term: 'Responsible disclosure',
          definition:
            'A defined channel and timeline for reporting vulnerabilities so they can be fixed before public detail, with legal protection for good-faith reporters.',
        },
      ],
      intuition:
        'Accountability means a named human can answer for a system\'s behaviour. That requires records, versioning, and documented decision boundaries. Transparency is not publishing source code; it is giving affected people a meaningful account of the decision and a route to contest it.',
      worked: {
        problem: 'A credit model denies an applicant. What must the system be able to produce on request?',
        steps: [
          'The decision and timestamp, plus the model version and threshold in force.',
          'The principal factors contributing to the score, in plain language.',
          'The data sources used and their freshness.',
          'The appeal route, with a human reviewer empowered to override.',
          'Retention of these records for the regulatory period.',
        ],
        answer: 'Decision, version, factors, data provenance, appeal path, and retention',
      },
      table: {
        caption: 'Transparency artefacts',
        head: ['Artefact', 'Answers', 'Audience'],
        rows: [
          ['Model card', 'What it does, limits, metrics', 'Internal and external reviewers'],
          ['Data sheet', 'Provenance, consent, known gaps', 'Legal, research, audit'],
          ['Decision log', 'What happened for this case', 'Support, regulators, appeals'],
          ['Incident postmortem', 'What failed and what changed', 'Engineering, leadership'],
        ],
      },
      diagram:
        'flowchart LR\n  D[Decision] --> L[Log inputs, version, factors]\n  L --> E[Explain to affected person]\n  E --> A[Appeal channel]\n  A --> H[Human review]\n  H --> O{Override?}\n  O -->|Yes| F[Fix data or rule]\n  O -->|No| C[Close with reason]\n  F --> M[Model or process update]',
      pitfalls: [
        'Offering feature importances as if they were causal explanations for an individual decision.',
        'Shipping model weights under a research-only licence in a commercial product.',
        'Logging predictions without model versions, making incidents impossible to reconstruct.',
      ],
      scenario: {
        q: 'Why is a versioned model registry essential for accountability?',
        options: [
          'It lets you reconstruct which model produced a past decision',
          'It improves accuracy automatically',
          'It replaces the need for an audit log',
          'It guarantees regulatory compliance',
        ],
        answer: 0,
        why: 'Without version pinning you cannot reproduce or explain historical outcomes, which undermines appeals and incident review.',
      },
    },
    {
      layer: 5,
      title: 'Frontier Risk & Governance',
      tier: 'ADVANCED',
      minutes: 30,
      objectives: [
        'Distinguish dual-use capability from misuse risk',
        'Reason about alignment and specification gaming',
        'Map regulatory approaches and their trade-offs',
        'Design a staged deployment with capability evaluations',
      ],
      concepts: [
        {
          term: 'Dual-use capability',
          definition:
            'A capability with clear beneficial uses and plausible catastrophic misuse, such as synthesis planning or cyber tooling. Governance must preserve benefit while limiting amplification.',
        },
        {
          term: 'Specification gaming',
          definition:
            'Optimising the literal objective rather than the intended one — a cleaning agent that hides dirt, a recommender that maximises clicks with outrage.',
        },
        {
          term: 'Precautionary principle',
          definition:
            'When harm is potentially severe and uncertain, act to reduce risk before full evidence arrives, shifting the burden of proof onto deployers.',
        },
        {
          term: 'Staged deployment',
          definition:
            'Releasing capability in widening circles gated by evaluations, monitoring, and rollback plans, rather than a single global launch.',
        },
      ],
      intuition:
        'Frontier risk is a governance problem as much as a technical one: the people best placed to measure a capability are often the ones incentivised to deploy it. Durable safeguards therefore combine independent evaluation, external audit, and the ability to reverse a deployment — not just an internal promise.',
      worked: {
        problem: 'Design a staged release for an assistant with improved cyber-reasoning.',
        steps: [
          'Define capability thresholds and evaluation suites before training completes.',
          'Run pre-deployment red-teaming with external experts on uplift for attack tasks.',
          'Release to a limited cohort with logging, abuse detection, and rate limits.',
          'Gate wider access on measured misuse signals and independent review.',
          'Pre-commit to rollback triggers and publish an incident process.',
        ],
        answer: 'Threshold-defined evals → external red team → limited cohort → gated expansion → rollback triggers',
      },
      table: {
        caption: 'Governance instruments',
        head: ['Instrument', 'Strength', 'Weakness'],
        rows: [
          ['Internal review board', 'Fast, context-aware', 'Conflict of interest'],
          ['External audit', 'Independent', 'Slow, information asymmetry'],
          ['Regulation', 'Enforceable', 'Lags capability'],
          ['Standards and certification', 'Flexible, comparable', 'Voluntary adoption'],
        ],
      },
      diagram:
        'flowchart TD\n  C[Capability] --> E[Evaluate thresholds]\n  E --> R{Risk acceptable?}\n  R -->|No| X[Hold or restrict]\n  R -->|Yes| P[Pilot cohort]\n  P --> M[Monitor misuse signals]\n  M --> G{Gates met?}\n  G -->|Yes| W[Widen release]\n  G -->|No| B[Rollback]\n  W --> A[Independent audit]',
      pitfalls: [
        'Publishing capability evaluations without a plan to act on them.',
        'Treating a policy document as a control when no one can verify compliance.',
        'Assuming misuse requires sophistication when simple automation scales harm.',
      ],
      scenario: {
        q: 'A team measures a dangerous capability internally and finds it below threshold. What is the governance gap?',
        options: [
          'Self-assessment without independent verification or a binding action trigger',
          'The threshold was measured at all',
          'Nothing — internal measurement is sufficient',
          'The capability should be published in full',
        ],
        answer: 0,
        why: 'Internal measurement is necessary but not sufficient: without external verification and a pre-committed response, the evaluation cannot constrain deployment.',
      },
    },
  ],
};
