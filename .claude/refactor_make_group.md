The current design of scene elements has a two-phase construction problem: an
element is a valid object after `new`, but isn't actually ready until
`makeGroup()` is called. The scene loop happens to always call one then the
other, but nothing in the type system enforces this. Any code that holds an
element reference has no guarantee the group exists.

Analyse the code base and suggest a fix to eliminate the two-phase construction entirely.
Note that some elements need to change the group at run time when reacting to some GUI command,
that's ok. Group can remain mutable as it is now, we just need it to not be uninitialized.
