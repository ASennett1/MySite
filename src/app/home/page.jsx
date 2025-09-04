// app/page.tsx
"use client";
import Link from "next/link";


import { useEffect, useState } from "react";

export default function HomePage() {
  const projects = [
    { title: "Portfolio Site", description: "Built with Next.js + Tailwind", link: "#" },
    { title: "Game Tracker", description: "React project to track games", link: "#" },
    { title: "Todo App", description: "Simple JS todo app", link: "#" },
  ];

  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/auth/callback")
      .then((res) => res.text()) // Yahoo Fantasy API returns XML
      .then((text) => setData(text));
  }, []);

  return (
    <main className="max-w-5xl mx-auto p-8 space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <h1 className="text-5xl font-bold">Hi, I'm Andy!</h1>
        <p className="text-lg text-gray-700">
          Welcome to my showcase site. I build web projects using Next.js, Tailwind, and JavaScript.
        </p>
        <Link href="#projects" className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          View My Projects
        </Link>
      </section>

      {/* About Section */}
      <section id="about" className="space-y-4">
        <h2 className="text-3xl font-bold">About Me</h2>
        <p className="text-gray-700">
          I’m a developer passionate about creating interactive and visually appealing websites.
          I enjoy learning new technologies and improving my skills with each project.
        </p>
      </section>

      {/* Projects Section */}
      <section id="projects" className="space-y-4">
        <h2 className="text-3xl font-bold">Projects</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((proj, i) => (
            <div key={i} className="p-4 border rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-xl font-semibold">{proj.title}</h3>
              <p className="mt-2 text-gray-600">{proj.description}</p>
              <a href={proj.link} className="text-blue-600 underline mt-2 block">
                View Project
              </a>
            </div>
          ))}
        </div>
      </section>
    </main>
  );

  
}
