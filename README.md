#as3-to-typescript

> A tool that helps porting as3 codebase to typescript

`ranch-client` project could've been completely syntatically converted using
this tool.

Please see known issues and more detailed usage info on [REPORT.md](REPORT.md).

This project is a fork of
[simonbuchan/as3-to-typescript](https://github.com/simonbuchan/as3-to-typescript),
which is a fork of [the original
as3-to-typescript](https://github.com/fdecampredon/as3-to-typescript)
implementation.

##Installation

- Clone the repository
- Run `npm install`
- Run `./node_modules/.bin/typings install`

##Usage

```
node bin/as3-to-typescript <sourceDir> <outputDir>
```

##Known issues

- `super` calls need to be moved as the first call after conversion.
- having a comment on `extends` statement causes infinite loop parsint the `.as` file.
- having `break` without a semicolon results in infinite loop parsing the `.as` file.
- having a method without access level will throw `Error: invalid consume`.
  (usually this is result of bad copy & paste without renaming the class constructor)
- having inline multiline comment break the parser (`var i = (/*comment*/true)`)
- type casting calls to `Vector.<any>` are not supported and produce commented
  code.


##Note

This tool will not magicly transform your as3 codebase into perfect typescript, the goal is to transform the sources into *syntacticly* correct typescript, and even this goal is not perfectly respected. It also won't try to provide javascript implementation for flash libraries.

However unlike most attempts that I have seen this tool is based on a true actionscript parser, and so should be able to handle most of as3 constructs and greatly ease the pain of porting a large code base written in as3 to typescript.
