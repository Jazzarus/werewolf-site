import fs from "node:fs";
import path from "node:path";
import { remark } from "remark";
import html from "remark-html";
import styles from "./werewolf-general.module.css";

export default async function WerewolfGeneral() {
  const articlePath = path.join(
    process.cwd(),
    "content",
    "werewolf-general.md",
  );
  const markdown = fs.readFileSync(articlePath, "utf8");
  const article = await remark().use(html).process(markdown);

  return (
    <main>
      <h1>Werewolf General Guide</h1>
      <article
        className={styles.article}
        dangerouslySetInnerHTML={{ __html: article.toString() }}
      />
    </main>
  );
}
