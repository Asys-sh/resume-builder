class TrieNode {
    children = new Map<string, TrieNode>();
    isLeaf = false;
    constructor() {

    }
}


export class TrieManager {
    root: TrieNode;
    suggestions: string[] = [];
    sug_pref = '';
    constructor() {
        this.root = new TrieNode();
    }


    insert(word: string) {
        let node = this.root;
        for (const letter of word) {

            if (!node.children.has(letter)) {
                node.children.set(letter, new TrieNode())
            }
            node = node.children.get(letter)!

        }

        node.isLeaf = true;
    }


    search(word: string) {
        let node = this.root;

        for (const letter of word) {
            if (node.children.has(letter)) {
                node = node.children.get(letter)!
            } else {
                return false;
            }
        }
        return node.isLeaf;
    }


    startsWith(prefix: string) {
        let node = this.root;

        for (const letter of prefix) {
            if (node.children.has(letter)) {
                node = node.children.get(letter)!
            } else {
                return false;
            }
        }

        return node;
    }

    find_node_leaf(node: TrieNode, current_path: string) {
        const entries = node.children.entries();


        if (node.isLeaf) {
            this.suggestions.push(this.sug_pref + current_path)
        }

        for (const [key, children] of entries) {
            this.find_node_leaf(children, current_path + key)
        }

    }

    suggest(prefix: string): string[] {
        const node = this.startsWith(prefix);
        this.suggestions = [];
        this.sug_pref = prefix;

        if (node) {
            this.find_node_leaf(node, '')
        }

        return this.suggestions;
    }
}
