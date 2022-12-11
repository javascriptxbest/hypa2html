# Text (Hypa format) -> HTML

Receive stdin, output a HTML page

## Arguments

```shell
-t --title : "some title"
```

## Example

```shell
echo "Some info\n\n@ https://deno.land\n? Deno Land\n" | deno run --allow-read mod.ts
```

## What is Hypa?

Hypa is short for **Hy**pertext **Pa**ge. It's an extremely simple way to author documents whose sole purpose is to have unformatted text, along with gopher/gemini inspired hyperlinks. Ideally, you could take a hypa file and convert it into any hypertext format you like.

Here's the spec:

* blocks are defined per-line
* `@` indicates a link line, non-whitespace text after is part of the link
* `?` indicates a label for the immediately previous link line (otherwise it's considered text)
* `#` indicates a single line comment
* `###` indicates the start or end of a multi-line comment block
* empty string lines (incl. whitespace-only lines) aren't rendered and delimit blocks
* anything else is rendered as a text block

### [Example](https://raw.githubusercontent.com/javascriptxbest/hypa2html/main/example.hypa)

```
This is some text, this would be rendered as a regular paragraph.

@ http://example.com
? This is a label for the above URL, it would be rendered like an interactive text link.

@ /this-text-will-be-visible-because-it-is-not-labeled

# a comment, this shouldn't be rendered, it's purely for making notes

###
a
multline
comment

this of course also won't be rendered, and is also for notes.
###


um... that's it.

```