"use client";

import { useEffect, useState } from "react";

function greetingFor(hour: number) {
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Uses the visitor's own clock, so it is right in every timezone. */
export default function Greeting() {
  const [text, setText] = useState("Welcome back");

  useEffect(() => {
    setText(greetingFor(new Date().getHours()));
  }, []);

  return <>{text},</>;
}
