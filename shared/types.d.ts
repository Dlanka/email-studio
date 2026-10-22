declare module "mjml" {
  interface MjmlError {
    line: number;
    message: string;
    tagName?: string;
    formattedMessage?: string;
  }

  interface MjmlResult {
    html: string;
    errors?: MjmlError[];
  }

  interface MjmlOptions {
    filePath?: string;
    validationLevel?: "strict" | "soft" | "skip";
    minify?: boolean;
    beautify?: boolean;
    keepComments?: boolean;
  }

  export default function mjml2html(
    mjmlContent: string,
    options?: MjmlOptions
  ): Promise<MjmlResult>;
}
