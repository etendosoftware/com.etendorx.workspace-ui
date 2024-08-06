import { useEffect } from "react";
import { Metadata } from "../api/metadata";

export default function useSession() {
  useEffect(() => {
    Metadata.getSession();
  }, []);

  return window.OB;
}
