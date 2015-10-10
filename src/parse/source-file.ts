function buildLineMap(text: string): number[] {
    const LINE_FEED = 10;
    const CARRIAGE_RETURN = 13;
    const LINE_SEPARATOR = 0x2028;
    const PARAGRAPH_SEPARATOR = 0x2029;
    const NEXT_LINE = 0x0085;

    let lineStart = 0;
    let index = 0;
    let lineMap: number[] = [];
    let length = text.length;

    while (index < length) {
        let c = text.charCodeAt(index);
        index++;
        if (c === CARRIAGE_RETURN && text.charCodeAt(index) === LINE_FEED) {
            index++;
        }
        switch (c) {
            default:
                break;
            case CARRIAGE_RETURN:
            case LINE_FEED:
            case NEXT_LINE:
            case LINE_SEPARATOR:
            case PARAGRAPH_SEPARATOR:
                lineMap.push(lineStart);
                lineStart = index;
                break;
        }
    }

    // Create a start for the final line.  
    lineMap.push(lineStart);

    return lineMap;
}


export interface LineAndCharacter {
    line: number;
    col: number;
}


export default class SourceFile {
    private lineMap: number[];

    constructor(
            public content: string,
            public path: string = null) {
        this.lineMap = buildLineMap(content);
    }

    getLineAndCharacterFromPosition(position: number): LineAndCharacter {
        let lineStarts = this.lineMap;
        if (position < 0 || position > this.content.length) {
            throw Error(`invalid position ${position}`);
        }

        let line = -1;
        if (position === this.content.length) {
            line = lineStarts.length - 1;
        } else {
            for (var i = 0; i < lineStarts.length; i++) {
                if (lineStarts[i] > position) {
                    break;
                }
                line = i;
            }
            line = line > 0 ? line : 0;
        }
        let col = position - lineStarts[line];
        return { line, col };
    }
}
