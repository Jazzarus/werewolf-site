import { defineConfig } from "tinacms";

export default defineConfig({
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  schema: {
    collections: [
      {
        name: "guide",
        label: "Guides",
        path: "content/guides",
        format: "md",
        frontmatterFormat: "yaml",
        ui: {
          router: ({ document }) =>
            `/werewolf/${document._sys.filename}`,
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "image",
            name: "image",
            label: "Card image",
            required: true,
          },
          {
            type: "string",
            name: "class",
            label: "Class",
            required: true,
          },
          {
            type: "string",
            name: "tier",
            label: "Tier",
            required: true,
          },
          {
            type: "object",
            name: "sections",
            label: "Sections",
            list: true,
            required: true,
            ui: {
              itemProps: (item) => ({
                label: item?.title || "New section",
              }),
            },
            fields: [
              {
                type: "string",
                name: "title",
                label: "Title",
                required: true,
              },
              {
                type: "rich-text",
                name: "content",
                label: "Content",
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },
});
