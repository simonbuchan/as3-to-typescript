TODO:
- move `super` statements on constructor to first line.

Known issues:
- having `break` without a semicolon results in infinite loop parsing the `.as` file.
- having a method without access level will throw `Error: invalid consume`.
  (usually this is result of bad copy & paste without renaming the class constructor)
- having inline multiline comment break the parser (`var i = (/*comment*/true)`)

Not fixed:
- wildcard imports (`import package.*`)
  is being converted to `import { * } from "../package/*"`, which doesn't work

