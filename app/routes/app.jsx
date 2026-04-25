import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";

import polarisEn from "@shopify/polaris/locales/en.json";
import { AppProvider as PolarisProvider, Frame } from "@shopify/polaris";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <PolarisProvider i18n={polarisEn}>
        <Frame>
          <s-app-nav>
            <s-link href="/app">Dashboard</s-link>
            <s-link href="/app/history">Scan History</s-link>
          </s-app-nav>
          <Outlet />
        </Frame>
      </PolarisProvider>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};