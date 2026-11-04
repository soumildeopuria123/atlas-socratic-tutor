/**
 * Mathematics catalogue.
 *
 * Every layer follows the same contract so Atlas can teach any subject with one
 * engine: objectives -> concepts -> intuition -> worked example -> reference
 * table -> structural diagram -> pitfalls -> applied checkpoint.
 *
 * Layer 1 is always the absolute foundation. Nothing here assumes prior layers.
 */

export const trigonometry = {
  slug: 'trigonometry',
  title: 'Trigonometry',
  discipline: 'Mathematics',
  level: 'Foundation → Advanced',
  icon: 'triangle',
  summary:
    'From right-triangle ratios to the unit circle, identities, and the calculus that harmonises them. Built for learners who have never met sine before.',
  layers: [
    {
      layer: 1,
      title: 'Geometric Ratios & Right Triangles',
      tier: 'FOUNDATION',
      minutes: 18,
      objectives: [
        'Name the three sides of a right triangle relative to a chosen angle',
        'Compute sine, cosine, and tangent as pure side ratios',
        'Use SOH-CAH-TOA without memorising numbers',
        'Recognise why the ratios do not depend on triangle size',
      ],
      concepts: [
        {
          term: 'Sine (sin θ)',
          definition:
            'The ratio of the side opposite angle θ to the hypotenuse in a right triangle: sin θ = opposite / hypotenuse.',
        },
        {
          term: 'Cosine (cos θ)',
          definition:
            'The ratio of the side adjacent to angle θ (the leg touching it, not the hypotenuse) to the hypotenuse: cos θ = adjacent / hypotenuse.',
        },
        {
          term: 'Tangent (tan θ)',
          definition:
            'The ratio of the opposite leg to the adjacent leg: tan θ = opposite / adjacent, equivalently sin θ / cos θ.',
        },
        {
          term: 'Hypotenuse',
          definition:
            'The longest side of a right triangle, opposite the 90° angle. It is the denominator of both sine and cosine.',
        },
      ],
      intuition:
        'Scale a right triangle up or down and the *angles* stay the same while the sides change. That means any ratio of two sides is a fingerprint of the angle alone. Charts of sine values are really charts of triangle shapes — that is why one table works for every size of triangle.',
      worked: {
        problem: 'In a right triangle the side opposite θ is 3, the adjacent side is 4, and the hypotenuse is 5. Find sin θ, cos θ, and tan θ.',
        steps: [
          'Identify the hypotenuse: the side across from the right angle, length 5.',
          'sin θ = opposite / hypotenuse = 3 / 5 = 0.6.',
          'cos θ = adjacent / hypotenuse = 4 / 5 = 0.8.',
          'tan θ = opposite / adjacent = 3 / 4 = 0.75. Check: sin / cos = 0.6 / 0.8 = 0.75 ✓',
        ],
        answer: 'sin θ = 0.6, cos θ = 0.8, tan θ = 0.75',
      },
      table: {
        caption: 'The three ratios, and how to recover the missing side',
        head: ['Ratio', 'Formula', 'Solve for opposite', 'Solve for adjacent'],
        rows: [
          ['sin θ', 'opp / hyp', 'opp = hyp · sin θ', '—'],
          ['cos θ', 'adj / hyp', '—', 'adj = hyp · cos θ'],
          ['tan θ', 'opp / adj', 'opp = adj · tan θ', 'adj = opp / tan θ'],
        ],
      },
      diagram:
        'flowchart TD\n  T[Right triangle] --> H[Hypotenuse: across from 90°]\n  T --> O[Opposite: across from θ]\n  T --> A[Adjacent: touches θ]\n  O --> S[sin θ = O / H]\n  A --> C[cos θ = A / H]\n  O --> N[tan θ = O / A]',
      pitfalls: [
        'Choosing "adjacent" as the hypotenuse — the hypotenuse is never adjacent to the right angle.',
        'Computing a ratio upside down; sin is always opposite over hypotenuse, never hypotenuse over opposite.',
      ],
      scenario: {
        q: 'A ramp rises 1 m over a horizontal run of 4 m. Which ratio directly gives the ramp angle?',
        options: ['sin θ = 1 / 4', 'tan θ = 1 / 4', 'cos θ = 1 / 4', 'sin θ = 4 / 1'],
        answer: 1,
        why: 'The rise (1 m) is opposite the incline angle and the run (4 m) is adjacent, so tan θ = rise / run = 1 / 4, giving θ ≈ 14°.',
      },
    },
    {
      layer: 2,
      title: 'The Unit Circle & Radians',
      tier: 'FOUNDATION',
      minutes: 20,
      objectives: [
        'Convert between degrees and radians exactly',
        'Read sine and cosine as coordinates on the unit circle',
        'Locate angles in all four quadrants using reference angles',
        'Derive arc length and sector area from radians',
      ],
      concepts: [
        {
          term: 'Radian',
          definition:
            'The angle subtended at the centre of a circle by an arc equal in length to the radius. A full turn is 2π radians = 360°, so 1 radian ≈ 57.3°.',
        },
        {
          term: 'Unit circle',
          definition:
            'The circle of radius 1 centred at the origin. A point at angle θ has coordinates (cos θ, sin θ), which extends trigonometry beyond 0°–90°.',
        },
        {
          term: 'Reference angle',
          definition:
            'The acute angle between the terminal side of θ and the nearest x-axis; it supplies the magnitude of sin and cos while the quadrant supplies the sign.',
        },
        {
          term: 'Arc length',
          definition:
            'For a circle of radius r and central angle θ in radians, arc length s = rθ. Using degrees instead would require the extra factor π/180.',
        },
      ],
      intuition:
        'A right triangle only describes angles up to 90°. Rotate the hypotenuse around the origin at fixed length 1 and its tip sweeps the unit circle: the x-coordinate is cos θ, the y-coordinate is sin θ. Now every angle, including negative and >360° ones, has a coordinate pair, and the signs come from the quadrant rather than from a triangle.',
      worked: {
        problem: 'Convert 135° to radians and evaluate sin 135° and cos 135°.',
        steps: [
          'Multiply by π/180: 135 · π/180 = 3π/4.',
          'The reference angle is 180° − 135° = 45°, so magnitudes are sin 45° = √2/2 and cos 45° = √2/2.',
          '135° sits in quadrant II: x < 0, y > 0.',
          'Therefore cos 135° = −√2/2 and sin 135° = +√2/2.',
        ],
        answer: '135° = 3π/4; sin 135° = √2/2, cos 135° = −√2/2',
      },
      table: {
        caption: 'Exact values worth knowing by derivation, not memorisation',
        head: ['Angle', 'Radians', 'cos', 'sin', 'tan'],
        rows: [
          ['0°', '0', '1', '0', '0'],
          ['30°', 'π/6', '√3/2', '1/2', '1/√3'],
          ['45°', 'π/4', '√2/2', '√2/2', '1'],
          ['60°', 'π/3', '1/2', '√3/2', '√3'],
          ['90°', 'π/2', '0', '1', 'undefined'],
        ],
      },
      diagram:
        'flowchart LR\n  A[Angle θ] --> B[Quadrant?]\n  B --> C[Reference angle α]\n  C --> D[Look up sin α, cos α]\n  D --> E[Apply quadrant signs]\n  E --> F[(cos θ, sin θ)]',
      pitfalls: [
        'Forgetting that tangent is undefined at 90° because cos 90° = 0.',
        'Applying reference-angle magnitudes without quadrant signs, so sin 225° comes out positive.',
        'Mixing units inside s = rθ; the formula only works in radians.',
      ],
      scenario: {
        q: 'A wheel of radius 0.4 m turns through 3 radians. How far does a point on the rim travel?',
        options: ['1.2 m', '0.4 m', '2.4 m', '0.13 m'],
        answer: 0,
        why: 's = rθ = 0.4 · 3 = 1.2 m. Multiplying by π/180 here would be a unit error.',
      },
    },
    {
      layer: 3,
      title: 'Graphs & Periodicity',
      tier: 'INTERMEDIATE',
      minutes: 22,
      objectives: [
        'Identify amplitude, period, phase shift, and vertical shift from a formula',
        'Sketch sine, cosine, and tangent families',
        'Model a repeating real-world signal',
        'Explain why tangent has asymptotes',
      ],
      concepts: [
        {
          term: 'Amplitude',
          definition:
            'Half the distance between a periodic function\'s maximum and minimum. For y = A sin(Bx + C) + D the amplitude is |A|.',
        },
        {
          term: 'Period',
          definition:
            'The horizontal length of one full cycle. For sine and cosine the period is 2π/|B|; for tangent it is π/|B|.',
        },
        {
          term: 'Phase shift',
          definition:
            'The horizontal translation of a wave, equal to −C/B in y = A sin(Bx + C) + D. Positive C shifts the graph left.',
        },
        {
          term: 'Asymptote (vertical)',
          definition:
            'A vertical line the graph approaches but never touches. tan x has asymptotes at x = π/2 + kπ because cosine is zero there.',
        },
      ],
      intuition:
        'Read a transformed wave as a recipe, not a formula: A stretches it vertically, B compresses it horizontally, C slides it sideways, D lifts the centreline. Because sine and cosine are the same wave offset by a quarter turn, every cosine graph is a shifted sine — choosing which to use is a modelling convenience, not a mathematical difference.',
      worked: {
        problem: 'Describe and sketch one period of y = 3 sin(2x − π/2) + 1.',
        steps: [
          'Amplitude |A| = 3, so the wave oscillates between 1 − 3 = −2 and 1 + 3 = 4.',
          'The midline is y = 1 (the vertical shift D).',
          'Period = 2π / |B| = 2π/2 = π.',
          'Phase shift = −C/B = −(−π/2)/2 = π/4 to the right.',
          'Plot key points π/4 apart: start at midline rising, then max 4, midline 1, min −2, midline 1.',
        ],
        answer: 'Amplitude 3, period π, shift π/4 right, midline y = 1, range [−2, 4]',
      },
      table: {
        caption: 'Transformation vocabulary applied to y = A sin(Bx + C) + D',
        head: ['Parameter', 'Controls', 'Formula', 'Effect of doubling it'],
        rows: [
          ['A', 'Amplitude', '|A|', 'Doubles vertical stretch'],
          ['B', 'Frequency', 'period = 2π/|B|', 'Halves the period'],
          ['C', 'Phase', '−C/B', 'Doubles the shift'],
          ['D', 'Midline', 'y = D', 'Raises centreline twice as far'],
        ],
      },
      diagram:
        'flowchart LR\n  F["y = A sin(Bx + C) + D"] --> A["A: amplitude |A|"]\n  F --> B["B: period 2π/|B|"]\n  F --> C["C: shift −C/B"]\n  F --> D["D: midline y = D"]\n  A --> G[Sketch key points]\n  B --> G\n  C --> G\n  D --> G',
      pitfalls: [
        'Reading the phase shift as C rather than −C/B.',
        'Assuming amplitude can be negative — it is |A|, while a negative A reflects the wave.',
        'Giving sine a period of π; that is tangent\'s period.',
      ],
      scenario: {
        q: 'A tide has a high of 5 m at 02:00 and a low of 1 m at 08:00. Which model fits?',
        options: [
          'y = 2 cos(π(t − 2)/6) + 3',
          'y = 3 cos(π(t − 2)/6) + 2',
          'y = 2 sin(2π(t − 2)/6) + 3',
          'y = 5 cos(π t / 12) + 1',
        ],
        answer: 0,
        why: 'Amplitude = (5 − 1)/2 = 2, midline = 3, half-cycle (high to low) is 6 h so the period is 12 h giving B = 2π/12 = π/6, and a cosine peaks at t = 2.',
      },
    },
    {
      layer: 4,
      title: 'Identities & Equations',
      tier: 'INTERMEDIATE',
      minutes: 25,
      objectives: [
        'Prove the Pythagorean identity from the unit circle',
        'Simplify expressions with sum, difference, and double-angle identities',
        'Solve trigonometric equations on a given interval',
        'Use identities to avoid dividing by zero',
      ],
      concepts: [
        {
          term: 'Pythagorean identity',
          definition:
            'sin²θ + cos²θ = 1 for every θ. It follows directly from the unit circle equation x² + y² = 1.',
        },
        {
          term: 'Sum identity',
          definition:
            'sin(A ± B) = sin A cos B ± cos A sin B, and cos(A ± B) = cos A cos B ∓ sin A sin B. These generate every other identity.',
        },
        {
          term: 'Double-angle identity',
          definition:
            'sin 2θ = 2 sin θ cos θ and cos 2θ = cos²θ − sin²θ = 1 − 2sin²θ = 2cos²θ − 1.',
        },
        {
          term: 'General solution',
          definition:
            'Because sine and cosine repeat every 2π, an equation such as sin θ = 0.5 has solutions θ = π/6 + 2kπ and θ = 5π/6 + 2kπ for integer k.',
        },
      ],
      intuition:
        'Identities are not a list to memorise; they are one fact — the unit circle — rewritten. Anything you can prove from sin² + cos² = 1, you own forever. When solving an equation, isolate one trigonometric function, find the principal solutions in one cycle, then add the period to capture the rest. Dividing both sides by cos θ is the classic way to lose solutions.',
      worked: {
        problem: 'Solve 2sin²θ − sin θ − 1 = 0 for 0 ≤ θ < 2π.',
        steps: [
          'Treat sin θ as a single variable u: 2u² − u − 1 = 0.',
          'Factor: (2u + 1)(u − 1) = 0, so u = −1/2 or u = 1.',
          'sin θ = 1 gives θ = π/2.',
          'sin θ = −1/2 gives reference angle π/6 in quadrants III and IV: θ = 7π/6 and θ = 11π/6.',
          'Collect all solutions in the interval.',
        ],
        answer: 'θ = π/2, 7π/6, 11π/6',
      },
      table: {
        caption: 'The identity toolkit and when to reach for it',
        head: ['Identity', 'Form', 'Typical use'],
        rows: [
          ['Pythagorean', 'sin²θ + cos²θ = 1', 'Convert between sin and cos'],
          ['Tangent', 'tan θ = sin θ / cos θ', 'Turn products into a single ratio'],
          ['Double angle', 'sin 2θ = 2 sin θ cos θ', 'Collapse mixed frequencies'],
          ['Sum', 'sin(A + B) = sin A cos B + cos A sin B', 'Expand compound angles'],
        ],
      },
      diagram:
        'flowchart TD\n  E[Equation] --> I[Isolate one trig function]\n  I --> S[Solve in one period]\n  S --> R[Find reference angle]\n  R --> Q[Apply quadrant solutions]\n  Q --> P[Add period kT]\n  P --> C[Check interval and domain]',
      pitfalls: [
        'Dividing by cos θ and silently discarding solutions where cos θ = 0.',
        'Forgetting the second solution a reference angle produces in another quadrant.',
        'Applying a double-angle identity to sin(2θ) when the argument is really 2 sin θ.',
      ],
      scenario: {
        q: 'You simplify sin θ · cos θ. Which single expression is equivalent?',
        options: ['½ sin 2θ', 'sin²θ', 'cos 2θ', '2 sin 2θ'],
        answer: 0,
        why: 'The double-angle identity rear-ranged: ½ sin 2θ = ½ · 2 sin θ cos θ = sin θ cos θ.',
      },
    },
    {
      layer: 5,
      title: 'Advanced Applications & Calculus Integration',
      tier: 'ADVANCED',
      minutes: 30,
      objectives: [
        'Differentiate and integrate sine and cosine from the unit circle',
        'Model harmonic motion with amplitude-phase form',
        'Use inverse trigonometry in real geometry problems',
        'Recognise where Fourier analysis extends the same wave idea',
      ],
      concepts: [
        {
          term: 'Derivative of sine',
          definition:
            'd/dx sin x = cos x and d/dx cos x = −sin x (x in radians). The radian requirement exists because the limit sin h / h → 1 only holds in radians.',
        },
        {
          term: 'Harmonic motion model',
          definition:
            'A quantity oscillating about equilibrium is written x(t) = A cos(ωt + φ), where ω is angular frequency and φ the phase; period T = 2π/ω.',
        },
        {
          term: 'Inverse sine (arcsin)',
          definition:
            'arcsin y returns the angle in [−π/2, π/2] whose sine is y. The restriction guarantees a single-valued inverse.',
        },
        {
          term: 'Fourier decomposition',
          definition:
            'Any reasonably well-behaved periodic signal can be written as a sum of sines and cosines at integer multiples of its base frequency; coefficients come from integrating the signal against those waves.',
        },
      ],
      intuition:
        'Sine and cosine are each other\'s derivative up to a sign, which is exactly the signature of circular motion: velocity is perpendicular to position. That single geometric fact powers simple harmonic motion, AC circuits, signal processing, and the Fourier transform — all of them are statement that a wave can be differentiated, added, and decomposed without ever leaving the family.',
      worked: {
        problem: 'A mass on a spring has position x(t) = 0.08 cos(6t) metres. Find its maximum speed and the first time it passes equilibrium.',
        steps: [
          'Velocity is the derivative: v(t) = −0.08 · 6 sin(6t) = −0.48 sin(6t).',
          'Maximum speed is the amplitude of velocity: |−0.48| = 0.48 m/s.',
          'Equilibrium means x = 0, so cos(6t) = 0.',
          'First positive solution: 6t = π/2, so t = π/12 ≈ 0.262 s.',
          'At that moment sin(6t) = 1, confirming maximum speed at the crossing.',
        ],
        answer: 'v_max = 0.48 m/s; first equilibrium crossing at t = π/12 s',
      },
      table: {
        caption: 'Calculus of the circular functions',
        head: ['Function', 'Derivative', 'Antiderivative', 'Sign intuition'],
        rows: [
          ['sin x', 'cos x', '−cos x + C', 'Starts at 0, slope is max'],
          ['cos x', '−sin x', 'sin x + C', 'Starts at peak, slope is 0'],
          ['tan x', 'sec² x', '−ln|cos x| + C', 'Increasing everywhere it exists'],
          ['arcsin x', '1 / √(1 − x²)', 'x arcsin x + √(1 − x²) + C', 'Domain [−1, 1]'],
        ],
      },
      diagram:
        'flowchart LR\n  S[sin x] -->|d/dx| C[cos x]\n  C -->|d/dx| NS["−sin x"]\n  NS -->|d/dx| NC["−cos x"]\n  NC -->|d/dx| S\n  S --> H[Harmonic motion]\n  H --> F[Fourier decomposition]',
      pitfalls: [
        'Differentiating in degrees, which introduces a stray factor of π/180.',
        'Forgetting that integrating sine yields a negative cosine.',
        'Using arcsin outside [−1, 1] and expecting a real angle.',
      ],
      scenario: {
        q: 'What is ∫₀^π sin x dx?',
        options: ['2', '0', '1', '−2'],
        answer: 0,
        why: 'The antiderivative is −cos x, evaluated: (−cos π) − (−cos 0) = 1 + 1 = 2, the area of one positive arch.',
      },
    },
  ],
};

export const calculus = {
  slug: 'calculus',
  title: 'Calculus',
  discipline: 'Mathematics',
  level: 'Foundation → Advanced',
  icon: 'curve',
  summary:
    'Limits, derivatives, integrals, and the machinery of change — rebuilt from first principles so nothing is a rule without a reason.',
  layers: [
    {
      layer: 1,
      title: 'Limits & Continuity',
      tier: 'FOUNDATION',
      minutes: 18,
      objectives: [
        'Read limit notation as a prediction, not an evaluation',
        'Compute limits by substitution, factoring, and rationalising',
        'Distinguish removable, jump, and infinite discontinuities',
        'Explain why 0/0 is indeterminate rather than undefined',
      ],
      concepts: [
        {
          term: 'Limit',
          definition:
            'lim(x→a) f(x) = L means f(x) can be made arbitrarily close to L by taking x sufficiently close to a, without requiring f(a) to equal L.',
        },
        {
          term: 'One-sided limit',
          definition:
            'The value approached from one side only: x→a⁺ (larger values) or x→a⁻. A two-sided limit exists exactly when both one-sided limits exist and agree.',
        },
        {
          term: 'Continuity at a point',
          definition:
            'f is continuous at a when f(a) is defined, lim(x→a) f(x) exists, and the two are equal. All three conditions must hold.',
        },
        {
          term: 'Indeterminate form',
          definition:
            'An expression such as 0/0 or ∞/∞ that does not by itself determine a value; the limit must be resolved through algebra or L\'Hôpital\'s rule.',
        },
      ],
      intuition:
        'A limit asks "where is the function heading?", not "where does it land?". This distinction is the entire foundation of calculus: the derivative is a limit of slopes at a point the two sample points never actually reach. Continuity is the extra promise that the landing spot equals the destination.',
      worked: {
        problem: 'Evaluate lim(x→2) (x² − 4)/(x − 2).',
        steps: [
          'Direct substitution gives 0/0 — indeterminate, so factor instead of concluding "undefined".',
          'Factor the numerator: (x − 2)(x + 2).',
          'Cancel the common factor for x ≠ 2: the expression becomes x + 2.',
          'Now substitute: 2 + 2 = 4.',
          'The original function has a removable hole at x = 2, but the limit is still 4.',
        ],
        answer: '4',
      },
      table: {
        caption: 'Technique selection by symptom',
        head: ['Symptom on substitution', 'Technique', 'Example'],
        rows: [
          ['Finite value', 'Direct substitution', '(x + 1) at x = 3 → 4'],
          ['0/0 with polynomials', 'Factor and cancel', '(x² − 9)/(x − 3)'],
          ['0/0 with roots', 'Multiply by the conjugate', '(√x − 2)/(x − 4)'],
          ['∞/∞', 'Divide by highest power or L\'Hôpital', '(3x² + 1)/(x² − 5)'],
        ],
      },
      diagram:
        'flowchart TD\n  S[Substitute x = a] --> A{Finite?}\n  A -->|Yes| L[Limit found]\n  A -->|"0/0 or ∞/∞"| B[Transform algebraically]\n  B --> C{Resolved?}\n  C -->|Yes| L\n  C -->|No| D[L\'Hôpital or squeeze]\n  D --> L',
      pitfalls: [
        'Cancelling a factor and then claiming the function equals the simplified form at the hole — the limit matches, the function value does not.',
        'Assuming a limit exists when the two one-sided limits disagree.',
        'Applying L\'Hôpital to a form that is not indeterminate.',
      ],
      scenario: {
        q: 'What is lim(x→0) sin x / x?',
        options: ['1', '0', 'Undefined', '∞'],
        answer: 0,
        why: 'Substitution gives 0/0, but the small-angle geometry of the unit circle bounds cos x ≤ sin x / x ≤ 1, so the squeeze theorem forces the limit to 1.',
      },
    },
    {
      layer: 2,
      title: 'Derivatives from First Principles',
      tier: 'FOUNDATION',
      minutes: 22,
      objectives: [
        'Build the derivative as a limit of secant slopes',
        'Differentiate polynomials, products, quotients, and compositions',
        'Interpret the derivative as instantaneous rate and tangent slope',
        'Explain why differentiability implies continuity but not the converse',
      ],
      concepts: [
        {
          term: 'Difference quotient',
          definition:
            'The average rate of change over an interval: [f(x + h) − f(x)] / h. Its limit as h→0 is the derivative.',
        },
        {
          term: 'Derivative',
          definition:
            'f′(x) = lim(h→0) [f(x + h) − f(x)] / h — the instantaneous rate of change, equal to the slope of the tangent line at x.',
        },
        {
          term: 'Chain rule',
          definition:
            'For a composition, d/dx f(g(x)) = f′(g(x)) · g′(x). Differentiate the outside, then multiply by the inside\'s derivative.',
        },
        {
          term: 'Differentiability',
          definition:
            'f is differentiable at a when the derivative limit exists. This requires continuity at a, but continuity does not imply differentiability (|x| at 0 is the standard counterexample).',
        },
      ],
      intuition:
        'Slope needs two points; instantaneous change needs one. The difference quotient bridges them, and the limit performs the leap. Practically, f′(a) answers "if I nudge the input by a tiny amount, how much does the output move?" — that reading survives into gradients, sensitivity analysis, and physics.',
      worked: {
        problem: 'Differentiate f(x) = (3x² + 1)⁵.',
        steps: [
          'Identify the composition: outer u⁵, inner u = 3x² + 1.',
          'Differentiate the outer with respect to u: 5u⁴.',
          'Differentiate the inner: d/dx (3x² + 1) = 6x.',
          'Multiply (chain rule): f′(x) = 5(3x² + 1)⁴ · 6x.',
          'Simplify: f′(x) = 30x(3x² + 1)⁴.',
        ],
        answer: 'f′(x) = 30x(3x² + 1)⁴',
      },
      table: {
        caption: 'Core rules, with the shape they apply to',
        head: ['Rule', 'Formula', 'Use when'],
        rows: [
          ['Power', 'd/dx xⁿ = n xⁿ⁻¹', 'Single term'],
          ['Product', '(uv)′ = u′v + uv′', 'Two factors multiplied'],
          ['Quotient', '(u/v)′ = (u′v − uv′) / v²', 'One function over another'],
          ['Chain', '(f∘g)′ = f′(g) · g′', 'Function inside a function'],
        ],
      },
      diagram:
        'flowchart LR\n  P1["(x, f(x))"] --> Q["(x+h, f(x+h))"]\n  Q --> S[Secant slope]\n  S -->|"h → 0"| T[Tangent slope f′]\n  T --> R[Rate of change]\n  R --> U[Optimisation / motion / gradients]',
      pitfalls: [
        'Applying the power rule to something like 2ˣ — the exponent must be constant.',
        'Forgetting the inside derivative in the chain rule.',
        'Claiming a function is differentiable because it is continuous.',
      ],
      scenario: {
        q: 'A balloon\'s radius grows at 2 cm/s. How fast is its volume growing when r = 5 cm? (V = 4/3 πr³)',
        options: ['200π cm³/s', '50π cm³/s', '40π cm³/s', '100 cm³/s'],
        answer: 0,
        why: 'dV/dt = 4πr² · dr/dt = 4π(25)(2) = 200π cm³/s.',
      },
    },
    {
      layer: 3,
      title: 'Applications of Derivatives',
      tier: 'INTERMEDIATE',
      minutes: 25,
      objectives: [
        'Find critical points and classify them with derivative tests',
        'Solve constrained optimisation problems',
        'Use the mean value theorem as a guarantee',
        'Interpret second derivatives as concavity and acceleration',
      ],
      concepts: [
        {
          term: 'Critical point',
          definition:
            'A point in the domain where f′(x) = 0 or f′ does not exist. Local extrema can only occur at critical points or endpoints.',
        },
        {
          term: 'First derivative test',
          definition:
            'If f′ changes from positive to negative across a critical point, it is a local maximum; negative to positive gives a local minimum; no sign change gives neither.',
        },
        {
          term: 'Concavity',
          definition:
            'f is concave up where f″ > 0 (tangent lines below the curve) and concave down where f″ < 0. An inflection point is where concavity changes.',
        },
        {
          term: 'Constraint equation',
          definition:
            'In optimisation, the relation among variables (e.g. perimeter = 40) used to express the objective in one variable before differentiating.',
        },
      ],
      intuition:
        'Derivatives turn shape questions into algebra. "Where is the biggest?" becomes "where is the slope zero and switching sign?" The second derivative tells you how the rate itself is changing, which is why it distinguishes a peak from a valley and acceleration from velocity. Always check endpoints: a closed interval can hide its extreme value at the boundary.',
      worked: {
        problem: 'A rectangle has perimeter 40 m. What dimensions maximise its area?',
        steps: [
          'Let width = x and height = y, with 2x + 2y = 40 so y = 20 − x.',
          'Objective: A(x) = x(20 − x) = 20x − x².',
          'Differentiate: A′(x) = 20 − 2x.',
          'Set A′ = 0: x = 10. Since A″ = −2 < 0, this is a maximum.',
          'Then y = 20 − 10 = 10, so the maximum area is a square of 100 m².',
        ],
        answer: 'A 10 m × 10 m square, area 100 m²',
      },
      table: {
        caption: 'Reading the derivatives at a point',
        head: ['f′', 'f″', 'Shape', 'Example'],
        rows: [
          ['0', '< 0', 'Local maximum', 'Top of a projectile arc'],
          ['0', '> 0', 'Local minimum', 'Bottom of a cost curve'],
          ['> 0', '> 0', 'Increasing, concave up', 'Exponential growth'],
          ['< 0', '> 0', 'Decreasing, concave up', 'Decelerating descent'],
        ],
      },
      diagram:
        'flowchart TD\n  S[Read the problem] --> V[Name variables]\n  V --> C[Write the constraint]\n  C --> O[Objective in one variable]\n  O --> D[Differentiate]\n  D --> Z[Solve f′ = 0]\n  Z --> T[Second derivative or sign test]\n  T --> E[Check endpoints and domain]',
      pitfalls: [
        'Optimising before substituting the constraint, leaving two variables in one equation.',
        'Assuming every critical point is an extremum.',
        'Ignoring the physical domain — negative lengths are not valid answers.',
      ],
      scenario: {
        q: 'f(x) = x³ has f′(0) = 0 but no extremum at x = 0. Why?',
        options: [
          'f′ does not change sign there; it is an inflection point',
          'The second derivative is zero',
          'x = 0 is not in the domain',
          'The first derivative test fails for cubics',
        ],
        answer: 0,
        why: 'f′ = 3x² is non-negative on both sides, so the function keeps increasing through the flat spot. f″ = 0 confirms an inflection, not an extremum.',
      },
    },
    {
      layer: 4,
      title: 'Integration & the Fundamental Theorem',
      tier: 'INTERMEDIATE',
      minutes: 28,
      objectives: [
        'Approximate area with Riemann sums and pass to the definite integral',
        'Use the fundamental theorem to evaluate integrals exactly',
        'Integrate by substitution and by parts',
        'Interpret signed area and net change',
      ],
      concepts: [
        {
          term: 'Riemann sum',
          definition:
            'An approximation of area under a curve by summing rectangles: Σ f(xᵢ) Δx. The definite integral is the limit as the partition becomes infinitely fine.',
        },
        {
          term: 'Definite integral',
          definition:
            '∫ₐᵇ f(x) dx is the signed area between f and the x-axis from a to b — area below the axis counts as negative.',
        },
        {
          term: 'Fundamental theorem of calculus',
          definition:
            'If F is an antiderivative of f, then ∫ₐᵇ f(x) dx = F(b) − F(a). It links accumulation (integrals) with rates (derivatives) as inverse operations.',
        },
        {
          term: 'Integration by substitution',
          definition:
            'The chain rule run backwards: replace u = g(x), du = g′(x) dx, turning a composite integrand into a simpler one.',
        },
      ],
      intuition:
        'Integration is accumulation. Slice a quantity into thin pieces, add the pieces, and take the limit — that recipe computes area, distance from velocity, mass from density, and probability from a density curve. The fundamental theorem is the punchline: accumulating a rate recovers the original quantity, which is why integrals and derivatives undo each other.',
      worked: {
        problem: 'Evaluate ∫₁⁴ (2x + 1) dx.',
        steps: [
          'Find an antiderivative: F(x) = x² + x.',
          'Apply the fundamental theorem: F(4) − F(1).',
          'F(4) = 16 + 4 = 20.',
          'F(1) = 1 + 1 = 2.',
          'Subtract: 20 − 2 = 18.',
        ],
        answer: '18',
      },
      table: {
        caption: 'Choosing an integration technique',
        head: ['Integrand shape', 'Technique', 'Check by differentiating'],
        rows: [
          ['f(g(x)) · g′(x)', 'Substitution', 'Chain rule'],
          ['x · eˣ or x · sin x', 'Integration by parts', 'Product rule'],
          ['Rational with factorable denominator', 'Partial fractions', 'Quotient algebra'],
          ['√(a² − x²)', 'Trigonometric substitution', 'Inverse trig derivatives'],
        ],
      },
      diagram:
        'flowchart LR\n  A[Area problem] --> B[Slice into rectangles]\n  B --> C[Riemann sum]\n  C -->|"n → ∞"| D[Definite integral]\n  D --> E[Antiderivative F]\n  E --> F["F(b) − F(a)"]\n  F --> G[Net change]',
      pitfalls: [
        'Forgetting the constant of integration for indefinite integrals.',
        'Dropping the negative contribution when the curve dips below the axis.',
        'Changing the variable of integration but not the limits in a substitution.',
      ],
      scenario: {
        q: 'A particle has velocity v(t) = 3t² m/s. How far does it travel from t = 0 to t = 2 s?',
        options: ['8 m', '12 m', '6 m', '24 m'],
        answer: 0,
        why: 'Distance = ∫₀² 3t² dt = [t³]₀² = 8 − 0 = 8 m.',
      },
    },
    {
      layer: 5,
      title: 'Series, Multivariable & Differential Equations',
      tier: 'ADVANCED',
      minutes: 32,
      objectives: [
        'Expand a function as a Taylor series and bound the error',
        'Compute partial derivatives and interpret the gradient',
        'Solve separable first-order differential equations',
        'Recognise when a series converges absolutely',
      ],
      concepts: [
        {
          term: 'Taylor series',
          definition:
            'f(x) = Σ f⁽ⁿ⁾(a)(x − a)ⁿ / n! near x = a. Truncating after n terms leaves an error governed by the next term.',
        },
        {
          term: 'Partial derivative',
          definition:
            '∂f/∂x measures how f changes as x varies while every other input is held fixed. It is an ordinary derivative in a slice of the domain.',
        },
        {
          term: 'Gradient',
          definition:
            'The vector of all partial derivatives, ∇f. It points in the direction of steepest ascent and is orthogonal to level curves — the basis of gradient descent.',
        },
        {
          term: 'Separable ODE',
          definition:
            'A differential equation writable as dy/dx = g(x)h(y). Rearranging to dy/h(y) = g(x) dx and integrating both sides solves it.',
        },
      ],
      intuition:
        'Locally, every smooth function is a polynomial — that is the Taylor promise, and it is how calculators, physics engines, and neural network initialisations actually compute sine and exp. In several variables the derivative stops being a number and becomes a direction: the gradient tells you which way is uphill, which is precisely the information optimisation algorithms need.',
      worked: {
        problem: 'Solve dy/dx = 2xy with y(0) = 3.',
        steps: [
          'Separate: dy/y = 2x dx (valid where y ≠ 0).',
          'Integrate both sides: ln|y| = x² + C.',
          'Exponentiate: y = A e^{x²}.',
          'Apply the initial condition: 3 = A e⁰ = A.',
          'Write the particular solution and note it is valid for all real x.',
        ],
        answer: 'y = 3e^{x²}',
      },
      table: {
        caption: 'Series worth recognising',
        head: ['Function', 'Expansion about 0', 'Radius of convergence'],
        rows: [
          ['eˣ', '1 + x + x²/2! + x³/3! + …', '∞'],
          ['sin x', 'x − x³/3! + x⁵/5! − …', '∞'],
          ['cos x', '1 − x²/2! + x⁴/4! − …', '∞'],
          ['1/(1 − x)', '1 + x + x² + x³ + …', '1'],
        ],
      },
      diagram:
        'flowchart TD\n  F[Smooth f] --> T[Taylor expansion at a]\n  T --> P[Truncate to degree n]\n  T --> E[Bound error with next term]\n  F --> M[Several variables]\n  M --> G[Gradient ∇f]\n  G --> O[Steepest ascent / descent]\n  F --> D[Differential equation]\n  D --> S[Separate and integrate]',
      pitfalls: [
        'Using a Taylor polynomial far outside its interval of convergence.',
        'Treating ∂f/∂x as the full derivative when other variables also change.',
        'Losing the constant of integration before applying an initial condition.',
      ],
      scenario: {
        q: 'For f(x, y) = x²y + y³, what is ∇f at (1, 2)?',
        options: ['(4, 13)', '(4, 12)', '(2, 13)', '(1, 6)'],
        answer: 0,
        why: '∂f/∂x = 2xy = 4 and ∂f/∂y = x² + 3y² = 1 + 12 = 13, so ∇f = (4, 13).',
      },
    },
  ],
};

export const linearAlgebra = {
  slug: 'linear-algebra',
  title: 'Linear Algebra',
  discipline: 'Mathematics',
  level: 'Foundation → Advanced',
  icon: 'grid',
  summary:
    'Vectors, matrices, and the geometry of transformations — the language underneath graphics, machine learning, and quantum mechanics.',
  layers: [
    {
      layer: 1,
      title: 'Vectors & Geometric Intuition',
      tier: 'FOUNDATION',
      minutes: 18,
      objectives: [
        'Add and scale vectors geometrically and algebraically',
        'Compute dot products and interpret them as projection',
        'Distinguish span from a single vector',
        'Measure length with the Euclidean norm',
      ],
      concepts: [
        {
          term: 'Vector',
          definition:
            'An ordered list of numbers representing a magnitude and direction in space; in n dimensions it is an element of ℝⁿ.',
        },
        {
          term: 'Linear combination',
          definition:
            'A sum c₁v₁ + c₂v₂ + … + cₙvₙ with scalar weights cᵢ. Nearly every idea in linear algebra is a statement about which combinations are possible.',
        },
        {
          term: 'Span',
          definition:
            'The set of all linear combinations of a collection of vectors — the reachable subspace. Two non-parallel vectors in ℝ² span the whole plane.',
        },
        {
          term: 'Dot product',
          definition:
            'u · v = Σ uᵢvᵢ = |u||v| cos θ. Zero means orthogonal; the sign reveals whether vectors point broadly together or apart.',
        },
      ],
      intuition:
        'A vector is not an arrow in a picture; it is a recipe of coordinates. Addition is "do both displacements", scaling is "do it more or less". The dot product converts geometry into arithmetic: it measures how much of one vector lies along another, which is how projection, correlation, and attention scores all work.',
      worked: {
        problem: 'For u = (3, −1) and v = (2, 4), compute u + v, 2u − v, and u · v.',
        steps: [
          'Add componentwise: u + v = (3 + 2, −1 + 4) = (5, 3).',
          'Scale then subtract: 2u = (6, −2), so 2u − v = (6 − 2, −2 − 4) = (4, −6).',
          'Dot product: 3(2) + (−1)(4) = 6 − 4 = 2.',
          'Since the dot product is non-zero, the vectors are not orthogonal.',
        ],
        answer: 'u + v = (5, 3), 2u − v = (4, −6), u · v = 2',
      },
      table: {
        caption: 'Vector operations at a glance',
        head: ['Operation', 'Formula', 'Geometric meaning'],
        rows: [
          ['Addition', '(u₁+v₁, u₂+v₂)', 'Head-to-tail displacement'],
          ['Scaling', '(cv₁, cv₂)', 'Stretch or flip direction'],
          ['Dot product', 'u₁v₁ + u₂v₂', 'Alignment and projection'],
          ['Norm', '√(v₁² + v₂²)', 'Length of the vector'],
        ],
      },
      diagram:
        'flowchart LR\n  V[Vectors v₁ … vₙ] --> C[Linear combinations]\n  C --> S[Span]\n  S --> I{Independent?}\n  I -->|Yes| D[Full dimension]\n  I -->|No| H[Hidden redundancy]',
      pitfalls: [
        'Adding vectors of different dimensions.',
        'Confusing the dot product (a scalar) with scalar multiplication (a vector).',
        'Assuming three vectors in ℝ² can span more than a plane — they cannot.',
      ],
      scenario: {
        q: 'u = (1, 2) and v = (2, 4). What is their span?',
        options: ['A line through the origin', 'All of ℝ²', 'Only the zero vector', 'A plane not through the origin'],
        answer: 0,
        why: 'v = 2u, so the two vectors are parallel and every combination lands on the same line through the origin.',
      },
    },
    {
      layer: 2,
      title: 'Matrices as Transformations',
      tier: 'FOUNDATION',
      minutes: 22,
      objectives: [
        'Multiply a matrix by a vector as a combination of columns',
        'Recognise identity, rotation, scaling, and shear matrices',
        'Compute determinants and interpret them as area scaling',
        'Invert a 2×2 matrix and know when it fails',
      ],
      concepts: [
        {
          term: 'Matrix',
          definition:
            'A rectangular array of numbers acting on vectors by linear transformation; an m×n matrix maps ℝⁿ to ℝᵐ.',
        },
        {
          term: 'Determinant (2×2)',
          definition:
            'det[[a, b], [c, d]] = ad − bc. Its absolute value is the area scale factor of the transformation; zero means the map collapses space and is not invertible.',
        },
        {
          term: 'Inverse matrix',
          definition:
            'A⁻¹ satisfies A⁻¹A = AA⁻¹ = I. For 2×2, A⁻¹ = (1/det A)[[d, −b], [−c, a]], and it exists only when det A ≠ 0.',
        },
        {
          term: 'Linear transformation',
          definition:
            'A map T with T(u + v) = T(u) + T(v) and T(cu) = cT(u). Every such map is multiplication by some matrix.',
        },
      ],
      intuition:
        'A matrix is not a table of data — it is a machine that moves space. Columns tell you where the basis vectors land, and everything else follows by linearity. The determinant is the machine\'s volume dial: 2 doubles areas, 0 flattens the plane into a line, and a negative value means orientation was flipped.',
      worked: {
        problem: 'Let A = [[2, 1], [1, 3]] and v = (1, 2). Compute Av and det A.',
        steps: [
          'Treat the columns: col₁ = (2, 1), col₂ = (1, 3).',
          'Av = 1·col₁ + 2·col₂ = (2, 1) + (2, 6) = (4, 7).',
          'det A = (2)(3) − (1)(1) = 6 − 1 = 5.',
          'A non-zero determinant means A is invertible and scales area by 5.',
        ],
        answer: 'Av = (4, 7), det A = 5',
      },
      table: {
        caption: 'Common 2×2 transformations',
        head: ['Matrix', 'Geometric effect', 'Determinant'],
        rows: [
          ['[[1,0],[0,1]]', 'Identity — no change', '1'],
          ['[[2,0],[0,2]]', 'Uniform scale by 2', '4'],
          ['[[cos, −sin],[sin, cos]]', 'Rotation by θ', '1'],
          ['[[1,k],[0,1]]', 'Horizontal shear', '1'],
        ],
      },
      diagram:
        'flowchart LR\n  X[Input vector v] --> M[Matrix A]\n  M --> Y[Output Av]\n  M --> D[det A]\n  D --> Z{det = 0?}\n  Z -->|Yes| C[Collapses space: no inverse]\n  Z -->|No| I[Invertible: A⁻¹ exists]',
      pitfalls: [
        'Multiplying matrices in the wrong order — AB ≠ BA in general.',
        'Assuming a matrix is invertible just because it is square.',
        'Reading determinant as a slope rather than a signed area scale.',
      ],
      scenario: {
        q: 'A = [[1, 2], [2, 4]]. What happens to the plane under A?',
        options: [
          'It collapses onto a line because det A = 0',
          'It stretches uniformly',
          'It rotates by 90°',
          'It reflects across y = x',
        ],
        answer: 0,
        why: 'det A = 1·4 − 2·2 = 0, so the columns are dependent and the image is one-dimensional.',
      },
    },
    {
      layer: 3,
      title: 'Systems of Equations & Elimination',
      tier: 'INTERMEDIATE',
      minutes: 24,
      objectives: [
        'Translate a linear system into an augmented matrix',
        'Reduce to row echelon form with legal row operations',
        'Classify systems as unique, infinite, or inconsistent via rank',
        'Read free variables as degrees of freedom',
      ],
      concepts: [
        {
          term: 'Augmented matrix',
          definition:
            'The coefficient matrix with the constant column appended. Row operations on it correspond exactly to legal equation manipulations.',
        },
        {
          term: 'Row echelon form',
          definition:
            'A staircase pattern where each leading entry is right of the one above and rows of zeros sit at the bottom. Reached by Gaussian elimination.',
        },
        {
          term: 'Rank',
          definition:
            'The number of linearly independent rows (equivalently, pivots). It measures how much genuine information the system carries.',
        },
        {
          term: 'Free variable',
          definition:
            'A variable without a pivot column; it can be chosen freely, and each one adds a parameter to the solution set.',
        },
      ],
      intuition:
        'Elimination is disciplined substitution: use one equation to kill a variable in the others, then repeat on the smaller system. Rank is the audit that tells you what survived — equal rows mean redundancy, a pivot in the constant column means contradiction. "Infinite solutions" is not a failure; it is a description of a line or plane of answers.',
      worked: {
        problem: 'Solve x + y + z = 6, 2x − y + z = 3, x + 2y − z = 2.',
        steps: [
          'Write the augmented matrix: [1 1 1 | 6; 2 −1 1 | 3; 1 2 −1 | 2].',
          'R₂ − 2R₁ → [0 −3 −1 | −9]; R₃ − R₁ → [0 1 −2 | −4].',
          'From R₃: y − 2z = −4, so y = 2z − 4.',
          'From R₂: −3y − z = −9 → −3(2z − 4) − z = −9 → −7z + 12 = −9 → z = 3.',
          'Then y = 2(3) − 4 = 2 and x = 6 − y − z = 1.',
        ],
        answer: '(x, y, z) = (1, 2, 3)',
      },
      table: {
        caption: 'Diagnosis from row echelon form',
        head: ['Pattern', 'Rank test', 'Solution type'],
        rows: [
          ['Pivot in every variable column', 'rank(A) = n', 'Unique solution'],
          ['Some variable columns lack pivots', 'rank(A) < n, consistent', 'Infinitely many'],
          ['Row [0 0 0 | b] with b ≠ 0', 'rank(A) < rank([A|b])', 'No solution'],
        ],
      },
      diagram:
        'flowchart TD\n  S[Linear system] --> A[Augmented matrix]\n  A --> E[Gaussian elimination]\n  E --> R[Row echelon form]\n  R --> C{Contradiction row?}\n  C -->|Yes| N[No solution]\n  C -->|No| P{Pivot in every column?}\n  P -->|Yes| U[Unique solution]\n  P -->|No| I[Infinite family with parameters]',
      pitfalls: [
        'Scaling a row by zero — that destroys information and is not a legal operation.',
        'Stopping at echelon form and forgetting back-substitution.',
        'Confusing "more equations than unknowns" with "unique solution".',
      ],
      scenario: {
        q: 'A 3×3 system reduces to rows [1 0 2 | 4], [0 1 −1 | 1], [0 0 0 | 0]. What is the solution set?',
        options: [
          'A line with one free variable',
          'A unique point',
          'No solution',
          'All of ℝ³',
        ],
        answer: 0,
        why: 'There are two pivots and no contradiction, so one variable (z) is free and the solution set is a line.',
      },
    },
    {
      layer: 4,
      title: 'Vector Spaces & Eigenvalues',
      tier: 'INTERMEDIATE',
      minutes: 28,
      objectives: [
        'Test whether a set of vectors forms a basis',
        'Compute null space and column space dimensions',
        'Find eigenvalues and eigenvectors of a small matrix',
        'Explain diagonalisation and when it is possible',
      ],
      concepts: [
        {
          term: 'Basis',
          definition:
            'A set of vectors that both spans the space and is linearly independent; every vector has exactly one coordinate representation in that basis.',
        },
        {
          term: 'Null space',
          definition:
            'The set of vectors x with Ax = 0. Its dimension is the number of free variables and measures how much information A destroys.',
        },
        {
          term: 'Eigenvector',
          definition:
            'A non-zero vector v with Av = λv for some scalar λ. The transformation only stretches or flips it, never rotates it off its line.',
        },
        {
          term: 'Diagonalisation',
          definition:
            'Writing A = PDP⁻¹ where D is diagonal of eigenvalues and P holds eigenvectors. It is possible when there are enough independent eigenvectors.',
        },
      ],
      intuition:
        'A basis is a coordinate system you choose, not one you are given. Changing basis can turn a tangled matrix into a diagonal one — the same transformation seen from its natural axes. Eigenvectors are those natural axes: directions the map respects. This is why page rank, vibration modes, and PCA all reduce to eigenproblems.',
      worked: {
        problem: 'Find the eigenvalues of A = [[4, 1], [2, 3]].',
        steps: [
          'Solve det(A − λI) = 0.',
          'A − λI = [[4 − λ, 1], [2, 3 − λ]].',
          'Determinant: (4 − λ)(3 − λ) − 2 = λ² − 7λ + 12 − 2 = λ² − 7λ + 10.',
          'Factor: (λ − 5)(λ − 2) = 0.',
          'Eigenvalues are λ = 5 and λ = 2; both real, so A is diagonalisable over ℝ.',
        ],
        answer: 'λ = 5 and λ = 2',
      },
      table: {
        caption: 'The four fundamental subspaces at a glance',
        head: ['Subspace', 'Definition', 'Dimension'],
        rows: [
          ['Column space', 'All outputs Ax', 'rank(A)'],
          ['Null space', 'All x with Ax = 0', 'n − rank(A)'],
          ['Row space', 'Span of rows', 'rank(A)'],
          ['Left null space', 'All y with Aᵀy = 0', 'm − rank(A)'],
        ],
      },
      diagram:
        'flowchart LR\n  A[Matrix A] --> C[Column space]\n  A --> N[Null space]\n  C --> R[Rank r]\n  N --> F[n − r free directions]\n  A --> E[Eigen equation Av = λv]\n  E --> D[Diagonalise A = PDP⁻¹]',
      pitfalls: [
        'Including the zero vector as an eigenvector — it satisfies the equation but is excluded by definition.',
        'Assuming every matrix is diagonalisable.',
        'Confusing the dimension of the column space with the number of columns.',
      ],
      scenario: {
        q: 'A 4×4 matrix has rank 3. What is the dimension of its null space?',
        options: ['1', '3', '4', '0'],
        answer: 0,
        why: 'Rank-nullity: nullity = n − rank = 4 − 3 = 1.',
      },
    },
    {
      layer: 5,
      title: 'Orthogonality, SVD & Applications',
      tier: 'ADVANCED',
      minutes: 30,
      objectives: [
        'Project a vector onto a subspace and derive least squares',
        'Orthogonalise a basis with Gram–Schmidt',
        'Interpret the singular value decomposition geometrically',
        'Connect SVD to compression and principal components',
      ],
      concepts: [
        {
          term: 'Orthogonal projection',
          definition:
            'The closest point in a subspace to a given vector: proj_u v = (v · u / u · u) u for a line spanned by u.',
        },
        {
          term: 'Least squares',
          definition:
            'When Ax = b has no exact solution, minimise ‖Ax − b‖². The optimum solves the normal equations AᵀAx = Aᵀb.',
        },
        {
          term: 'Gram–Schmidt',
          definition:
            'A procedure converting any independent set into an orthonormal basis by subtracting projections onto the vectors already built.',
        },
        {
          term: 'Singular value decomposition',
          definition:
            'A = UΣVᵀ for any matrix: rotate by Vᵀ, scale by Σ, rotate by U. Singular values are the stretch factors along principal axes.',
        },
      ],
      intuition:
        'Orthogonality is the geometry of "no interference": components can be analysed one at a time. Projection is the best approximation in a subspace, which is exactly what least-squares regression does. SVD generalises eigenvectors to non-square matrices and ranks the directions of a dataset by importance — truncate the small singular values and you get compression and PCA.',
      worked: {
        problem: 'Project v = (3, 4) onto the line spanned by u = (1, 0), then onto u = (1, 1).',
        steps: [
          'Onto (1, 0): (v · u)/(u · u) = 3, so the projection is (3, 0).',
          'Onto (1, 1): v · u = 3 + 4 = 7 and u · u = 2, so the coefficient is 3.5.',
          'The projection is 3.5(1, 1) = (3.5, 3.5).',
          'The residual (3, 4) − (3.5, 3.5) = (−0.5, 0.5) is orthogonal to (1, 1), confirming minimal distance.',
        ],
        answer: '(3, 0) onto the x-axis; (3.5, 3.5) onto y = x',
      },
      table: {
        caption: 'Decompositions and what they buy you',
        head: ['Decomposition', 'Form', 'Best for'],
        rows: [
          ['LU', 'A = LU', 'Solving many systems with one matrix'],
          ['QR', 'A = QR', 'Stable least squares'],
          ['Eigen', 'A = PDP⁻¹', 'Repeated application, dynamics'],
          ['SVD', 'A = UΣVᵀ', 'Rank, compression, PCA, pseudoinverse'],
        ],
      },
      diagram:
        'flowchart LR\n  B[b vector] --> P[Project onto column space]\n  P --> R[Residual orthogonal]\n  R --> N[Normal equations AᵀAx = Aᵀb]\n  A[Matrix A] --> S[SVD A = UΣVᵀ]\n  S --> T[Keep top k singular values]\n  T --> C[Compression / PCA]',
      pitfalls: [
        'Projecting onto a vector without dividing by u · u.',
        'Forgetting to re-orthogonalise against all previous vectors in Gram–Schmidt.',
        'Assuming singular values can be negative — they are non-negative by construction.',
      ],
      scenario: {
        q: 'A 1000×1000 image matrix has only 20 significant singular values. What does that imply?',
        options: [
          'It can be stored approximately with ~40,000 numbers instead of 1,000,000',
          'It is not invertible',
          'It must be symmetric',
          'It has 20 zero eigenvalues',
        ],
        answer: 0,
        why: 'Rank-20 truncation stores 1000·20 (U) + 20 (Σ) + 20·1000 (Vᵀ) ≈ 40,020 values while preserving the dominant structure.',
      },
    },
  ],
};
