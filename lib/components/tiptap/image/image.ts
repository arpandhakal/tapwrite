import { mergeAttributes, nodeInputRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageResizeComponent } from "./ImageResizeComponent";
import Image from "@tiptap/extension-image";

function dataURLToFile(dataURL: string, filename: string): File {
  const [metadata, base64] = dataURL.split(",");
  const mimeString = metadata.split(":")[1].split(";")[0];

  const binaryString = window.atob(base64);
  const arrayBuffer = new ArrayBuffer(binaryString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([uint8Array], { type: mimeString });

  const file = new File([blob], filename, { type: mimeString });
  return file;
}

export interface ImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
  useFigure: boolean;
  readOnly: boolean;
  handleImageUpload?: (file: File) => Promise<void>;
  deleteImage?: (id: string) => Promise<void>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageResize: {
      setImage: (options: {
        src: string;
        alt?: string;
        title?: string;
        width?: string | number;
        height?: string | number;
        isDraggable?: boolean;
      }) => ReturnType;
    };
  }
}
export const inputRegex = /(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))$/;
export const ImageResize = Image.extend<ImageOptions>({
  name: "imageResize",
  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
      useFigure: false,
      readOnly: false,
      handleImageUpload: undefined,
      deleteImage: undefined,
    };
  },
  addCommands() {
    const { deleteImage } = this.options;
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          const uniqueId = `image-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 11)}`;
          const file = dataURLToFile(options.src, uniqueId);
          return commands.insertContent({
            type: this.name,
            attrs: {
              ...options,
              id: uniqueId,
              file: file,
            },
          });
        },
      deleteCurrentNode:
        () =>
        ({ state, dispatch }) => {
          const { selection } = state;

          const node = state.doc.nodeAt(selection.from);

          if (node && node.type.name === this.name) {
            const imageId = node.attrs.id;

            dispatch &&
              dispatch(
                state.tr.replaceWith(
                  selection.from,
                  selection.to,
                  state.schema.nodes.paragraph.create()
                )
              );

            if (deleteImage) {
              deleteImage(imageId);
            }

            return true;
          }

          return false;
        },
    };
  },
  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => editor.commands.deleteCurrentNode(),
      Delete: ({ editor }) => editor.commands.deleteCurrentNode(),
    };
  },
  addAttributes() {
    return {
      id: { default: null },
      file: { default: undefined },
      class: { default: "image-display" },
      width: {
        default: "100%",
        renderHTML: (attributes) => {
          return {
            width: attributes.width,
          };
        },
      },
      Padding: "200px",
      height: {
        default: "0",
        renderHTML: (attributes) => {
          return {
            height: attributes.height,
          };
        },
      },
      isDraggable: {
        default: true,
        renderHTML: () => {
          return {};
        },
      },
      src: {
        default: "",
        renderHTML: (attributes) => {
          return {
            src: attributes.src,
          };
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "image-resizer",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "image-resizer",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageResizeComponent);
  },
  addInputRules() {
    return [
      nodeInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: (match) => {
          const [, , alt, src, title, height, width, isDraggable] = match;
          return { src, alt, title, height, width, isDraggable };
        },
      }),
    ];
  },
});
