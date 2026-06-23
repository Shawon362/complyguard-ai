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

export const meta = () => [
  { title: "ComplyGuard AI — Automated Store Compliance for Shopify" },
  {
    name: "description",
    content:
      "Scan your Shopify store for GDPR, CCPA, and EU AI Act compliance issues. Auto-fix violations and generate audit-ready reports.",
  },
];

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.page}>
      {/* ===== NAV BAR ===== */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>CG</div>
            <span className={styles.brandName}>ComplyGuard AI</span>
          </div>
          <div className={styles.navLinks}>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="mailto:support@shopiters.com">Support</a>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.badge}>
            <span className={styles.badgeDot}></span>
            AI-Powered Compliance for Shopify
          </div>

          <h1 className={styles.heading}>
            Stay Compliant.<br />
            Avoid Fines. Build Trust.
          </h1>

          <p className={styles.subheading}>
            ComplyGuard AI scans your store for GDPR, CCPA, and EU AI Act
            compliance issues — then helps you fix them in one click.
          </p>

          {showForm && (
            <Form
              className={styles.form}
              method="post"
              action="/auth/login"
            >
              <label className={styles.label}>Enter your store domain</label>
              <div className={styles.formRow}>
                <input
                  className={styles.input}
                  type="text"
                  name="shop"
                  placeholder="my-store.myshopify.com"
                />
                <button className={styles.button} type="submit">
                  Install App
                </button>
              </div>
              <p className={styles.formHint}>
                Free plan available · No credit card required
              </p>
            </Form>
          )}
        </div>
      </section>

      {/* ===== TRUST BADGES ===== */}
      <section className={styles.trust}>
        <div className={styles.trustInner}>
          <div className={styles.trustItem}>
            <span className={styles.trustCheck}>✓</span>
            <div>
              <strong>GDPR</strong>
              <span>Compliant</span>
            </div>
          </div>
          <div className={styles.trustDivider}></div>
          <div className={styles.trustItem}>
            <span className={styles.trustCheck}>✓</span>
            <div>
              <strong>CCPA</strong>
              <span>Ready</span>
            </div>
          </div>
          <div className={styles.trustDivider}></div>
          <div className={styles.trustItem}>
            <span className={styles.trustCheck}>✓</span>
            <div>
              <strong>EU AI Act</strong>
              <span>Covered</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <h2 className={styles.sectionTitle}>
            Everything you need to stay compliant
          </h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔍</div>
              <h3>AI-Powered Scanning</h3>
              <p>
                Automatically detect GDPR, CCPA, and EU AI Act issues across
                your products, images, and store policies.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>⚡</div>
              <h3>One-Click Auto-Fix</h3>
              <p>
                Resolve common compliance violations instantly — no legal
                expertise required.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📄</div>
              <h3>Compliance Reports</h3>
              <p>
                Generate professional PDF reports to document your compliance
                status for audits and peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className={styles.steps}>
        <div className={styles.stepsInner}>
          <h2 className={styles.sectionTitle}>How it works</h2>
          <div className={styles.stepGrid}>
            <div className={styles.step}>
              <div className={styles.stepNum}>1</div>
              <h4>Install</h4>
              <p>Add ComplyGuard AI to your Shopify store in seconds.</p>
            </div>
            <div className={styles.stepArrow}>→</div>
            <div className={styles.step}>
              <div className={styles.stepNum}>2</div>
              <h4>Scan</h4>
              <p>Run an AI-powered compliance scan across your store.</p>
            </div>
            <div className={styles.stepArrow}>→</div>
            <div className={styles.step}>
              <div className={styles.stepNum}>3</div>
              <h4>Fix</h4>
              <p>Apply one-click fixes and download your report.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.brandMark}>CG</div>
            <span>ComplyGuard AI</span>
          </div>
          <div className={styles.footerLinks}>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="mailto:support@shopiters.com">Support</a>
          </div>
          <div className={styles.footerCopy}>
            © {new Date().getFullYear()} Microters LLC. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}