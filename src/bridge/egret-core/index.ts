// import translations
let imports = new Map<RegExp, string>();
imports.set(/flash.[a-z]+\.([A-Za-z]+)/, "egret.$1");

export default {
    imports: imports
}
