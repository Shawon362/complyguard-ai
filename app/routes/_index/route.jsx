import { redirect, Form, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>
          Stay Compliant. Avoid Fines. Build Trust.
        </h1>
        <p className={styles.text}>
          ComplyGuard AI scans your store for GDPR, CCPA, and EU AI Act
          compliance issues — then helps you fix them in one click.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input
                className={styles.input}
                type="text"
                name="shop"
                placeholder="my-shop-domain.myshopify.com"
              />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>AI-Powered Compliance Scanning</strong>. Automatically
            detect GDPR, CCPA, and EU AI Act issues across your products,
            images, and store policies.
          </li>
          <li>
            <strong>One-Click Auto-Fix</strong>. Resolve common compliance
            violations instantly — no legal expertise required.
          </li>
          <li>
            <strong>Downloadable Compliance Reports</strong>. Generate
            professional PDF reports to document your compliance status for
            audits and peace of mind.
          </li>
        </ul>
      </div>
    </div>
  );
}