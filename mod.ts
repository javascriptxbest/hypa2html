import { getStdin } from "https://deno.land/x/get_stdin@v1.1.0/mod.ts";
import { Arguments } from "https://deno.land/x/allo_arguments@v6.0.4/mod.ts";

interface URLType {
  type: "link";
  data: {
    url: string;
    label?: string;
  };
}

interface TextType {
  type: "text";
  data: string;
}

type BlockInfo = URLType | TextType;

interface Args {
  title: string | undefined;
  help: boolean;
}

const defaultTitle = "Some hypertext";

try {
  await main(getArguments());
} catch (error) {
  Arguments.rethrowUnprintableException(error);
}

async function main(args: Args) {
  if (args.help) return;
  const value = await getStdin({ exitOnEnter: false });
  const lines = value.split(`\n`);

  const blocks: BlockInfo[] = [];

  let isComment = false;
  let isLink = false;

  /**
   * hypa definition:
   * blocks are defined per-line.
   * @ indicates a link, which might be followed by a line with ?
   * ? indicates a label for the previous link line (otherwise it's considered text)
   * # indicates a single line comment
   * ### indicates the start or end of a multi-line comment block
   * empty string lines (incl. whitespace-only lines) aren't rendered and delimit blocks
   * anything else is rendered as a text block
   */

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    const firstChar = line.substring(0, 1);
    if (isComment) { // waiting for ###
      if (line.substring(0, 3) === "###") { // end comment
        isComment = false;
      }
    } else if (isLink) { // waiting for ? or finish creating link
      if (firstChar === "?") { // set label
        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock.type === "link") {
          lastBlock.data.label = line.substring(2);
        } else {
          throw Error(`Somehow adding label for missing link at line: ${i}`);
        }
      }
      isLink = false; // link is completed
    } else {
      if (firstChar === "@") { // is a link
        isLink = true;
        blocks.push({ type: "link", data: { url: line.substring(2) } });
      } else if (firstChar === "#") { // ignore content, and check if single or multiline comment
        if (line.substring(0, 3) === "###") { // is multiline comment
          isComment = true;
        }
      } else if (line) { // everything else is text, as long as it isn't an empty string
        blocks.push({ type: "text", data: line });
      }
    }
  }

  const output = await buildHTML(args.title ?? defaultTitle, blocks);

  Deno.stdout.write(new TextEncoder().encode(output));
}

function getArguments(): Args {
  const info = [
    "This program interprets a formatted text file as an 'hypa' formatted plaintext file.",
    "It outputs this file as an HTML document.",
  ];
  const args = new Arguments({
    ...Arguments.createHelpOptions(),
    "title": {
      shortName: "t",
      description: "A header for the output document",
      convertor: Arguments.stringConvertor,
    },
  })
    .setDescription(info.join(`\n`));

  if (args.isHelpRequested()) args.triggerHelp();

  return args.getFlags();
}

async function buildHTML(header: string, blockData: BlockInfo[]) {
  const css = await renderCSS();
  const blocks = blockData.map((block) => {
    switch (block.type) {
      case "link":
        return renderLink(block.data.url, block.data.label);
      case "text":
        return renderText(block.data);
    }
  }).join(``);

  const doc = `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>${header}</title>
    <style>${css}</style>
	</head>
	<body>
		<main>${blocks}</main>
	</body>
	</html>
	`;

  return doc;
}

async function renderCSS() {
  const module = await fetch(new URL("./render.css", import.meta.url));
  const css = await module.text();
  return css;
}

function renderLink(url: string, label?: string) {
  return `
  <div>
    <a href="${url}">${label || url}</a>
  </div>
	`;
}

function renderText(text: string) {
  return `<p>${text}</p>`;
}
