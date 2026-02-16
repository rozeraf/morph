import fs from 'fs/promises';
import path from 'path';

export const fileToolsDeclarations = [
  {
    name: "read_file",
    description: "Read the content of a file in the project.",
    parameters: {
      type: "OBJECT",
      properties: {
        file_path: {
          type: "STRING",
          description: "The path to the file relative to the project root.",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "write_file",
    description: "Write or update a file in the project.",
    parameters: {
      type: "OBJECT",
      properties: {
        file_path: {
          type: "STRING",
          description: "The path to the file relative to the project root.",
        },
        content: {
          type: "STRING",
          description: "The content to write to the file.",
        },
      },
      required: ["file_path", "content"],
    },
  },
  {
    name: "list_files",
    description: "List files and directories in a given path.",
    parameters: {
      type: "OBJECT",
      properties: {
        dir_path: {
          type: "STRING",
          description: "The directory path relative to the project root.",
        },
      },
      required: ["dir_path"],
    },
  },
];

export const fileToolImplementations: Record<string, Function> = {
  read_file: async ({ file_path }: { file_path: string }) => {
    try {
      const fullPath = path.resolve(process.cwd(), file_path);
      return await fs.readFile(fullPath, 'utf-8');
    } catch (e: any) {
      return `Error reading file: ${e.message}`;
    }
  },
  write_file: async ({ file_path, content }: { file_path: string, content: string }) => {
    try {
      const fullPath = path.resolve(process.cwd(), file_path);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
      return `Successfully wrote to ${file_path}`;
    } catch (e: any) {
      return `Error writing file: ${e.message}`;
    }
  },
  list_files: async ({ dir_path }: { dir_path: string }) => {
    try {
      const fullPath = path.resolve(process.cwd(), dir_path || ".");
      const files = await fs.readdir(fullPath, { withFileTypes: true });
      return files.map(f => `${f.isDirectory() ? '[DIR] ' : ''}${f.name}`).join('\n');
    } catch (e: any) {
      return `Error listing files: ${e.message}`;
    }
  },
};
