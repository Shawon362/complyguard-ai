// ============================================================
// Fix AI Image — Multi-action comprehensive fix
// Applies ALL EU AI Act Article 50(4) compliance actions:
//   1. Update alt-text with AI disclosure
//   2. Add visible disclaimer banner to product description
//   3. Add schema.org creditText metafield
// ============================================================
export async function fixAIImage(admin, evidence) {
  const { imageUrl, productTitle } = evidence;

  if (!productTitle) {
    return { success: false, message: "Product title not found" };
  }

  // ── Step 1: Find product ──
  const productQuery = await admin.graphql(`
    query findProduct($query: String!) {
      products(first: 1, query: $query) {
        nodes {
          id
          descriptionHtml
          media(first: 20) {
            nodes {
              ... on MediaImage {
                id
                image { url }
              }
            }
          }
        }
      }
    }
  `, { variables: { query: `title:"${productTitle}"` } });

  const productData = await productQuery.json();
  const product = productData.data?.products?.nodes?.[0];

  if (!product) {
    return { success: false, message: `Product "${productTitle}" not found` };
  }

  const targetImage = product.media.nodes.find(
    (m) => m.image && m.image.url === imageUrl
  );

  if (!targetImage) {
    return { success: false, message: "Image not found" };
  }

  // ── Track what was successfully updated ──
  const completedActions = [];
  const failedActions = [];

  // ============================================================
  // ACTION 1: Update alt-text
  // ============================================================
  try {
    const altText = `${productTitle} (AI-generated product visualization)`;

    const altUpdate = await admin.graphql(`
      mutation updateMedia($media: [UpdateMediaInput!]!, $productId: ID!) {
        productUpdateMedia(media: $media, productId: $productId) {
          media { alt }
          mediaUserErrors { field, message }
        }
      }
    `, {
      variables: {
        productId: product.id,
        media: [{ id: targetImage.id, alt: altText }],
      },
    });

    const altResult = await altUpdate.json();
    const altErrors = altResult.data?.productUpdateMedia?.mediaUserErrors;

    if (altErrors && altErrors.length > 0) {
      failedActions.push(`Alt-text: ${altErrors[0].message}`);
    } else {
      completedActions.push("Alt-text updated");
    }
  } catch (error) {
    failedActions.push(`Alt-text: ${error.message}`);
  }

  // ============================================================
  // ACTION 2 + 3: Add AI disclaimer to product description
  // ============================================================
  try {
    const currentDescription = product.descriptionHtml || "";

    // Skip if already has AI disclaimer
    const alreadyHasDisclaimer =
      currentDescription.toLowerCase().includes("ai-generated") ||
      currentDescription.toLowerCase().includes("artificial intelligence") ||
      currentDescription.toLowerCase().includes("ai disclosure");

    if (!alreadyHasDisclaimer) {
      const aiDisclaimerBanner = `
<div style="background: #FFF4E6; border-left: 4px solid #F49342; padding: 12px 16px; margin-bottom: 16px; border-radius: 4px; font-size: 14px;">
  <strong>⚠️ AI-Generated Image Notice:</strong> Product images on this page include AI-generated visualizations. Actual product may vary. This disclosure is provided in compliance with the EU AI Act (Regulation 2024/1689, Article 50).
</div>
`;

      const updatedDescription = aiDisclaimerBanner + currentDescription;

      const descUpdate = await admin.graphql(`
        mutation updateProduct($input: ProductInput!) {
          productUpdate(input: $input) {
            product { id }
            userErrors { field, message }
          }
        }
      `, {
        variables: {
          input: {
            id: product.id,
            descriptionHtml: updatedDescription,
          },
        },
      });

      const descResult = await descUpdate.json();
      const descErrors = descResult.data?.productUpdate?.userErrors;

      if (descErrors && descErrors.length > 0) {
        failedActions.push(`Description: ${descErrors[0].message}`);
      } else {
        completedActions.push("AI disclaimer added to description");
      }
    } else {
      completedActions.push("Description already has AI disclosure (skipped)");
    }
  } catch (error) {
    failedActions.push(`Description: ${error.message}`);
  }

  // ============================================================
  // ACTION 4: Add schema.org creditText metafield
  // ============================================================
  try {
    const metafieldUpdate = await admin.graphql(`
      mutation setMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id key namespace value }
          userErrors { field, message }
        }
      }
    `, {
      variables: {
        metafields: [
          {
            ownerId: product.id,
            namespace: "seo",
            key: "credit_text",
            type: "single_line_text_field",
            value: "AI-generated product visualization",
          },
          {
            ownerId: product.id,
            namespace: "compliance",
            key: "ai_generated",
            type: "boolean",
            value: "true",
          },
        ],
      },
    });

    const metaResult = await metafieldUpdate.json();
    const metaErrors = metaResult.data?.metafieldsSet?.userErrors;

    if (metaErrors && metaErrors.length > 0) {
      failedActions.push(`Metafield: ${metaErrors[0].message}`);
    } else {
      completedActions.push("Schema.org metafield added");
    }
  } catch (error) {
    failedActions.push(`Metafield: ${error.message}`);
  }

  // ============================================================
  // Build final result message
  // ============================================================
  if (completedActions.length === 0) {
    return {
      success: false,
      message: `All actions failed: ${failedActions.join("; ")}`,
    };
  }

  let message = `Applied ${completedActions.length} of ${completedActions.length + failedActions.length} actions: ${completedActions.join(", ")}`;
  if (failedActions.length > 0) {
    message += ` | Failed: ${failedActions.join("; ")}`;
  }

  return {
    success: true,
    message,
    actions: { completed: completedActions, failed: failedActions },
  };
}