"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page is orphaned: nothing links to it, and it has no state or submit
// handler of its own — the real "create a property" flow is the modal on
// /properties. Redirect here instead of leaving dead UI that looks real.
export default function AddNewProperty() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/properties");
  }, [router]);

  return null;
}
