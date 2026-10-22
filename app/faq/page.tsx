import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { renderArticleMarkdown } from "@/lib/markdown";
import styles from "./faq.module.css";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about the Path of Exile 2 werewolf.",
};

export default async function FAQ() {
  const articlePath = path.join(process.cwd(), "content", "faq.md");
  const markdown = fs.readFileSync(articlePath, "utf8");
  const article = await renderArticleMarkdown(markdown, "faq");

  return (
    <main>
      <h1>FAQ</h1>
      <article
        className={styles.article}
        dangerouslySetInnerHTML={{ __html: article }}
      />
    </main>
  );
}
