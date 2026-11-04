/**
 * Computer-science foundations: data structures, algorithms, operating systems.
 * Same layer contract as the mathematics catalogue.
 */

export const dataStructures = {
  slug: 'data-structures',
  title: 'Data Structures',
  discipline: 'Computer Science',
  level: 'Foundation → Advanced',
  icon: 'tree',
  summary:
    'Arrays to union-find — how memory layout and invariants decide whether your program is instant or unusable at scale.',
  layers: [
    {
      layer: 1,
      title: 'Arrays, Strings & Complexity',
      tier: 'FOUNDATION',
      minutes: 18,
      objectives: [
        'Explain contiguous memory and constant-time indexing',
        'Measure operations with big-O on realistic inputs',
        'Distinguish worst case, average case, and amortised cost',
        'Choose between a static array and a dynamic array',
      ],
      concepts: [
        {
          term: 'Array',
          definition:
            'A contiguous block of equal-sized elements addressed by index. Because the address is base + index × size, access is O(1).',
        },
        {
          term: 'Big-O notation',
          definition:
            'An upper bound on growth: f(n) = O(g(n)) means f grows no faster than a constant multiple of g for large n. It describes scaling, not seconds.',
        },
        {
          term: 'Amortised cost',
          definition:
            'The average cost per operation across a sequence. Dynamic array appends are O(1) amortised because resizing doubles capacity and happens geometrically rarely.',
        },
        {
          term: 'Cache locality',
          definition:
            'The performance benefit of accessing memory that is already in CPU cache. Sequential array scans beat pointer-chasing structures even at equal big-O.',
        },
      ],
      intuition:
        'An array is fast because it is boring: fixed stride, no indirection, perfect for the prefetcher. Complexity analysis explains the wall you hit at scale, but constants and cache behaviour decide close races. Insert at the front of an array and every later element must shift — that O(n) is the price of contiguity.',
      worked: {
        problem: 'A dynamic array holds 8 elements and doubles when full. How many total element copies occur across 16 appends starting from empty?',
        steps: [
          'Resizes happen at capacities 1, 2, 4, 8, 16 while growing to 17 elements.',
          'Copy counts: 1 + 2 + 4 + 8 + 16 = 31.',
          'Total work for 17 appends is 31 copies plus 17 writes.',
          'Copies per append ≈ 31/17 < 2, a constant — hence O(1) amortised.',
        ],
        answer: '31 copies for 17 appends: constant amortised overhead',
      },
      table: {
        caption: 'Dynamic array operations',
        head: ['Operation', 'Cost', 'Why'],
        rows: [
          ['Index a[i]', 'O(1)', 'Direct address arithmetic'],
          ['Append', 'O(1) amortised', 'Occasional doubling'],
          ['Insert at front', 'O(n)', 'Shift every later element'],
          ['Search unsorted', 'O(n)', 'Must inspect each element'],
        ],
      },
      diagram:
        'flowchart LR\n  A[Append] --> F{Capacity full?}\n  F -->|No| W[Write at length, O(1)]\n  F -->|Yes| D[Allocate 2× capacity]\n  D --> C[Copy n elements, O(n)]\n  C --> W\n  W --> R[Amortised O(1)]',
      pitfalls: [
        'Quoting big-O without constants when comparing two O(n) approaches.',
        'Forgetting that deleting from the middle of an array is O(n).',
        'Assuming string concatenation in a loop is free — it is often O(n²) overall.',
      ],
      scenario: {
        q: 'You need 10⁶ lookups by integer key where keys are dense 0…10⁶. Which structure is best?',
        options: ['Direct-indexed array', 'Balanced BST', 'Linked list', 'Hash table with chaining'],
        answer: 0,
        why: 'Dense integer keys let you index directly: O(1) with no hashing, no pointers, and perfect cache locality.',
      },
    },
    {
      layer: 2,
      title: 'Linked Lists, Stacks & Queues',
      tier: 'FOUNDATION',
      minutes: 20,
      objectives: [
        'Implement singly and doubly linked lists safely',
        'Apply LIFO and FIFO disciplines to real problems',
        'Recognise when a pointer structure beats an array',
        'Detect a cycle with Floyd\'s algorithm',
      ],
      concepts: [
        {
          term: 'Node',
          definition:
            'A record holding a value plus one or more references to other nodes. The structure lives in the links, not in contiguous memory.',
        },
        {
          term: 'Stack (LIFO)',
          definition:
            'A collection where the most recently pushed element is the first popped. Used for call frames, undo history, and depth-first traversal.',
        },
        {
          term: 'Queue (FIFO)',
          definition:
            'A collection where the earliest enqueued element is dequeued first. Used for scheduling, buffering, and breadth-first traversal.',
        },
        {
          term: 'Floyd\'s cycle detection',
          definition:
            'Move one pointer one step and another two steps; if they meet, a cycle exists. O(n) time, O(1) extra space.',
        },
      ],
      intuition:
        'Arrays optimise for random access; linked structures optimise for splicing. If your workload is "insert and delete at known positions", pointers win. If it is "scan and index", arrays win. A stack is a discipline, not a data structure — you can build one on an array or a list, and the constraint is what makes reasoning about it easy.',
      worked: {
        problem: 'Reverse a singly linked list in place.',
        steps: [
          'Keep three pointers: prev = null, curr = head, next = null.',
          'While curr exists: save next = curr.next.',
          'Point curr.next = prev (reverse the link).',
          'Advance prev = curr, curr = next.',
          'When the loop ends, prev is the new head.',
        ],
        answer: 'One pass, O(n) time, O(1) space, original links fully reversed',
      },
      table: {
        caption: 'Array versus linked list',
        head: ['Operation', 'Array', 'Linked list'],
        rows: [
          ['Index i', 'O(1)', 'O(n)'],
          ['Insert at head', 'O(n)', 'O(1)'],
          ['Delete given node', 'O(n)', 'O(1) with a back-pointer'],
          ['Memory overhead', 'Low', 'One or two pointers per node'],
        ],
      },
      diagram:
        'flowchart LR\n  H[head] --> N1["7 | next"]\n  N1 --> N2["4 | next"]\n  N2 --> N3["9 | null"]\n  N3 --> T[tail]\n  S[Stack: push/pop at head] -.-> H\n  Q[Queue: enqueue tail, dequeue head] -.-> H',
      pitfalls: [
        'Losing the rest of the list by overwriting next before saving it.',
        'Forgetting to update tail when the list becomes empty.',
        'Using a linked list where cache-friendly iteration dominates — arrays usually win.',
      ],
      scenario: {
        q: 'A browser needs "back" navigation with unlimited history. Which structure is the natural fit?',
        options: ['Stack', 'Queue', 'Min-heap', 'Hash table'],
        answer: 0,
        why: 'Back navigation is last-in-first-out: the most recently visited page is the first one you return to.',
      },
    },
    {
      layer: 3,
      title: 'Hash Tables & Trees',
      tier: 'INTERMEDIATE',
      minutes: 25,
      objectives: [
        'Explain hashing, load factor, and collision resolution',
        'Compare chaining with open addressing',
        'Insert, search, and delete in a binary search tree',
        'Choose an ordered structure when range queries matter',
      ],
      concepts: [
        {
          term: 'Hash function',
          definition:
            'A deterministic map from keys to buckets that spreads keys uniformly. A good hash is fast, stable within a run, and avalanche-sensitive.',
        },
        {
          term: 'Load factor',
          definition:
            'Entries divided by buckets. As it approaches 1, collisions and probe lengths explode, so tables resize (usually doubling) around 0.7.',
        },
        {
          term: 'Binary search tree (BST)',
          definition:
            'A tree where every left descendant is smaller and every right descendant larger than the node. Search, insert, and delete are O(h) for height h — O(log n) only when balanced.',
        },
        {
          term: 'Tree traversal',
          definition:
            'In-order (left, node, right) yields sorted output for a BST; pre-order and post-order suit serialisation and deletion respectively.',
        },
      ],
      intuition:
        'Hashing trades order for speed: find a key in roughly one step, but lose any notion of "next". Trees keep order at the cost of a logarithmic walk. That trade-off decides architecture: a session cache is a hash table, a range query over timestamps is a tree. Never assume a BST is balanced — a sorted insertion order degenerates it into a linked list.',
      worked: {
        problem: 'Insert 50, 30, 70, 20, 40, 60, 80 into an empty BST, then list an in-order traversal.',
        steps: [
          '50 becomes the root.',
          '30 < 50 goes left; 70 > 50 goes right.',
          '20 < 50, < 30 → left of 30. 40 < 50, > 30 → right of 30.',
          '60 > 50, < 70 → left of 70. 80 > 50, > 70 → right of 70.',
          'In-order traversal visits left subtree, node, right subtree at every level.',
          'Result is fully sorted because of the BST invariant.',
        ],
        answer: 'In-order: 20, 30, 40, 50, 60, 70, 80 — a perfectly balanced tree of height 3',
      },
      table: {
        caption: 'Hash table versus balanced BST',
        head: ['Requirement', 'Hash table', 'Balanced BST'],
        rows: [
          ['Exact lookup', 'O(1) average', 'O(log n)'],
          ['Sorted iteration', 'Not supported', 'O(n) in-order'],
          ['Range query', 'O(n) scan', 'O(log n + k)'],
          ['Worst case', 'O(n) with bad hashing', 'O(log n) guaranteed'],
        ],
      },
      diagram:
        'flowchart TD\n  K[Key] --> H[hash(key) % buckets]\n  H --> B[Bucket index]\n  B --> C{Collision?}\n  C -->|No| S[Store entry]\n  C -->|Yes| R[Chain or probe]\n  R --> L{Load factor > 0.7?}\n  L -->|Yes| G[Resize and rehash]\n  L -->|No| S',
      pitfalls: [
        'Using a mutable object as a key and then mutating it, making the entry unreachable.',
        'Assuming O(1) hash lookups without controlling hash quality and load factor.',
        'Deleting from a BST by simply replacing the node, orphaning subtrees.',
      ],
      scenario: {
        q: 'You need to fetch the 20 most recent events for a user by timestamp. What fits best?',
        options: [
          'A balanced BST keyed by timestamp, or an index ordered by time',
          'A hash table keyed by event id',
          'A stack of events',
          'A min-heap keyed by random id',
        ],
        answer: 0,
        why: 'The query is a range/order query, which needs an ordered structure; hashing destroys the ordering.',
      },
    },
    {
      layer: 4,
      title: 'Heaps, Tries & Graphs',
      tier: 'INTERMEDIATE',
      minutes: 28,
      objectives: [
        'Maintain heap order for priority queues',
        'Use a trie for prefix queries',
        'Represent graphs with adjacency lists and matrices',
        'Traverse graphs with BFS and DFS and explain when each is right',
      ],
      concepts: [
        {
          term: 'Heap invariant',
          definition:
            'In a min-heap every parent is ≤ its children, so the minimum is at the root. Push and pop are O(log n); building from an array is O(n).',
        },
        {
          term: 'Trie',
          definition:
            'A tree of characters where each path from the root spells a prefix. Lookup costs O(key length), independent of how many keys are stored.',
        },
        {
          term: 'Adjacency list',
          definition:
            'An array of neighbours per vertex, using O(V + E) space. Preferred for sparse graphs; adjacency matrices cost O(V²) but answer edge queries in O(1).',
        },
        {
          term: 'BFS vs DFS',
          definition:
            'Breadth-first explores level by level and finds shortest paths in unweighted graphs; depth-first dives along one branch and is natural for cycle detection, topological ordering, and backtracking.',
        },
      ],
      intuition:
        'Each structure encodes one question. A heap answers "what is most urgent?" without sorting everything. A trie answers "what starts with this prefix?" without scanning keys. A graph representation answers "who is adjacent?" and the traversal order then determines whether you learn distances (BFS) or structure and reachability (DFS).',
      worked: {
        problem: 'Insert 5, 3, 8, 1 into a min-heap (array representation) and show the array after each insertion.',
        steps: [
          'Insert 5 → [5].',
          'Insert 3 → [5, 3], sift up: parent 5 > 3, swap → [3, 5].',
          'Insert 8 → [3, 5, 8], parent 5 < 8 so stop.',
          'Insert 1 → [3, 5, 8, 1], parent at index 1 is 5 > 1, swap → [3, 1, 8, 5].',
          'New parent at index 0 is 3 > 1, swap → [1, 3, 8, 5].',
          'Root is now the minimum and every parent ≤ children.',
        ],
        answer: '[1, 3, 8, 5] with the minimum at index 0',
      },
      table: {
        caption: 'Structure → question it answers',
        head: ['Structure', 'Key operation', 'Cost'],
        rows: [
          ['Min-heap', 'Extract minimum', 'O(log n)'],
          ['Trie', 'Prefix lookup', 'O(length of key)'],
          ['Adjacency list', 'Neighbours of v', 'O(degree(v))'],
          ['Adjacency matrix', 'Is (u, v) an edge?', 'O(1)'],
        ],
      },
      diagram:
        'flowchart TD\n  G[Graph problem] --> W{Weighted?}\n  W -->|No, shortest hops| B[BFS with queue]\n  W -->|Yes| D[Dijkstra with heap]\n  G --> R{Structure or reachability?}\n  R -->|Yes| F[DFS with recursion/stack]\n  G --> P{Prefix matching?}\n  P -->|Yes| T[Trie]',
      pitfalls: [
        'Using a heap when you need full sorted order — a heap only guarantees the root.',
        'Storing a trie with per-node hash maps when a dense alphabet array would be faster.',
        'Running BFS with a stack (that is DFS) and then expecting shortest paths.',
      ],
      scenario: {
        q: 'A task scheduler must always run the highest-priority task next, with tasks arriving continuously. What do you use?',
        options: ['Binary heap (priority queue)', 'Hash table', 'Trie', 'Sorted linked list'],
        answer: 0,
        why: 'A heap gives O(log n) insertion and O(log n) extraction of the maximum, which is exactly the required access pattern.',
      },
    },
    {
      layer: 5,
      title: 'Advanced Structures & Trade-offs',
      tier: 'ADVANCED',
      minutes: 30,
      objectives: [
        'Apply union-find with path compression and union by rank',
        'Answer range queries with a segment tree',
        'Explain why balanced trees guarantee logarithmic height',
        'Reason about persistence, concurrency, and cache behaviour',
      ],
      concepts: [
        {
          term: 'Union-find (DSU)',
          definition:
            'Tracks disjoint sets with find and union. With path compression and union by rank, operations run in near-constant amortised time, O(α(n)).',
        },
        {
          term: 'Segment tree',
          definition:
            'A tree over array ranges storing an aggregate per node. Point updates and range queries are O(log n); it is the standard tool for range sums, minima, and maxima.',
        },
        {
          term: 'Balanced tree (AVL / red-black)',
          definition:
            'A BST that rebalances after each mutation to keep height O(log n). Red-black trees allow looser balance for fewer rotations, which is why standard libraries prefer them.',
        },
        {
          term: 'Persistent structure',
          definition:
            'A structure where updates return a new version sharing most nodes with the old one, enabling time-travel queries and cheap snapshots.',
        },
      ],
      intuition:
        'At the frontier, data-structure engineering is about amortising and sharing. Union-find flattens paths so future finds are cheaper; segment trees trade O(n) extra memory for logarithmic range answers; persistence trades pointer indirection for immutable history. The right answer usually follows from the exact mix of reads, writes, and queries — there is no universally best structure.',
      worked: {
        problem: 'Build a segment tree over [2, 4, 6, 8] for range sums and query the sum over indices 1…2.',
        steps: [
          'Leaves hold 2, 4, 6, 8.',
          'First level combines pairs: [2+4=6] and [6+8=14].',
          'Root holds 6 + 14 = 20.',
          'Query indices 1…2 straddles both halves: index 1 belongs to the left child, index 2 to the right child.',
          'Descend both sides, read leaf 4 and leaf 6, and combine them: 4 + 6 = 10.',
          'Only O(log n) nodes are visited, and the parent sums are reused for wider ranges.',
        ],
        answer: '10 in O(log n) by visiting only the covering nodes',
      },
      table: {
        caption: 'Advanced structures and their guarantees',
        head: ['Structure', 'Build', 'Query', 'Update'],
        rows: [
          ['Union-find', 'O(n)', 'O(α(n))', 'O(α(n)) union'],
          ['Segment tree', 'O(n)', 'O(log n)', 'O(log n)'],
          ['Red-black tree', 'O(n log n)', 'O(log n)', 'O(log n)'],
          ['Fenwick tree', 'O(n)', 'O(log n) prefix', 'O(log n) point'],
        ],
      },
      diagram:
        'flowchart LR\n  Q[Query workload] --> R{Range aggregate?}\n  R -->|Yes| S[Segment / Fenwick tree]\n  R -->|No| C[Connectivity?]\n  C -->|Yes| U[Union-find]\n  C -->|No| O[Ordered map]\n  O --> B[Balanced BST / B-tree]',
      pitfalls: [
        'Using union-find without path compression and then wondering why finds degrade.',
        'Forgetting that a segment tree needs a merge operation that is associative.',
        'Choosing a persistent structure for a write-heavy workload and paying allocation costs.',
      ],
      scenario: {
        q: 'You process 10⁶ edges in a graph and repeatedly ask whether two nodes are connected. Best structure?',
        options: ['Union-find with path compression', 'Adjacency matrix plus DFS per query', 'Balanced BST of edges', 'Trie of node ids'],
        answer: 0,
        why: 'Dynamic connectivity is exactly the union-find problem; near-constant amortised operations beat repeated traversals.',
      },
    },
  ],
};

export const algorithms = {
  slug: 'algorithms',
  title: 'Algorithms',
  discipline: 'Computer Science',
  level: 'Foundation → Advanced',
  icon: 'route',
  summary:
    'Correctness proofs, sorting, dynamic programming, graph algorithms, and the limits of tractability.',
  layers: [
    {
      layer: 1,
      title: 'Correctness & Growth',
      tier: 'FOUNDATION',
      minutes: 18,
      objectives: [
        'State a loop invariant and use it to prove correctness',
        'Compare functions with asymptotic notation',
        'Set up a recurrence for a recursive algorithm',
        'Distinguish upper bounds from tight bounds',
      ],
      concepts: [
        {
          term: 'Loop invariant',
          definition:
            'A property true before and after every iteration. Initialisation, maintenance, and termination together prove the loop computes the intended result.',
        },
        {
          term: 'Recurrence',
          definition:
            'An equation defining a function in terms of smaller inputs, e.g. T(n) = 2T(n/2) + n for merge sort.',
        },
        {
          term: 'Θ (tight bound)',
          definition:
            'f = Θ(g) when f is both O(g) and Ω(g): the growth rates match up to constants. Big-O alone only promises "no worse than".',
        },
        {
          term: 'Master theorem',
          definition:
            'Solves T(n) = aT(n/b) + f(n) by comparing f(n) with n^(log_b a): the larger term dominates, with a logarithmic factor when they tie.',
        },
      ],
      intuition:
        'An algorithm is a claim plus a proof. The claim is "this returns the right answer in this much time"; the proof is an invariant or a recurrence. Complexity notation is deliberately coarse because constants depend on hardware while growth decides whether the program survives a 100× larger input.',
      worked: {
        problem: 'Prove that binary search finds a target in a sorted array.',
        steps: [
          'Invariant: if the target exists, it lies within [lo, hi].',
          'Initialisation: lo = 0, hi = n − 1 covers the whole array, so the invariant holds.',
          'Maintenance: compare with the midpoint; discarding the half that cannot contain the target preserves the invariant.',
          'Termination: each step halves the range, so it becomes empty after ⌈log₂ n⌉ steps.',
          'If the range is empty and nothing matched, the target was never present — the invariant guarantees that conclusion.',
        ],
        answer: 'Correct by invariant; Θ(log n) comparisons',
      },
      table: {
        caption: 'Growth rates you will meet constantly',
        head: ['Notation', 'Name', 'n = 10⁶ feasibility'],
        rows: [
          ['O(1)', 'Constant', 'Instant'],
          ['O(log n)', 'Logarithmic', '20 steps'],
          ['O(n log n)', 'Linearithmic', 'Fine (sorting)'],
          ['O(n²)', 'Quadratic', 'Too slow beyond ~10⁴'],
          ['O(2ⁿ)', 'Exponential', 'Only tiny n'],
        ],
      },
      diagram:
        'flowchart LR\n  C[Claim] --> I[Invariant or recurrence]\n  I --> B[Base case]\n  B --> S[Inductive step]\n  S --> T[Termination]\n  T --> R[Complexity bound]',
      pitfalls: [
        'Confusing O with Θ and calling a loose upper bound tight.',
        'Writing an invariant that is not actually preserved by the loop body.',
        'Ignoring the base case in a recursive proof.',
      ],
      scenario: {
        q: 'T(n) = 2T(n/2) + n. What is the tight bound?',
        options: ['Θ(n log n)', 'Θ(n)', 'Θ(n²)', 'Θ(log n)'],
        answer: 0,
        why: 'a = 2, b = 2 gives n^(log₂2) = n, which matches f(n) = n, so the master theorem contributes an extra log factor: Θ(n log n).',
      },
    },
    {
      layer: 2,
      title: 'Sorting & Searching',
      tier: 'FOUNDATION',
      minutes: 20,
      objectives: [
        'Trace merge sort and quicksort on a small array',
        'Explain why comparison sorting is Ω(n log n)',
        'Implement binary search over the answer space',
        'Choose a stable sort when order of equals matters',
      ],
      concepts: [
        {
          term: 'Stability',
          definition:
            'A sort is stable when equal keys keep their original relative order. Essential when sorting by one field after another.',
        },
        {
          term: 'Divide and conquer',
          definition:
            'Split the problem, solve the parts recursively, then combine. Merge sort splits by position; quicksort splits by pivot value.',
        },
        {
          term: 'Partition',
          definition:
            'Quicksort\'s core step: rearrange so elements left of the pivot are smaller and those right are larger, in linear time and in place.',
        },
        {
          term: 'Binary search on the answer',
          definition:
            'When a predicate is monotone in a numeric answer, binary search the value range even without an array — e.g. the minimum ship capacity to deliver in D days.',
        },
      ],
      intuition:
        'Sorting is the canonical divide-and-conquer exercise, but the real lesson is about information: each comparison yields one bit, and n! orderings need log₂(n!) ≈ n log n bits, so no comparison sort can beat that. Binary search is the same idea applied to a monotone predicate rather than a list.',
      worked: {
        problem: 'Trace merge sort on [5, 2, 9, 1].',
        steps: [
          'Split into [5, 2] and [9, 1].',
          'Split again into [5], [2], [9], [1].',
          'Merge [5] and [2] → [2, 5].',
          'Merge [9] and [1] → [1, 9].',
          'Merge [2, 5] and [1, 9]: take 1, then 2, then 5, then 9 → [1, 2, 5, 9].',
        ],
        answer: '[1, 2, 5, 9] with log₂4 = 2 levels of merges',
      },
      table: {
        caption: 'Sorting algorithms compared',
        head: ['Algorithm', 'Average', 'Worst', 'Stable', 'In place'],
        rows: [
          ['Merge sort', 'O(n log n)', 'O(n log n)', 'Yes', 'No'],
          ['Quicksort', 'O(n log n)', 'O(n²)', 'No', 'Yes'],
          ['Heapsort', 'O(n log n)', 'O(n log n)', 'No', 'Yes'],
          ['Insertion sort', 'O(n²)', 'O(n²)', 'Yes', 'Yes'],
        ],
      },
      diagram:
        'flowchart TD\n  A["[5,2,9,1]"] --> L["[5,2]"]\n  A --> R["[9,1]"]\n  L --> L1["[5]"]\n  L --> L2["[2]"]\n  R --> R1["[9]"]\n  R --> R2["[1]"]\n  L1 --> M1["[2,5]"]\n  L2 --> M1\n  R1 --> M2["[1,9]"]\n  R2 --> M2\n  M1 --> M["[1,2,5,9]"]\n  M2 --> M',
      pitfalls: [
        'Assuming quicksort is always faster — on adversarial or sorted input with a bad pivot it degrades.',
        'Using an unstable sort for multi-key ordering.',
        'Writing binary search with an off-by-one that skips the last element.',
      ],
      scenario: {
        q: 'You must sort 10⁷ customer records by last name, then by first name. Which is correct?',
        options: [
          'Sort by first name, then stably by last name',
          'Sort by last name only',
          'Sort by last name, then unstably by first name',
          'Use quicksort twice',
        ],
        answer: 0,
        why: 'Sorting by the secondary key first and then stably by the primary key preserves the secondary order within equal primary keys.',
      },
    },
    {
      layer: 3,
      title: 'Greedy & Dynamic Programming',
      tier: 'INTERMEDIATE',
      minutes: 26,
      objectives: [
        'Identify optimal substructure and overlapping subproblems',
        'Prove a greedy choice is safe or find a counterexample',
        'Choose between memoisation and tabulation',
        'Reconstruct a solution from a DP table',
      ],
      concepts: [
        {
          term: 'Greedy choice property',
          definition:
            'A locally best choice can be part of some global optimum. Interval scheduling has it; 0/1 knapsack does not.',
        },
        {
          term: 'Optimal substructure',
          definition:
            'An optimal solution contains optimal solutions to subproblems, which is what makes recursion on subproblems valid.',
        },
        {
          term: 'Memoisation',
          definition:
            'Top-down recursion that caches results per state. Easy to write from the recurrence; risks stack depth.',
        },
        {
          term: 'Tabulation',
          definition:
            'Bottom-up filling of a table in dependency order. No recursion overhead and allows space optimisation to the last row.',
        },
      ],
      intuition:
        'Greedy says "commit now and never look back" — fast, but only valid if you can prove exchange arguments. DP says "consider every state once and remember" — slower but robust. Recognise DP when the same subproblem appears in multiple branches; that overlap is what makes caching worth it.',
      worked: {
        problem: 'Find the longest common subsequence of "ABCBDAB" and "BDCABA".',
        steps: [
          'Define dp[i][j] = LCS length of the first i and first j characters.',
          'If characters match: dp[i][j] = dp[i−1][j−1] + 1.',
          'Otherwise: dp[i][j] = max(dp[i−1][j], dp[i][j−1]).',
          'Fill row by row; the bottom-right cell gives the length.',
          'Backtrack from the bottom-right, moving diagonally on matches, to recover the string.',
        ],
        answer: 'LCS length 4, for example "BCBA"',
      },
      table: {
        caption: 'Greedy works versus greedy fails',
        head: ['Problem', 'Greedy valid?', 'Why'],
        rows: [
          ['Interval scheduling', 'Yes', 'Earliest finish time exchange argument'],
          ['Huffman coding', 'Yes', 'Two least frequent leaves can always be siblings'],
          ['0/1 knapsack', 'No', 'Best ratio item can block a better combination'],
          ['Coin change (arbitrary coins)', 'No', 'Greedy misses optimal combinations'],
        ],
      },
      diagram:
        'flowchart TD\n  P[Problem] --> O{Overlapping subproblems?}\n  O -->|No| G[Try greedy + exchange proof]\n  O -->|Yes| S[Define state]\n  S --> R[Write recurrence]\n  R --> M{Recursion depth safe?}\n  M -->|Yes| T[Memoise top-down]\n  M -->|No| B[Tabulate bottom-up]\n  B --> X[Optimise space]\n  T --> X',
      pitfalls: [
        'Assuming greedy is correct because it passes the sample tests — construct a counterexample instead.',
        'Defining a DP state that omits information needed to make future decisions.',
        'Forgetting to reconstruct the path when the answer requires the solution, not just its value.',
      ],
      scenario: {
        q: 'Which problem is guaranteed solvable optimally by a greedy algorithm?',
        options: [
          'Selecting the maximum number of non-overlapping intervals',
          '0/1 knapsack with arbitrary weights',
          'Longest common subsequence',
          'Minimum coins for arbitrary denominations',
        ],
        answer: 0,
        why: 'Choosing the interval with the earliest finishing time is provably safe by an exchange argument; the others need DP.',
      },
    },
    {
      layer: 4,
      title: 'Graph Algorithms',
      tier: 'INTERMEDIATE',
      minutes: 28,
      objectives: [
        'Run Dijkstra with a priority queue and justify each step',
        'Detect cycles and topologically sort a DAG',
        'Build a minimum spanning tree with Kruskal or Prim',
        'Choose the right algorithm from edge weights and graph shape',
      ],
      concepts: [
        {
          term: 'Dijkstra\'s algorithm',
          definition:
            'Greedily settles the closest unsettled vertex, relaxing its edges. Correct for non-negative weights; O((V + E) log V) with a binary heap.',
        },
        {
          term: 'Topological sort',
          definition:
            'A linear ordering of a DAG where every edge points forward. Produced by DFS post-order reversal or Kahn\'s in-degree peeling.',
        },
        {
          term: 'Minimum spanning tree',
          definition:
            'A subset of edges connecting all vertices with minimum total weight and no cycles. Kruskal sorts edges; Prim grows a tree from one vertex.',
        },
        {
          term: 'Relaxation',
          definition:
            'Updating dist[v] to dist[u] + w(u, v) when that is smaller. Every shortest-path algorithm is a different relaxation order.',
        },
      ],
      intuition:
        'Graph algorithms differ mainly in the order they settle vertices. Dijkstra settles by best-known distance (valid only when no negative edges), BFS by hop count, Bellman-Ford by repeated passes. Topological order turns a dependency graph into a schedule; MST connects everything as cheaply as possible without caring about the route between any pair.',
      worked: {
        problem: 'Run Dijkstra from A with edges A–B (4), A–C (1), C–B (2), B–D (5), C–D (8).',
        steps: [
          'dist: A=0, others ∞. Settle A.',
          'Relax: B=4, C=1. Next settle C (1).',
          'Relax C→B: 1 + 2 = 3 < 4, so B=3. C→D: 1 + 8 = 9.',
          'Settle B (3). Relax B→D: 3 + 5 = 8 < 9, so D=8.',
          'Settle D (8). Final distances: A 0, C 1, B 3, D 8.',
        ],
        answer: 'dist = {A: 0, B: 3, C: 1, D: 8}',
      },
      table: {
        caption: 'Shortest path algorithm selection',
        head: ['Setting', 'Algorithm', 'Complexity'],
        rows: [
          ['Unweighted', 'BFS', 'O(V + E)'],
          ['Non-negative weights', 'Dijkstra', 'O((V + E) log V)'],
          ['Negative edges, no negative cycle', 'Bellman-Ford', 'O(VE)'],
          ['All pairs, dense', 'Floyd-Warshall', 'O(V³)'],
        ],
      },
      diagram:
        'flowchart TD\n  S[Source] --> Q[Priority queue dist = 0]\n  Q --> U[Pop minimum unsettled]\n  U --> R[Relax outgoing edges]\n  R --> P{Improved a distance?}\n  P -->|Yes| Q\n  P -->|No| N{Queue empty?}\n  N -->|No| Q\n  N -->|Yes| D[Distances final]',
      pitfalls: [
        'Running Dijkstra with negative edge weights, where a settled vertex can later improve.',
        'Forgetting the visited set and re-processing vertices forever.',
        'Confusing MST total weight with shortest-path distance in the same graph.',
      ],
      scenario: {
        q: 'A build system must order 500 packages so dependencies compile first, and the graph has no cycles. Which algorithm?',
        options: ['Topological sort', 'Dijkstra', 'Kruskal', 'Floyd-Warshall'],
        answer: 0,
        why: 'Dependency ordering on a DAG is exactly topological sorting; cycles indicate an impossible build.',
      },
    },
    {
      layer: 5,
      title: 'Hardness & Approximation',
      tier: 'ADVANCED',
      minutes: 30,
      objectives: [
        'Distinguish P, NP, and NP-complete',
        'Use a reduction to prove a problem is hard',
        'Design and bound an approximation algorithm',
        'Apply branch-and-bound or heuristics responsibly',
      ],
      concepts: [
        {
          term: 'Polynomial-time reduction',
          definition:
            'A polynomial transformation from problem A to B such that solving B solves A. It transfers hardness: if A is hard and A ≤ₚ B, then B is hard.',
        },
        {
          term: 'NP-complete',
          definition:
            'A problem in NP to which every NP problem reduces. A polynomial solution to any one of them would solve all of them.',
        },
        {
          term: 'Approximation ratio',
          definition:
            'For minimisation, the worst-case ratio ALG/OPT over all instances. A 2-approximation guarantees the answer is never more than twice optimal.',
        },
        {
          term: 'Branch and bound',
          definition:
            'Exact search with pruning: maintain a best-known solution and discard branches whose optimistic bound cannot beat it.',
        },
      ],
      intuition:
        'Not every problem has a fast exact algorithm, and pretending otherwise ships products that hang. The professional move is to classify the problem, then choose: exact for small instances, approximation with a proven ratio, or a heuristic with honest measured performance. Reductions are how you classify — you do not need to reinvent the hardness proof.',
      worked: {
        problem: 'Show that the 2-approximation greedy for vertex cover is valid.',
        steps: [
          'Algorithm: repeatedly pick an uncovered edge (u, v), add both endpoints, mark all their edges covered.',
          'The picked edges form a matching: no two share an endpoint, because shared endpoints would already be covered.',
          'Any valid cover must contain at least one endpoint per matching edge, so OPT ≥ |matching|.',
          'The algorithm adds both endpoints of each matching edge, so ALG = 2|matching|.',
          'Therefore ALG ≤ 2·OPT: a factor-2 guarantee.',
        ],
        answer: 'Every chosen edge needs a distinct cover vertex, so ALG = 2|M| ≤ 2·OPT',
      },
      table: {
        caption: 'Coping strategies for hard problems',
        head: ['Strategy', 'Guarantee', 'Good when'],
        rows: [
          ['Exact DP', 'Optimal', 'State space is small'],
          ['Branch and bound', 'Optimal', 'Bounds prune most branches'],
          ['Approximation', 'Proven ratio', 'A near-answer is acceptable'],
          ['Heuristic / local search', 'None, empirical', 'Instances are huge and typical'],
        ],
      },
      diagram:
        'flowchart TD\n  P[New problem] --> A{Polynomial algorithm known?}\n  A -->|Yes| E[Use it]\n  A -->|No| R[Reduce from a known NP-complete problem]\n  R --> H{Hard?}\n  H -->|No| E\n  H -->|Yes| S{Instance size?}\n  S -->|Small| X[Exact: DP / branch and bound]\n  S -->|Large| Y[Approximation with ratio]\n  Y --> Z[Measure and document quality]',
      pitfalls: [
        'Calling a problem NP-hard without a reduction, which is a guess rather than a proof.',
        'Reporting a heuristic as if it were optimal.',
        'Ignoring input structure that makes an exponential algorithm fine in practice.',
      ],
      scenario: {
        q: 'A 2-approximation returns cost 30 on an instance. What can you conclude about OPT?',
        options: ['OPT ≥ 15', 'OPT = 15', 'OPT ≤ 15', 'Nothing without more information'],
        answer: 0,
        why: 'For minimisation, ALG ≤ 2·OPT implies OPT ≥ ALG/2 = 15; the true optimum could be anywhere from 15 to 30.',
      },
    },
  ],
};

export const operatingSystems = {
  slug: 'operating-systems',
  title: 'Operating Systems',
  discipline: 'Computer Science',
  level: 'Foundation → Advanced',
  icon: 'cpu',
  summary:
    'Processes, scheduling, virtual memory, file systems, and the isolation machinery behind every container you deploy.',
  layers: [
    {
      layer: 1,
      title: 'Processes & Program Execution',
      tier: 'FOUNDATION',
      minutes: 18,
      objectives: [
        'Describe what a process owns that a program does not',
        'Trace fork, exec, and wait through a shell command',
        'Explain a context switch and its cost',
        'Identify the states in a process lifecycle',
      ],
      concepts: [
        {
          term: 'Process',
          definition:
            'A running instance of a program with its own address space, registers, open file descriptors, and kernel bookkeeping.',
        },
        {
          term: 'Process control block (PCB)',
          definition:
            'The kernel structure storing a process\'s state: registers, program counter, scheduling info, memory maps, and descriptor tables.',
        },
        {
          term: 'fork / exec',
          definition:
            'fork() clones the current process (copy-on-write); exec() replaces the image with a new program. Together they implement launching a command.',
        },
        {
          term: 'Context switch',
          definition:
            'Saving one process\'s registers and restoring another\'s. Costs microseconds and pollutes caches, so schedulers avoid gratuitous switches.',
        },
      ],
      intuition:
        'A program is a file; a process is a claim on the machine. The kernel multiplexes many claims onto few CPUs by switching rapidly, which creates the illusion of simultaneity. fork+exec is a deliberate two-step design: the child can adjust (redirect descriptors, drop privileges) before becoming the target program.',
      worked: {
        problem: 'A shell runs `wc -l < notes.txt`. Describe the system calls.',
        steps: [
          'The shell forks; the child receives a duplicate of the shell\'s memory image.',
          'The child opens notes.txt read-only and dup2()s the descriptor onto stdin.',
          'The child calls execvp("wc", ["wc", "-l"]), replacing its image with wc.',
          'wc reads stdin to EOF, prints the count, and exits.',
          'The shell wait()s, reaps the exit status, and prints the next prompt.',
        ],
        answer: 'fork → open/dup2 → exec → exit → wait',
      },
      table: {
        caption: 'Process states',
        head: ['State', 'Meaning', 'Typical transition'],
        rows: [
          ['New', 'Being created', '→ Ready after admission'],
          ['Ready', 'Runnable, awaiting CPU', '→ Running on dispatch'],
          ['Running', 'Executing on a core', '→ Ready on preemption, → Blocked on I/O'],
          ['Blocked', 'Waiting on an event', '→ Ready when the event fires'],
          ['Terminated', 'Exited, awaiting reaping', 'Zombie until wait()'],
        ],
      },
      diagram:
        'stateDiagram-v2\n  [*] --> New\n  New --> Ready\n  Ready --> Running\n  Running --> Ready: preempted\n  Running --> Blocked: I/O wait\n  Blocked --> Ready: I/O complete\n  Running --> Terminated: exit\n  Terminated --> [*]: reaped',
      pitfalls: [
        'Thinking fork() copies all memory immediately — it is copy-on-write.',
        'Forgetting that exec() only returns if it fails.',
        'Ignoring zombie processes, which consume PID table entries until reaped.',
      ],
      scenario: {
        q: 'Why does a shell fork before exec instead of just exec-ing directly?',
        options: [
          'So the child can change its environment (fds, limits, privileges) before replacing its image',
          'Because exec cannot run built-in commands',
          'Because fork is faster than exec',
          'To keep the parent\'s memory shared for speed',
        ],
        answer: 0,
        why: 'The intermediate process is the place to set up redirections and permissions; the shell itself must survive to accept the next command.',
      },
    },
    {
      layer: 2,
      title: 'Threads, Scheduling & Synchronization',
      tier: 'FOUNDATION',
      minutes: 22,
      objectives: [
        'Contrast threads with processes for sharing and isolation',
        'Compare scheduling policies by their goals',
        'Identify race conditions and fix them with mutual exclusion',
        'Recognise the four conditions for deadlock',
      ],
      concepts: [
        {
          term: 'Thread',
          definition:
            'An execution context inside a process, sharing its address space and descriptors but owning its own stack, registers, and program counter.',
        },
        {
          term: 'Race condition',
          definition:
            'A defect where the result depends on unpredictable interleaving of concurrent operations on shared state, typically a read-modify-write.',
        },
        {
          term: 'Mutex',
          definition:
            'A lock with atomic acquire/release that guarantees mutual exclusion. Correct use requires a consistent ordering to avoid deadlock.',
        },
        {
          term: 'Deadlock',
          definition:
            'A cycle of threads each holding a resource the next needs. Requires mutual exclusion, hold-and-wait, no preemption, and circular wait.',
        },
      ],
      intuition:
        'Threads are cheap because they share memory — and dangerous for exactly the same reason. Scheduling is policy: throughput favours long quanta, latency favours short ones, and fairness needs ageing. Deadlock is prevented by breaking one of its four conditions, most practically by imposing a global lock order.',
      worked: {
        problem: 'Two threads run `counter++` 10⁶ times each. The result is often less than 2×10⁶. Explain and fix.',
        steps: [
          'counter++ compiles to load, add, store — three separate instructions.',
          'Both threads can load the same value before either stores, losing an increment.',
          'The critical section is the read-modify-write, not the source line.',
          'Fix: guard the update with a mutex, or use an atomic fetch-and-add instruction.',
          'With a lock, the final value is exactly 2×10⁶ but throughput drops to serialized updates.',
        ],
        answer: 'Lost updates from non-atomic increments; use a mutex or atomic add',
      },
      table: {
        caption: 'Scheduling policies',
        head: ['Policy', 'Strength', 'Weakness'],
        rows: [
          ['FCFS', 'Simple, no starvation', 'Convoy effect with long jobs'],
          ['Round robin', 'Responsive, fair', 'Many context switches'],
          ['Priority + ageing', 'Honours importance', 'Tuning ageing is delicate'],
          ['CFS / fair share', 'Proportional fairness', 'Complex accounting'],
        ],
      },
      diagram:
        'flowchart TD\n  A[Shared mutable state] --> B{Accessed concurrently?}\n  B -->|No| S[Safe]\n  B -->|Yes| C{Read-modify-write?}\n  C -->|Yes| R[Race condition]\n  R --> M[Add mutex or atomic]\n  M --> O[Define lock ordering]\n  O --> D[Deadlock avoided if consistent]',
      pitfalls: [
        'Holding a lock across blocking I/O, serialising the whole service.',
        'Acquiring two locks in different orders in different code paths.',
        'Assuming a single-line expression is atomic.',
      ],
      scenario: {
        q: 'Thread A locks X then Y; thread B locks Y then X. What is the outcome?',
        options: [
          'Deadlock is possible',
          'The kernel resolves it automatically',
          'A race condition, but no deadlock',
          'Only one thread runs, so it is safe',
        ],
        answer: 0,
        why: 'Each holds one resource and waits for the other: circular wait plus hold-and-wait is a textbook deadlock. A global lock order prevents it.',
      },
    },
    {
      layer: 3,
      title: 'Memory & Virtual Address Spaces',
      tier: 'INTERMEDIATE',
      minutes: 24,
      objectives: [
        'Translate a virtual address through a page table',
        'Explain demand paging and page faults',
        'Use the TLB to reason about real access cost',
        'Diagnose thrashing and choose a replacement policy',
      ],
      concepts: [
        {
          term: 'Page',
          definition:
            'A fixed-size block of virtual memory (commonly 4 KiB) mapped to a physical frame. Paging eliminates external fragmentation.',
        },
        {
          term: 'Page table',
          definition:
            'A per-process structure mapping virtual page numbers to frame numbers plus permission bits. Multi-level tables avoid storing unused mappings.',
        },
        {
          term: 'Page fault',
          definition:
            'A trap raised when a page is not resident. The kernel loads it from disk or swap, updates the table, and resumes the instruction.',
        },
        {
          term: 'Thrashing',
          definition:
            'A state where the working set exceeds physical memory, so nearly every access faults and throughput collapses despite high CPU use.',
        },
      ],
      intuition:
        'Virtual memory decouples the addresses a program uses from physical locations, which buys isolation, relocation, and lazy allocation. The cost is an extra translation per access, hidden by the TLB. Performance collapses when the working set no longer fits — not when memory is "full", but when the reuse distance exceeds what caches can hold.',
      worked: {
        problem: 'A 32-bit address space uses 4 KiB pages. How many pages exist, and how large is a single-level page table with 4-byte entries?',
        steps: [
          'Page size 4 KiB = 2¹², so the offset uses 12 bits.',
          'Virtual page number uses 32 − 12 = 20 bits → 2²⁰ ≈ 1,048,576 pages.',
          'Each entry is 4 bytes, so the table is 2²⁰ × 4 B = 4 MiB per process.',
          'That is too large to keep resident for thousands of processes, motivating multi-level or hashed tables.',
        ],
        answer: '2²⁰ pages; 4 MiB per single-level table per process',
      },
      table: {
        caption: 'Page replacement policies',
        head: ['Policy', 'Rule', 'Known pathology'],
        rows: [
          ['FIFO', 'Evict oldest', 'Belady\'s anomaly: more frames, more faults'],
          ['LRU', 'Evict least recently used', 'Expensive to implement exactly'],
          ['Clock', 'Approximate LRU with a reference bit', 'Slightly worse than LRU'],
          ['OPT', 'Evict the page used farthest in future', 'Unimplementable, used as a bound'],
        ],
      },
      diagram:
        'flowchart LR\n  V[Virtual address] --> P[Page number + offset]\n  P --> T{TLB hit?}\n  T -->|Yes| F[Physical frame]\n  T -->|No| W[Walk page table]\n  W --> R{Present?}\n  R -->|No| PF[Page fault: load from disk]\n  PF --> W\n  R -->|Yes| F\n  F --> A[Access memory]',
      pitfalls: [
        'Confusing page size with frame size — they are equal by definition.',
        'Assuming adding swap always helps; it can turn latency problems into thrashing.',
        'Forgetting that each process has its own page table and address space.',
      ],
      scenario: {
        q: 'A database server shows low CPU but constant disk reads and terrible latency. Most likely cause?',
        options: [
          'Working set exceeds available memory, causing thrashing',
          'Too many CPU cores',
          'The TLB is too large',
          'Page size is too small for the kernel',
        ],
        answer: 0,
        why: 'High fault-driven I/O with idle CPU is the signature of thrashing: memory pressure forces continuous page replacement.',
      },
    },
    {
      layer: 4,
      title: 'File Systems & I/O',
      tier: 'INTERMEDIATE',
      minutes: 26,
      objectives: [
        'Trace a read() from syscall to disk',
        'Explain inodes and directory entries',
        'Reason about journaling and crash consistency',
        'Choose between buffered, direct, and memory-mapped I/O',
      ],
      concepts: [
        {
          term: 'Inode',
          definition:
            'On-disk metadata for a file: owner, permissions, size, timestamps, and block pointers — but not its name. Names live in directories.',
        },
        {
          term: 'Journaling',
          definition:
            'Writing intended metadata changes to a log before applying them, so a crash can be replayed or discarded, guaranteeing a consistent file system.',
        },
        {
          term: 'Page cache',
          definition:
            'Kernel memory caching file contents. Most reads are served from RAM; writeback flushes dirty pages asynchronously.',
        },
        {
          term: 'Memory-mapped I/O',
          definition:
            'Mapping a file into the address space so loads and stores become page faults instead of syscalls, trading explicit calls for fault overhead.',
        },
      ],
      intuition:
        'Storage is slow, so the OS inserts layers: page cache, block scheduler, device cache. Every layer trades durability for speed. A file system\'s real job is not storing bytes but keeping metadata consistent when power disappears mid-write, which is why journaling exists.',
      worked: {
        problem: 'Trace `read(fd, buf, 4096)` for a file not in cache.',
        steps: [
          'The process traps into the kernel; the descriptor resolves to the open file description and inode.',
          'The page cache is checked; the page is absent, so a block I/O request is queued.',
          'The disk controller performs the transfer; the thread blocks meanwhile.',
          'The page is inserted into the cache and marked up to date.',
          'Data is copied to the user buffer, and read() returns 4096.',
        ],
        answer: 'syscall → inode → page cache miss → block I/O → cache fill → copy-out',
      },
      table: {
        caption: 'I/O modes',
        head: ['Mode', 'Latency profile', 'Durability', 'Use when'],
        rows: [
          ['Buffered read/write', 'Fast, cached', 'Deferred', 'General workloads'],
          ['O_DIRECT', 'Slow per call', 'Bypasses cache', 'Databases managing their own cache'],
          ['fsync after write', 'Slow but bounded', 'Durable on return', 'Committing transactions'],
          ['mmap', 'Fault-driven', 'msync required', 'Large read-mostly files'],
        ],
      },
      diagram:
        'flowchart LR\n  A[read()] --> B[VFS layer]\n  B --> C{Page cache hit?}\n  C -->|Yes| H[Copy to user buffer]\n  C -->|No| D[Block I/O request]\n  D --> E[Device driver]\n  E --> F[Disk]\n  F --> G[Fill page cache]\n  G --> H',
      pitfalls: [
        'Assuming write() without fsync survives a crash — it may sit in cache.',
        'Treating a directory as a file with contents; it is a name-to-inode mapping.',
        'Using O_DIRECT for small random reads and losing cache benefits.',
      ],
      scenario: {
        q: 'Why does a database call fsync after committing a transaction?',
        options: [
          'To force buffered data to stable storage before reporting success',
          'To free page cache memory',
          'To bypass the page cache for reads',
          'To compress the write-ahead log',
        ],
        answer: 0,
        why: 'Without fsync the commit may still be in volatile cache; durability requires an explicit flush to persistent media.',
      },
    },
    {
      layer: 5,
      title: 'Concurrency at Scale & Isolation',
      tier: 'ADVANCED',
      minutes: 30,
      objectives: [
        'Explain memory ordering and acquire/release semantics',
        'Compare futex-based locks and lock-free structures',
        'Describe how namespaces and cgroups create containers',
        'Reason about isolation failure modes in multi-tenant systems',
      ],
      concepts: [
        {
          term: 'Memory ordering',
          definition:
            'The rules governing when one core\'s writes become visible to another. Acquire/release barriers prevent reordering across critical sections without full serialisation.',
        },
        {
          term: 'Futex',
          definition:
            'Fast userspace mutex: an atomic check in user space, falling back to a kernel wait only under contention, avoiding a syscall on the fast path.',
        },
        {
          term: 'Lock-free structure',
          definition:
            'An algorithm guaranteeing system-wide progress even if a thread stalls, typically via compare-and-swap loops rather than blocking locks.',
        },
        {
          term: 'Namespace / cgroup',
          definition:
            'Namespaces virtualise what a process can see (PIDs, mounts, network); cgroups limit what it can use (CPU, memory, I/O). Together they approximate a container.',
        },
      ],
      intuition:
        'At scale, the bottleneck is often coordination, not computation. Each mechanism pushes contention somewhere cheaper: futexes keep uncontended locks in user space; lock-free queues replace blocking with retry; containers replace virtual machines with kernel-level partitioning. All of them assume the hardware\'s memory model is respected — compiler and CPU reordering break naive flags.',
      worked: {
        problem: 'Two threads: writer sets data then flag; reader spins on flag then reads data. Why can this fail?',
        steps: [
          'Without ordering constraints, the compiler or CPU may publish flag before data.',
          'The reader can observe flag = 1 and still read stale data.',
          'Fix: store flag with release semantics after writing data.',
          'Reader must load flag with acquire semantics before reading data.',
          'This creates a happens-before edge with no full barrier and no kernel involvement.',
        ],
        answer: 'Publish with release, consume with acquire — otherwise the data race is real',
      },
      table: {
        caption: 'Isolation mechanisms',
        head: ['Mechanism', 'Isolates', 'Not isolated'],
        rows: [
          ['Namespaces', 'View of PIDs, mounts, net, users', 'Kernel itself'],
          ['cgroups v2', 'CPU, memory, I/O budgets', 'Kernel vulnerabilities'],
          ['seccomp', 'Allowed syscalls', 'Logic bugs in allowed calls'],
          ['VM / microVM', 'Entire kernel', 'Hardware side channels'],
        ],
      },
      diagram:
        'flowchart TD\n  P[Process] --> N[Namespaces: what it sees]\n  P --> C[cgroups: what it uses]\n  P --> S[seccomp: what it can call]\n  N --> O[Container]\n  C --> O\n  S --> O\n  O -.->|"shared kernel"| K[Kernel attack surface]\n  K --> V[MicroVM if stronger isolation needed]',
      pitfalls: [
        'Assuming a container is a security boundary equal to a VM — it shares the host kernel.',
        'Using a plain boolean flag across threads without atomics and expecting visibility.',
        'Replacing a correct mutex with a lock-free structure before measuring contention.',
      ],
      scenario: {
        q: 'You must run untrusted customer code. Which isolation is strongest?',
        options: [
          'A microVM with its own kernel, or a separate physical host',
          'A container with namespaces and cgroups',
          'seccomp filters on the host process',
          'Dropping Linux capabilities inside a container',
        ],
        answer: 0,
        why: 'Containers share the host kernel, so a kernel exploit escapes them; a VM boundary adds a hypervisor layer.',
      },
    },
  ],
};
