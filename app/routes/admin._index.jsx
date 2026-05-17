import { redirect } from "react-router";

export const loader = async () => {
  return redirect("/admin/dashboard");
};

export default function AdminIndex() {
  return null;
}