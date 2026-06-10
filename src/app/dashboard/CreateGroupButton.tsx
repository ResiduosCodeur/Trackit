"use client";

export default function CreateGroupButton() {
  async function createGroup() {
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Goa Trip",
      }),
    });

    const data = await res.json();

    console.log(data);
  }

  return <button onClick={createGroup}>Create Group</button>;
}
