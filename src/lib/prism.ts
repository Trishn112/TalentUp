import Prism from "./prism-init";

// Import core languages and common components
import "prismjs/components/prism-clike";
import "prismjs/components/prism-c";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-go";

// Add custom DSA keywords and data structures for highlighting
const dsaKeywords = [
  "ListNode", "TreeNode", "Map", "Set", "Stack", "Queue", "PriorityQueue",
  "Deque", "ArrayList", "LinkedList", "HashMap", "HashSet", "TreeMap", "TreeSet",
  "Graph", "Trie", "Heap", "BinarySearchTree", "BST", "AVLTree", "RedBlackTree",
  "SegmentTree", "FenwickTree", "UnionFind", "DisjointSet", "Vector", "Pair",
  "Tuple", "Optional", "Stream", "Collections", "Arrays", "Math", "Solution"
];

const dsaRegex = new RegExp(`\\b(${dsaKeywords.join("|")})\\b`);

// Extend languages with DSA tokens
["javascript", "typescript", "python", "java", "cpp", "go"].forEach(lang => {
  if (Prism.languages[lang]) {
    Prism.languages[lang]["dsa-keyword"] = {
      pattern: dsaRegex,
      alias: "class-name"
    };
  }
});

export default Prism;
