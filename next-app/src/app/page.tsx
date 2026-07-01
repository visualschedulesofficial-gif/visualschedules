import { redirect } from "next/navigation";

// No landing page — go straight to the schedule builder.
export default function Home() {
  redirect("/schedule");
}
