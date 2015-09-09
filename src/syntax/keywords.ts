export let AS = "as";
export let BREAK = "break";
export let CASE = "case";
export let CATCH = "catch";
export let CLASS = "class";
export let CONST = "const";
export let CONTINUE = "continue";
export let DEFAULT = "default";
export let DELETE = "delete";
export let DO = "do";
export let DYNAMIC = "dynamic";
export let EACH = "each";
export let ELSE = "else";
export let EOF = "__END__";
export let EXTENDS = "extends";
export let FINAL = "final";
export let FINALLY = "finally";
export let FOR = "for";
export let FUNCTION = "function";
export let GET = "get";
export let IF = "if";
export let IMPLEMENTS = "implements";
export let IMPORT = "import";
export let IN = "in";
export let INCLUDE = "include";
export let INCLUDE_AS2 = "#include";
export let INSTANCE_OF = "instanceof";
export let INTERFACE = "interface";
export let INTERNAL = "internal";
export let INTRINSIC = "intrinsic";
export let IS = "is";
export let NAMESPACE = "namespace";
export let NEW = "new";
export let OVERRIDE = "override";
export let PACKAGE = "package";
export let PRIVATE = "private";
export let PROTECTED = "protected";
export let PUBLIC = "public";
export let RETURN = "return";
export let THROW = "throw";
export let SET = "set";
export let STATIC = "static";
export let SUPER = "super";
export let SWITCH = "switch";
export let TRY = "try";
export let TYPEOF = "typeof";
export let USE = "use";
export let VAR = "var";
export let VOID = "void";
export let WHILE = "while";

export let TRUE = 'true';
export let FALSE = 'false';
export let NULL = 'null';
export let THIS = 'this';

var keywordsCheck:{ [index: string]: boolean } =
    Object.keys(exports)
        .reduce((result, key) => {
        var keyword:string = exports[key];
        result[keyword] = true;
        return result;
    }, <{ [index: string]: boolean }> {});

export function isKeyWord(text:string) {
    return !!keywordsCheck[text];
}
