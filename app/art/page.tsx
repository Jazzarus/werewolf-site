import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Community Art",
  description: "Artwork shared by the Werewolf community.",
};

export default function Art() {
  return (
    <main>
      <h1>Community Art</h1>
      <figure>
        <Image
          src="/assets/white-wolf-art.webp"
          alt="A white wolf standing on dark stone beneath the full moon"
          width={3836}
          height={2156}
          sizes="(max-width: 60rem) 100vw, min(68rem, 80vw)"
        />
        <figcaption>
          Made by{" "}
          <a
            href="https://www.youtube.com/watch?v=iuEWuFqv91k"
            target="_blank"
            rel="noreferrer"
          >
            Artpophis
          </a>
        </figcaption>
      </figure>
    </main>
  );
}
