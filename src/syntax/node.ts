import NodeKind from './nodeKind';

export default class Node {
    constructor (
        public kind: NodeKind,
        public start: number,
        public end: number,
        public text?: string,
        public children: Node[] = [],
        public parent?: Node) {
    }

    findChild(kind: NodeKind): Node {
        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i].kind === kind) {
                return this.children[i];
            }
        }
        return null;
    }

    findChildren(kind: NodeKind): Node[] {
        return this.children.filter(child => child.kind === kind);
    }

    getChildFrom(kind: NodeKind): Node[] {
        let child = this.findChild(kind);
        if (!child) {
            return this.children.slice(0);
        } else {
            let index = this.children.indexOf(child);
            return this.children.slice(index + 1);
        }
    }

    getChildUntil(kind: NodeKind): Node[] {
        let child = this.findChild(kind);
        if (!child) {
            return this.children.splice(0);
        } else {
            let index = this.children.indexOf(child);
            return this.children.slice(0, index);
        }
    }

    get lastChild(): Node {
        return this.children[this.children.length - 1];
    }
}
