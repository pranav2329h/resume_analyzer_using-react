import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RESUMER" },
    { name: "description", content: "Welcome to RESUMER!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
