class Token {
    end: number;

    constructor(
        public text: string, 
        public index: number, 
        public isNumeric = false,
        public isXML = false
    ) {
        this.end = index + text.length;
    }
}

export = Token;